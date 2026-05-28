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
import notificationEvents from './notificationEvents';

mongoConnect();

// Helper function to extract time from date
const extractTimeFromDate = (dateString) => {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const createDefaultStatusCounts = () => ({
  [SCHEDULER_STATUS.PENDING]: 0,
  [SCHEDULER_STATUS.ACCEPTED]: 0,
  [SCHEDULER_STATUS.APPROVED]: 0,
  [SCHEDULER_STATUS.AWAITING_PAYMENT]: 0,
  [SCHEDULER_STATUS.READY_TO_START]: 0,
  [SCHEDULER_STATUS.IN_PROGRESS]: 0,
  [SCHEDULER_STATUS.COMPLETED]: 0,
  [SCHEDULER_STATUS.CANCELLED]: 0,
  [SCHEDULER_STATUS.PAYMENT_FAILED]: 0,
  [SCHEDULER_STATUS.DECLINED]: 0,
  [SCHEDULER_STATUS.PAID]: 0
});

const createEngineerScheduleQuery = ({ engineerId, date, status }) => {
  const query = { engineer: toObjectId(engineerId) };

  if (date) {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    query.startDate = { $lte: endOfDay };
    query.endDate = { $gte: startOfDay };
  }

  if (status) {
    const rawStatuses = Array.isArray(status)
      ? status
      : String(status).split(',').map((item) => item.trim()).filter(Boolean);

    query.status = { $in: [...new Set(rawStatuses.flatMap(expandStatusAlias))] };
  }

  return query;
};

const assertEngineerAggregateAccess = async ({ actor, engineerId }) => {
  if (!actor) {
    return;
  }

  const actorUserId = actor.userId?.toString?.();
  const targetEngineerId = engineerId.toString();

  if (actor.role === 'engineer') {
    if (!actorUserId || actorUserId !== targetEngineerId) {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
    }
    return;
  }

  if (actor.role === 'integrator') {
    if (!actor.integratorId) {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
    }

    const engineer = await User.findById(engineerId).select('integrator');
    if (!engineer || engineer.integrator?.toString() !== actor.integratorId.toString()) {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
    }
    return;
  }

  if (actor.role !== 'admin') {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
  }
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
    if (!schedule) {
      throw Object.assign(new Error('Schedule not found'), { statusCode: 404 });
    }

    const currentStatus = normalizeSchedulerStatus(schedule.status);
    const targetStatus = normalizeSchedulerStatus(body.status);

    const update = buildStatusUpdate(schedule, actor, body.status, body);

    const result = await Scheduler.findByIdAndUpdate(
      id,
      {
        ...update,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )

    // Wire notification events after successful status update
    try {
      // ACCEPTED: Engineer accepts -> notify receiving integrator (A)
      if (currentStatus === SCHEDULER_STATUS.PENDING && targetStatus === SCHEDULER_STATUS.ACCEPTED) {
        await notificationEvents.bookingAccepted({
          scheduleId: result._id,
          receivingIntegratorId: result.receivingIntegratorId?._id,
          engineerName: result.engineer?.first_name || 'Engineer',
          projectName: result.project?.name || 'Project'
        });
      }

      // DECLINED: Engineer declines -> notify paying integrator (B)
      else if (currentStatus === SCHEDULER_STATUS.PENDING && targetStatus === SCHEDULER_STATUS.DECLINED) {
        await notificationEvents.bookingDeclined({
          scheduleId: result._id,
          payingIntegratorId: result.payingIntegrator?._id,
          engineerName: result.engineer?.first_name || 'Engineer',
          projectName: result.project?.name || 'Project'
        });
      }

      // APPROVED: Receiving integrator (A) approves -> notify engineer and paying integrator (B)
      else if (currentStatus === SCHEDULER_STATUS.ACCEPTED && targetStatus === SCHEDULER_STATUS.APPROVED) {
        await notificationEvents.bookingApproved({
          scheduleId: result._id,
          engineerId: result.engineer?._id,
          payingIntegratorId: result.payingIntegrator?._id,
          projectName: result.project?.name || 'Project',
          siteLocation: result.project?.location || '',
          startDate: result.startDate
        });
      }

      // READY_TO_START: After payment succeeds (status changed from AwaitingPayment)
      else if (
        (currentStatus === SCHEDULER_STATUS.AWAITING_PAYMENT ||
          currentStatus === SCHEDULER_STATUS.PAID) &&
        targetStatus === SCHEDULER_STATUS.READY_TO_START
      ) {
        await notificationEvents.readyToStart({
          scheduleId: result._id,
          engineerId: result.engineer?._id,
          projectName: result.project?.name || 'Project',
          siteLocation: result.project?.location || '',
          startDate: result.startDate
        });
      }

      // IN_PROGRESS: Engineer marks work as started
      else if (targetStatus === SCHEDULER_STATUS.IN_PROGRESS && currentStatus !== SCHEDULER_STATUS.IN_PROGRESS) {
        await notificationEvents.workStarted({
          scheduleId: result._id,
          payingIntegratorId: result.payingIntegrator?._id,
          receivingIntegratorId: result.receivingIntegratorId?._id,
          projectName: result.project?.name || 'Project',
          engineerName: result.engineer?.first_name || 'Engineer'
        });
      }

      // COMPLETED: Engineer marks work as completed
      else if (targetStatus === SCHEDULER_STATUS.COMPLETED && currentStatus !== SCHEDULER_STATUS.COMPLETED) {
        await notificationEvents.workCompleted({
          scheduleId: result._id,
          payingIntegratorId: result.payingIntegrator?._id,
          receivingIntegratorId: result.receivingIntegratorId?._id,
          projectName: result.project?.name || 'Project',
          engineerName: result.engineer?.first_name || 'Engineer'
        });
      }

      // CANCELLED: Schedule cancelled
      else if (targetStatus === SCHEDULER_STATUS.CANCELLED && currentStatus !== SCHEDULER_STATUS.CANCELLED) {
        await notificationEvents.scheduleCancelled({
          scheduleId: result._id,
          engineerId: result.engineer?._id,
          payingIntegratorId: result.payingIntegrator?._id,
          receivingIntegratorId: result.receivingIntegratorId?._id,
          projectName: result.project?.name || 'Project',
          cancellationReason: body.cancellationReason || 'No reason provided'
        });
      }
    } catch (notificationError) {
      logger.error('Failed to send status change notification', {
        scheduleId: result._id,
        currentStatus,
        targetStatus,
        error: notificationError.message
      });
      // Don't throw - status update is successful even if notification fails
    }

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

/**
 * Expand a status value to include its legacy alias and canonical form so that
 * queries match records stored under either value.
 *   Progress -> ['Progress', 'InProgress']
 *   Ready    -> ['Ready',    'ReadyToStart']
 *   anything else -> [normalizedValue]
 */
const expandStatusAlias = (status) => {
  const normalized = normalizeSchedulerStatus(status);
  return normalized !== status ? [status, normalized] : [normalized];
};

const normalizeSingleScheduleStatus = (status) => {
  if (typeof status !== 'string') {
    throw Object.assign(new Error('status is required'), { statusCode: 400 });
  }

  const trimmedStatus = status.trim();

  if (!trimmedStatus) {
    throw Object.assign(new Error('status is required'), { statusCode: 400 });
  }

  if (trimmedStatus.includes(',')) {
    throw Object.assign(new Error('status must be a single value'), { statusCode: 400 });
  }

  const normalizedStatus = normalizeSchedulerStatus(trimmedStatus);

  if (!normalizedStatus) {
    throw Object.assign(new Error('Invalid status'), { statusCode: 400 });
  }

  return normalizedStatus;
};

/**
 * Return schedules for a specific engineer, optionally filtered by date and/or
 * status.  All three security tiers (engineer / integrator / admin) are
 * enforced via the `actor` argument.
 *
 * @param {object} params
 * @param {string}          params.engineerId  – required, Mongo ObjectId
 * @param {string}          [params.date]      – YYYY-MM-DD; overlapping schedules
 * @param {string|string[]} [params.status]    – single, comma-delimited, or array
 * @param {object}          [params.actor]     – normalised session actor
 */
async function getEngineerSchedulesByDateAndStatus({ engineerId, date, status, actor = null }) {
  // ── Validate engineerId ─────────────────────────────────────────────────
  if (!engineerId) {
    throw Object.assign(new Error('engineerId is required'), { statusCode: 400 });
  }

  if (!mongoose.isValidObjectId(engineerId)) {
    throw Object.assign(new Error('Invalid engineerId'), { statusCode: 400 });
  }

  // ── Validate date format ─────────────────────────────────────────────────
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw Object.assign(new Error('Invalid date format. Use YYYY-MM-DD'), { statusCode: 400 });
  }

  await assertEngineerAggregateAccess({ actor, engineerId });

  const query = createEngineerScheduleQuery({ engineerId, date, status });

  try {
    const result = await Scheduler.find(query)
      .select('title description startDate endDate startTime endTime status project')
    return { data: result };
  } catch (error) {
    logger.error(error);
    throw Object.assign(new Error(error.message || 'An unexpected server error occurred.'), { statusCode: 500 });
  }
}

/**
 * Get engineer schedule status aggregate
 *
 * Returns the total count of an engineer's schedules grouped by status.
 * Supports optional date filtering and status filtering.
 *
 * @param {object} params
 * @param {string}          params.engineerId  – required, Mongo ObjectId
 * @param {string}          [params.date]      – optional, YYYY-MM-DD; overlapping schedules
 * @param {string|string[]} [params.statuses]  – optional, single, comma-delimited, or array
 * @param {object}          [params.actor]     – optional, normalised session actor for security checks
 * @returns {Promise<object>} { total, byStatus: { Pending, Accepted, Approved, ... } }
 */
async function getEngineerScheduleStatusAggregate({ engineerId, date, statuses, actor = null }) {
  // ── Validate engineerId ─────────────────────────────────────────────────
  if (!engineerId) {
    throw Object.assign(new Error('engineerId is required'), { statusCode: 400 });
  }

  if (!mongoose.isValidObjectId(engineerId)) {
    throw Object.assign(new Error('Invalid engineerId'), { statusCode: 400 });
  }

  const engineerObjectId = toObjectId(engineerId);

  // ── Validate date format ─────────────────────────────────────────────────
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw Object.assign(new Error('Invalid date format. Use YYYY-MM-DD'), { statusCode: 400 });
  }

  await assertEngineerAggregateAccess({ actor, engineerId });

  const query = createEngineerScheduleQuery({ engineerId, date, status: undefined });

  // ── Parse and expand status filters ──────────────────────────────────────
  let statusFilter = null;
  if (statuses) {
    const rawStatuses = Array.isArray(statuses)
      ? statuses
      : String(statuses).split(',').map((s) => s.trim()).filter(Boolean);

    statusFilter = [...new Set(rawStatuses.map((value) => normalizeSchedulerStatus(value)).filter(Boolean))];
  }

  const match = { ...query };
  if (statusFilter?.length) {
    match.status = {
      $in: [...new Set(statusFilter.flatMap(expandStatusAlias))]
    };
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];

  try {
    const raw = await Scheduler.aggregate(pipeline);
    const byStatus = createDefaultStatusCounts();

    raw.forEach((row) => {
      const normalized = normalizeSchedulerStatus(row._id);
      if (normalized && Object.prototype.hasOwnProperty.call(byStatus, normalized)) {
        byStatus[normalized] += row.count;
      }
    });

    const resultByStatus = statusFilter?.length
      ? statusFilter.reduce((accumulator, status) => {
          accumulator[status] = byStatus[status] || 0;
          return accumulator;
        }, {})
      : byStatus;

    const total = Object.values(resultByStatus).reduce((sum, count) => sum + count, 0);

    return {
      total,
      byStatus: resultByStatus
    };
  } catch (error) {
    logger.error('Error in getEngineerScheduleStatusAggregate:', error);
    throw Object.assign(
      new Error(error.message || 'An unexpected server error occurred.'),
      { statusCode: 500 }
    );
  }
}

async function getEngineerSchedulesByStatus({ engineerId, status, actor = null }) {
  if (!engineerId) {
    throw Object.assign(new Error('engineerId is required'), { statusCode: 400 });
  }

  if (!mongoose.isValidObjectId(engineerId)) {
    throw Object.assign(new Error('Invalid engineerId'), { statusCode: 400 });
  }

  const normalizedStatus = normalizeSingleScheduleStatus(status);

  await assertEngineerAggregateAccess({ actor, engineerId });

  try {
    const schedules = await Scheduler.find({
      engineer: toObjectId(engineerId),
      status: normalizedStatus
    })
      .sort({ startDate: 1, startTime: 1 })

    return { data: schedules };
  } catch (error) {
    logger.error('Error in getEngineerSchedulesByStatus:', error);
    throw Object.assign(
      new Error(error.message || 'An unexpected server error occurred.'),
      { statusCode: 500 }
    );
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
  getEngineerSchedulesByDateAndStatus,
  getEngineerScheduleStatusAggregate,
  getEngineerSchedulesByStatus,
  normalizeActor,
  getScheduleReceivingIntegratorId,
  getSchedulePayingIntegratorId,
  buildPaymentPendingUpdate,
  buildPaymentSucceededUpdate,
  buildPaymentFailedUpdate
};
