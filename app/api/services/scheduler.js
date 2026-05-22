const mongoose = require('mongoose');
import { schedulerValidator } from '../validator/user';
import Scheduler from '../models/scheduler';
import Project from '../models/project';
import User from '../models/user';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
import { logger } from '../utils/logger';
import {
  SCHEDULER_STATUS,
  normalizeSchedulerStatus,
  isSchedulerInProgress
} from '../constants/statuses';

mongoConnect();

// Helper function to extract time from date
const extractTimeFromDate = (dateString) => {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const normalizeActor = (user) => ({
  userId: user?.id || user?.sub || user?.user?.id || null,
  role: user?.role || user?.user?.role || null,
  integratorId:
    user?.integrator ||
    user?.integrator_id ||
    user?.user?.integrator ||
    user?.user?.integrator_id ||
    null
});

const getScheduleReceivingIntegratorId = (schedule) =>
  schedule?.receivingIntegratorId?._id?.toString?.() ||
  schedule?.receivingIntegratorId?.toString?.() ||
  schedule?.engineer?.integrator?._id?.toString?.() ||
  schedule?.engineer?.integrator?.toString?.() ||
  null;

const getSchedulePayingIntegratorId = (schedule) =>
  schedule?.payingIntegrator?._id?.toString?.() ||
  schedule?.payingIntegrator?.toString?.() ||
  schedule?.integrator?._id?.toString?.() ||
  schedule?.integrator?.toString?.() ||
  null;

const isEngineerActor = (schedule, actor) =>
  !!actor.userId && schedule?.engineer?._id?.toString?.() === actor.userId.toString();

const isReceivingIntegratorActor = (schedule, actor) =>
  actor.role === 'integrator' &&
  !!actor.integratorId &&
  getScheduleReceivingIntegratorId(schedule) === actor.integratorId.toString();

const isAuthorizedExecutionActor = (schedule, actor) =>
  isEngineerActor(schedule, actor) ||
  (actor.role === 'integrator' &&
    !!actor.integratorId &&
    [getSchedulePayingIntegratorId(schedule), getScheduleReceivingIntegratorId(schedule)].includes(
      actor.integratorId.toString()
    ));

const buildStatusUpdate = (schedule, actor, targetStatus, payload = {}) => {
  const currentStatus = normalizeSchedulerStatus(schedule.status);
  const nextStatus = normalizeSchedulerStatus(targetStatus);
  const now = new Date();

  if (!nextStatus) {
    throw Object.assign(new Error('Target status is required'), { statusCode: 400 });
  }

  const invalidTransition = () =>
    Object.assign(
      new Error(`Cannot transition schedule from ${currentStatus} to ${nextStatus}.`),
      { statusCode: 400 }
    );

  switch (currentStatus) {
    case SCHEDULER_STATUS.PENDING:
      if (nextStatus === SCHEDULER_STATUS.ACCEPTED && isEngineerActor(schedule, actor)) {
        return { status: nextStatus, acceptedAt: now };
      }

      if (nextStatus === SCHEDULER_STATUS.DECLINED && isEngineerActor(schedule, actor)) {
        return { status: nextStatus };
      }
      break;

    case SCHEDULER_STATUS.ACCEPTED:
      if (nextStatus === SCHEDULER_STATUS.APPROVED && isReceivingIntegratorActor(schedule, actor)) {
        return {
          status: nextStatus,
          approvedAt: now,
          approvedByIntegrator: actor.integratorId,
          approvedByUser: actor.userId,
          approvalNotes: payload.approvalNotes || schedule.approvalNotes || ''
        };
      }
      break;

    case SCHEDULER_STATUS.APPROVED:
      if (nextStatus === SCHEDULER_STATUS.AWAITING_PAYMENT && actor.role === 'integrator') {
        return {
          status: nextStatus,
          awaitingPaymentAt: schedule.awaitingPaymentAt || now
        };
      }
      break;

    case SCHEDULER_STATUS.READY_TO_START:
      if (nextStatus === SCHEDULER_STATUS.IN_PROGRESS && isAuthorizedExecutionActor(schedule, actor)) {
        return {
          status: nextStatus,
          startedAt: schedule.startedAt || now
        };
      }
      break;

    case SCHEDULER_STATUS.IN_PROGRESS:
      if (nextStatus === SCHEDULER_STATUS.COMPLETED && isAuthorizedExecutionActor(schedule, actor)) {
        return {
          status: nextStatus,
          completedAt: now
        };
      }
      break;

    default:
      break;
  }

  throw invalidTransition();
};

const buildPaymentPendingUpdate = ({
  schedule,
  payingIntegratorId,
  receivingIntegratorId,
  estimatedAmount,
  platformFeeAmount,
  receiverAmount,
  paymentIntentId,
  paymentStatus = 'pending'
}) => {
  const now = new Date();
  const currentStatus = normalizeSchedulerStatus(schedule.status);

  return {
    payingIntegrator: payingIntegratorId,
    receivingIntegratorId,
    estimatedAmount,
    platformFeeAmount,
    receiverAmount,
    paymentIntentId,
    paymentStatus,
    paymentInitiatedAt: now,
    status:
      currentStatus === SCHEDULER_STATUS.APPROVED
        ? SCHEDULER_STATUS.AWAITING_PAYMENT
        : currentStatus,
    awaitingPaymentAt:
      currentStatus === SCHEDULER_STATUS.APPROVED
        ? schedule.awaitingPaymentAt || now
        : schedule.awaitingPaymentAt
  };
};

const buildPaymentSucceededUpdate = (schedule, transferData = {}) => {
  const now = new Date();

  return {
    paymentStatus: 'succeeded',
    status: SCHEDULER_STATUS.READY_TO_START,
    paymentSucceededAt: now,
    paidAt: schedule.paidAt || now,
    readyToStartAt: schedule.readyToStartAt || now,
    transferStatus: transferData.transferStatus,
    transferId: transferData.transferId,
    transferInitiatedAt: transferData.transferInitiatedAt
  };
};

const buildPaymentFailedUpdate = () => ({
  paymentStatus: 'failed',
  status: SCHEDULER_STATUS.PAYMENT_FAILED
});

async function getByUser(user_id) {
  try {
    const query = {};

    if (user_id) {
      if (!mongoose.isValidObjectId(user_id)) {
        throw new Error(JSON.stringify([{ field: 'user_id', message: 'Invalid MongoDB ObjectId' }]));
      }
      query.engineer = user_id;
    }

    // Only return future schedules and those starting today
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of current day

    query.startDate = { $gte: now };

    const result = await Scheduler.find(query).populate('engineer', 'first_name last_name email');
    return { data: result };
  } catch (error) {
    logger.error(error);
    throw new Error('Unexpected server error');
  }
}

async function add(body) {
  const bodyErrors = schedulerValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  const { startDate, endDate, startTime, endTime, ...rest } = body;
  
  // Extract time from dates if startTime/endTime not provided
  const derivedStartTime = startTime || extractTimeFromDate(startDate);
  const derivedEndTime = endTime || extractTimeFromDate(endDate);
  
  const schedulerData = {
    ...rest,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    startTime: derivedStartTime,
    endTime: derivedEndTime
  };

  try {
    const engineer = await User.findById(body.engineer).select('integrator');

    if (!engineer) {
      throw new Error('Engineer not found');
    }

    schedulerData.receivingIntegratorId =
      body.receivingIntegratorId || engineer.integrator?.toString?.() || engineer.integrator;
    schedulerData.payingIntegrator = body.payingIntegrator || body.integrator;

    const scheduler = await Scheduler.create(schedulerData);
    await scheduler.populate('engineer', 'first_name last_name email');
    return scheduler;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function update(suid, id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = schedulerValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  // Extract time from dates if startTime/endTime not provided
  const derivedStartTime = body.startTime || extractTimeFromDate(body.startDate);
  const derivedEndTime = body.endTime || extractTimeFromDate(body.endDate);

  try {
    const result = await Scheduler.findOneAndUpdate(
      { _id: id, integrator: suid },
      {
        ...body,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        startTime: derivedStartTime,
        endTime: derivedEndTime,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('engineer', 'first_name last_name email');

    return result;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function updateByStatus(id, user, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const actor = normalizeActor(user);

    if (!isValidObjectId(actor.userId || '')) {
      throw new Error(JSON.stringify([{ field: 'user_id', message: 'Invalid MongoDB ObjectId' }]));
    }

    const schedule = await Scheduler.findById(id)
      .populate('engineer', 'first_name last_name email integrator')
      .populate('project', 'name')
      .populate('payingIntegrator', 'name')
      .populate('receivingIntegratorId', 'name');

    if (!schedule) {
      throw Object.assign(new Error('Schedule not found'), { statusCode: 404 });
    }

    const update = buildStatusUpdate(schedule, actor, body.status, body);

    const result = await Scheduler.findByIdAndUpdate(
      id,
      {
        ...update,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('engineer', 'first_name last_name email integrator')
      .populate('project', 'name')
      .populate('payingIntegrator', 'name')
      .populate('receivingIntegratorId', 'name');

    return result;
  } catch (error) {
    logger.error(error);
    if (error.statusCode) {
      throw error;
    }

    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function remove(suid, id) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    await Scheduler.findOneAndDelete({ _id: id, integrator: suid });

    return true;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getByProjectDateRange(projectId) {
  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    // Get the project to find its start and end dates
    const project = await Project.findById(projectId, { startDate: 1, endDate: 1 });

    if (!project) {
      throw new Error('Project not found');
    }

    // Find all schedules for this project that fall within the project's date range
    const schedules = await Scheduler.find({
      project: projectId,
      startDate: { $gte: project.startDate },
      endDate: { $lte: project.endDate }
    }).populate('engineer', 'first_name last_name role secure_url');

    // Transform the result to include schedule ID and engineer info
    const result = schedules.map((schedule) => ({
      scheduleId: schedule._id,
      engineerId: schedule.engineer?._id,
      firstName: schedule.engineer?.first_name || '',
      lastName: schedule.engineer?.last_name || '',
      role: schedule.engineer?.role || '',
      avatar: schedule.engineer?.secure_url || '',
      status: schedule.status
    }));

    return { data: result };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getAllSchedules(integratorId) {
  try {
    if (!mongoose.isValidObjectId(integratorId)) {
      throw new Error(JSON.stringify([{ field: 'integratorId', message: 'Invalid MongoDB ObjectId' }]));
    }

    const result = await Scheduler.find({
      $or: [{ integrator: integratorId }, { receivingIntegratorId: integratorId }, { payingIntegrator: integratorId }]
    })
      .populate('engineer', 'first_name last_name email integrator')
      .populate('project', 'name')
      .populate('payingIntegrator', 'name')
      .populate(
        'receivingIntegratorId',
        'name stripeConnectAccountId connectAccountStatus chargesEnabled payoutsEnabled'
      );

    return { data: result };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected server error occurred.');
  }
}

export {
  remove,
  add,
  getByUser,
  update,
  updateByStatus,
  getByProjectDateRange,
  getAllSchedules,
  normalizeActor,
  getScheduleReceivingIntegratorId,
  getSchedulePayingIntegratorId,
  buildPaymentPendingUpdate,
  buildPaymentSucceededUpdate,
  buildPaymentFailedUpdate
};
