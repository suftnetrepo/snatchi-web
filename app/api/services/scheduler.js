const mongoose = require('mongoose');
import { randomUUID } from 'crypto';
import { schedulerValidator } from '../validator/user';
import Scheduler from '../models/scheduler';
import Project from '../models/project';
import User from '../models/user';
import '../models/integrator';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
import { logger } from '../utils/logger';
import { SCHEDULER_STATUS, normalizeSchedulerStatus } from '../constants/statuses';

mongoConnect();

// Helper function to extract time from date
const extractTimeFromDate = (dateString) => {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const serviceError = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const dateKey = (value) => {
  if (!value) return '';
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const validateDailyBooking = ({ startDate, endDate, startTime, endTime, project }) => {
  const startDay = dateKey(startDate);
  const endDay = dateKey(endDate);

  if (!startDay || !endDay) throw serviceError('Valid start and end dates are required', 400);
  if (startDay !== endDay) throw serviceError('Bookings must be created one day at a time', 400);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime || '')) {
    throw serviceError('Valid start and end times are required', 400);
  }
  if (endTime <= startTime) throw serviceError('End time must be after start time', 400);

  const projectStart = dateKey(project.startDate);
  const projectEnd = dateKey(project.endDate);
  if (startDay < projectStart || startDay > projectEnd) {
    throw serviceError('Booking date must be within the project dates', 400);
  }
};

const ensureNoScheduleConflict = async ({ engineerId, startDate, startTime, endTime, excludeId }) => {
  const day = dateKey(startDate);
  const dayStart = new Date(`${day}T00:00:00.000Z`);
  const dayEnd = new Date(`${day}T23:59:59.999Z`);
  const query = {
    engineer: engineerId,
    startDate: { $lte: dayEnd },
    endDate: { $gte: dayStart },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
    status: { $nin: [SCHEDULER_STATUS.CANCELLED, SCHEDULER_STATUS.DECLINED] }
  };
  if (excludeId) query._id = { $ne: excludeId };

  if (await Scheduler.exists(query)) {
    throw serviceError('The engineer already has a booking during this time', 409);
  }
};

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
      : String(status)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

    query.status = { $in: [...new Set(rawStatuses.flatMap(expandStatusAlias))] };
  }

  return query;
};

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
    status: currentStatus === SCHEDULER_STATUS.APPROVED ? SCHEDULER_STATUS.AWAITING_PAYMENT : currentStatus,
    awaitingPaymentAt:
      currentStatus === SCHEDULER_STATUS.APPROVED ? schedule.awaitingPaymentAt || now : schedule.awaitingPaymentAt
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

async function getSchedule(id) {
  try {
    const result = await Scheduler.findOne({ _id: id })
      .populate('engineer', 'first_name last_name email _id')
      .populate('project', 'name description completeAddress location _id integrator priority');

    return { data: result };
  } catch (error) {
    logger.error(error);
    throw new Error('Unexpected server error');
  }
}

async function add(body) {
  const bodyErrors = schedulerValidator(body);
  if (bodyErrors !== true) {
    throw serviceError(bodyErrors.map((it) => it.message).join(','), 400);
  }

  const { startDate, endDate, startTime, endTime, ...rest } = body;

  // Extract time from dates if startTime/endTime not provided
  const derivedStartTime = startTime || extractTimeFromDate(startDate);
  const derivedEndTime = endTime || extractTimeFromDate(endDate);

  try {
    if (!isValidObjectId(body.integrator) || !isValidObjectId(body.project) || !isValidObjectId(body.engineer)) {
      throw serviceError('Invalid project or engineer ID', 400);
    }

    const [project, engineer] = await Promise.all([
      Project.findOne({ _id: body.project, integrator: body.integrator }).select('startDate endDate status integrator'),
      User.findById(body.engineer).select('integrator role')
    ]);
    if (!project) throw serviceError('Project not found', 404);
    if (['Completed', 'Canceled'].includes(project.status)) {
      throw serviceError('Bookings cannot be added to a completed or canceled project', 409);
    }
    if (!engineer || engineer.role !== 'engineer') throw serviceError('Engineer not found', 404);

    validateDailyBooking({ startDate, endDate, startTime: derivedStartTime, endTime: derivedEndTime, project });
    await ensureNoScheduleConflict({
      engineerId: body.engineer,
      startDate,
      startTime: derivedStartTime,
      endTime: derivedEndTime
    });

    const schedulerData = {
      ...rest,
      status: SCHEDULER_STATUS.PENDING,
      integrator: body.integrator,
      project: body.project,
      engineer: body.engineer,
      startDate: new Date(`${dateKey(startDate)}T00:00:00.000Z`),
      endDate: new Date(`${dateKey(endDate)}T00:00:00.000Z`),
      startTime: derivedStartTime,
      endTime: derivedEndTime
    };

    schedulerData.receivingIntegratorId =
      engineer.integrator?.toString?.() || engineer.integrator;
    schedulerData.payingIntegrator = body.integrator;

    const scheduler = await Scheduler.create(schedulerData);
    await scheduler.populate([
      { path: 'engineer', select: 'first_name last_name email' },
      {
        path: 'project',
        select: 'name description completeAddress location _id integrator priority',
        populate: {
          path: 'integrator',
          select: 'email'
        }
      }
    ]);
    return scheduler;
  } catch (error) {
    logger.error(error);
    if (error.statusCode) throw error;
    throw serviceError('An unexpected error occurred. Please try again.', 500);
  }
}

async function addMany(body) {
  const rawDates = Array.isArray(body.bookingDates) ? body.bookingDates : [];
  const bookingDates = [...new Set(rawDates.map(dateKey).filter(Boolean))].sort();
  if (bookingDates.length < 2) throw serviceError('Select at least two booking days', 400);
  if (bookingDates.length > 31) throw serviceError('A booking group cannot contain more than 31 days', 400);

  const validationBody = { ...body, startDate: bookingDates[0], endDate: bookingDates[0] };
  delete validationBody.bookingDates;
  const bodyErrors = schedulerValidator(validationBody);
  if (bodyErrors !== true) throw serviceError(bodyErrors.map((item) => item.message).join(','), 400);
  if (!isValidObjectId(body.integrator) || !isValidObjectId(body.project) || !isValidObjectId(body.engineer)) {
    throw serviceError('Invalid project or engineer ID', 400);
  }

  const [project, engineer] = await Promise.all([
    Project.findOne({ _id: body.project, integrator: body.integrator }).select('startDate endDate status integrator'),
    User.findById(body.engineer).select('integrator role')
  ]);
  if (!project) throw serviceError('Project not found', 404);
  if (['Completed', 'Canceled'].includes(project.status)) {
    throw serviceError('Bookings cannot be added to a completed or canceled project', 409);
  }
  if (!engineer || engineer.role !== 'engineer') throw serviceError('Engineer not found', 404);

  const derivedStartTime = body.startTime || extractTimeFromDate(bookingDates[0]);
  const derivedEndTime = body.endTime || extractTimeFromDate(bookingDates[0]);
  for (const bookingDate of bookingDates) {
    validateDailyBooking({
      startDate: bookingDate,
      endDate: bookingDate,
      startTime: derivedStartTime,
      endTime: derivedEndTime,
      project
    });
    await ensureNoScheduleConflict({
      engineerId: body.engineer,
      startDate: bookingDate,
      startTime: derivedStartTime,
      endTime: derivedEndTime
    });
  }

  const bookingGroupId = randomUUID();
  const protectedFields = new Set([
    'bookingDates', 'startDate', 'endDate', 'startTime', 'endTime', 'receivingIntegratorId',
    'payingIntegrator', 'integrator', 'bookingGroupId', 'bookingGroupSize'
  ]);
  const safeBody = Object.fromEntries(Object.entries(body).filter(([key]) => !protectedFields.has(key)));
  safeBody.status = SCHEDULER_STATUS.PENDING;
  const documents = bookingDates.map((bookingDate) => ({
    ...safeBody,
    integrator: body.integrator,
    payingIntegrator: body.integrator,
    receivingIntegratorId: engineer.integrator,
    project: body.project,
    engineer: body.engineer,
    bookingGroupId,
    bookingGroupSize: bookingDates.length,
    startDate: new Date(`${bookingDate}T00:00:00.000Z`),
    endDate: new Date(`${bookingDate}T00:00:00.000Z`),
    startTime: derivedStartTime,
    endTime: derivedEndTime
  }));

  const session = await mongoose.startSession();
  let bookings = [];
  try {
    await session.withTransaction(async () => {
      bookings = await Scheduler.insertMany(documents, { session, ordered: true });
    });
  } catch (error) {
    logger.error(error);
    if (error.statusCode) throw error;
    throw serviceError('The booking group could not be created. No bookings were saved.', 500);
  } finally {
    await session.endSession();
  }

  bookings = await Scheduler.populate(bookings, [
    { path: 'engineer', select: 'first_name last_name email' },
    { path: 'project', select: 'name description completeAddress location _id integrator priority' }
  ]);
  return { bookingGroupId, bookings };
}

async function update(suid, id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = schedulerValidator(body);
  if (bodyErrors !== true) {
    throw serviceError(bodyErrors.map((it) => it.message).join(','), 400);
  }

  // Extract time from dates if startTime/endTime not provided
  const derivedStartTime = body.startTime || extractTimeFromDate(body.startDate);
  const derivedEndTime = body.endTime || extractTimeFromDate(body.endDate);

  try {
    const current = await Scheduler.findOne({ _id: id, integrator: suid });
    if (!current) throw serviceError('Booking not found', 404);
    const project = await Project.findOne({ _id: current.project, integrator: suid }).select('startDate endDate status');
    if (!project) throw serviceError('Project not found', 404);

    validateDailyBooking({
      startDate: body.startDate,
      endDate: body.endDate,
      startTime: derivedStartTime,
      endTime: derivedEndTime,
      project
    });
    await ensureNoScheduleConflict({
      engineerId: current.engineer,
      startDate: body.startDate,
      startTime: derivedStartTime,
      endTime: derivedEndTime,
      excludeId: id
    });

    const scheduler = await Scheduler.findOneAndUpdate(
      { _id: id, integrator: suid },
      {
        ...body,
        status: current.status,
        engineer: current.engineer,
        project: current.project,
        integrator: current.integrator,
        payingIntegrator: current.payingIntegrator,
        receivingIntegratorId: current.receivingIntegratorId,
        startDate: new Date(`${dateKey(body.startDate)}T00:00:00.000Z`),
        endDate: new Date(`${dateKey(body.endDate)}T00:00:00.000Z`),
        startTime: derivedStartTime,
        endTime: derivedEndTime,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'engineer', select: 'first_name last_name email' },
      { path: 'project', select: 'name description completeAddress location _id integrator priority' }
    ]);

    return scheduler;
  } catch (error) {
    console.error(error);
    if (error.statusCode) throw error;
    throw serviceError('An unexpected error occurred. Please try again.', 500);
  }
}

async function updateByStatus(id, body, actor = {}) {
  try {
    if (!isValidObjectId(id)) {
      throw serviceError('Invalid booking ID', 400);
    }

    const schedule = await Scheduler.findById(id);
    if (!schedule) throw serviceError('Booking not found', 404);
    const currentStatus = normalizeSchedulerStatus(schedule.status);
    const requestedStatus = normalizeSchedulerStatus(body?.status);
    const allowedStatuses = new Set(Object.values(SCHEDULER_STATUS));
    if (!requestedStatus || !allowedStatuses.has(requestedStatus)) {
      throw serviceError('Invalid booking status', 400);
    }

    if (requestedStatus === currentStatus) {
      return schedule.populate([
        { path: 'engineer', select: 'first_name last_name email' },
        { path: 'project', select: 'name description completeAddress location _id integrator priority' }
      ]);
    }

    const actorIntegrator = actor.integratorId?.toString?.();
    const isEngineer = schedule.engineer.toString() === actor.userId?.toString?.();
    const isBookingIntegrator = [schedule.integrator, schedule.payingIntegrator]
      .filter(Boolean).some((value) => value.toString() === actorIntegrator);
    const isReceivingIntegrator = schedule.receivingIntegratorId?.toString?.() === actorIntegrator;
    const isIntegratorActor = ['integrator', 'manager'].includes(actor.role);
    const payingIntegratorId = getSchedulePayingIntegratorId(schedule);
    const receivingIntegratorId = getScheduleReceivingIntegratorId(schedule);
    const isInternalBooking = Boolean(
      payingIntegratorId && receivingIntegratorId && payingIntegratorId === receivingIntegratorId
    );

    const engineerTransitions = {
      [SCHEDULER_STATUS.PENDING]: [SCHEDULER_STATUS.ACCEPTED, SCHEDULER_STATUS.DECLINED, SCHEDULER_STATUS.CANCELLED],
      [SCHEDULER_STATUS.ACCEPTED]: [SCHEDULER_STATUS.CANCELLED],
      [SCHEDULER_STATUS.READY_TO_START]: [SCHEDULER_STATUS.IN_PROGRESS],
      [SCHEDULER_STATUS.IN_PROGRESS]: [SCHEDULER_STATUS.COMPLETED]
    };
    const bookingIntegratorTransitions = {
      [SCHEDULER_STATUS.PENDING]: [SCHEDULER_STATUS.CANCELLED],
      [SCHEDULER_STATUS.ACCEPTED]: [SCHEDULER_STATUS.CANCELLED],
      [SCHEDULER_STATUS.READY_TO_START]: [SCHEDULER_STATUS.IN_PROGRESS],
      [SCHEDULER_STATUS.IN_PROGRESS]: [SCHEDULER_STATUS.COMPLETED]
    };
    const receivingIntegratorTransitions = {
      [SCHEDULER_STATUS.ACCEPTED]: [SCHEDULER_STATUS.APPROVED, SCHEDULER_STATUS.CANCELLED],
      [SCHEDULER_STATUS.READY_TO_START]: [SCHEDULER_STATUS.IN_PROGRESS],
      [SCHEDULER_STATUS.IN_PROGRESS]: [SCHEDULER_STATUS.COMPLETED]
    };

    const allowed = (
      isEngineer && engineerTransitions[currentStatus]?.includes(requestedStatus)
    ) || (
      isIntegratorActor && isBookingIntegrator && bookingIntegratorTransitions[currentStatus]?.includes(requestedStatus)
    ) || (
      isIntegratorActor && isReceivingIntegrator && receivingIntegratorTransitions[currentStatus]?.includes(requestedStatus)
    ) || (
      // Compatibility for internal bookings approved before payment bypass was introduced.
      isIntegratorActor && isBookingIntegrator && isInternalBooking &&
      currentStatus === SCHEDULER_STATUS.APPROVED && requestedStatus === SCHEDULER_STATUS.IN_PROGRESS
    );
    if (!allowed) {
      throw serviceError(`Booking cannot move from ${currentStatus} to ${requestedStatus} for this user`, 409);
    }

    if (schedule.paymentStatus === 'succeeded' && requestedStatus === SCHEDULER_STATUS.CANCELLED) {
      throw serviceError('A paid booking cannot be cancelled through the schedule workflow', 409);
    }

    const now = new Date();
    const isInternalApproval = requestedStatus === SCHEDULER_STATUS.APPROVED && isInternalBooking;
    const isLegacyInternalStart = currentStatus === SCHEDULER_STATUS.APPROVED &&
      requestedStatus === SCHEDULER_STATUS.IN_PROGRESS && isInternalBooking;
    const nextStatus = isInternalApproval ? SCHEDULER_STATUS.READY_TO_START : requestedStatus;
    const timestampFields = {
      [SCHEDULER_STATUS.ACCEPTED]: { acceptedAt: now },
      [SCHEDULER_STATUS.DECLINED]: { declinedAt: now },
      [SCHEDULER_STATUS.APPROVED]: {
        approvedAt: now,
        approvedByIntegrator: actor.integratorId || undefined,
        approvedByUser: actor.userId || undefined
      },
      [SCHEDULER_STATUS.IN_PROGRESS]: { startedAt: now },
      [SCHEDULER_STATUS.COMPLETED]: { completedAt: now },
      [SCHEDULER_STATUS.CANCELLED]: { cancelledAt: now }
    };

    const result = await Scheduler.findOneAndUpdate(
      { _id: id, status: schedule.status },
      {
        status: nextStatus,
        ...(timestampFields[requestedStatus] || {}),
        ...(isInternalApproval
          ? {
              paymentStatus: 'not_required',
              readyToStartAt: schedule.readyToStartAt || now
            }
          : {}),
        ...(isLegacyInternalStart
          ? {
              paymentStatus: 'not_required',
              readyToStartAt: schedule.readyToStartAt || now
            }
          : {}),
        ...(requestedStatus === SCHEDULER_STATUS.CANCELLED && typeof body?.reason === 'string'
          ? { cancellationReason: body.reason.trim().slice(0, 500) }
          : {}),
        updatedAt: now
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'engineer', select: 'first_name last_name email' },
      { path: 'project', select: 'name description completeAddress location _id integrator priority' }
    ]);

    if (!result) throw serviceError('Booking status changed while this request was being processed. Refresh and try again.', 409);
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
    const deleted = await Scheduler.findOneAndDelete({
      _id: id,
      integrator: suid,
      status: { $in: [SCHEDULER_STATUS.PENDING, SCHEDULER_STATUS.DECLINED, SCHEDULER_STATUS.CANCELLED] },
      paymentStatus: { $ne: 'succeeded' }
    })
      .populate('engineer', 'first_name last_name email _id')
      .populate('project', 'name _id');
    if (!deleted) throw serviceError('Only unpaid pending, declined, or cancelled bookings can be deleted', 409);
    return deleted;
  } catch (error) {
    console.error(error);
    if (error.statusCode) throw error;
    throw serviceError('An unexpected error occurred. Please try again.', 500);
  }
}

async function removeAll() {
  try {
    await Scheduler.deleteMany({});
    return true;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getByProjectDateRange(projectId, integratorId) {
  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    // Get the project to find its start and end dates
    const project = await Project.findOne({ _id: projectId, integrator: integratorId }, { startDate: 1, endDate: 1 });

    if (!project) {
      throw new Error('Project not found');
    }

    // Find all schedules for this project that fall within the project's date range
    const schedules = await Scheduler.find({
      project: projectId,
      startDate: { $gte: project.startDate },
      endDate: { $lte: project.endDate },
      integrator: integratorId
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
    if (error.statusCode) throw error;
    throw serviceError('An unexpected error occurred. Please try again.', 500);
  }
}

async function getAllSchedules(integratorId) {
  if (!mongoose.isValidObjectId(integratorId)) {
    throw new Error(JSON.stringify([{ field: 'integratorId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const result = await Scheduler.find({
      $or: [{ integrator: integratorId }, { receivingIntegratorId: integratorId }, { payingIntegrator: integratorId }]
    })
      .populate({ path: 'engineer', select: 'first_name last_name email integrator' })
      .populate({ path: 'project', select: 'name' })
      .populate({ path: 'payingIntegrator', select: 'name' })
      .populate({
        path: 'receivingIntegratorId',
        select: 'name stripeConnectAccountId connectAccountStatus chargesEnabled payoutsEnabled'
      });

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
  const query = createEngineerScheduleQuery({ engineerId, date, status });

  try {
    const result = await Scheduler.find(query).select(
      'title description startDate endDate startTime endTime status project'
    );
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
async function getEngineerScheduleStatusAggregate({ engineerId, date, statuses }) {
  const query = createEngineerScheduleQuery({ engineerId, date, status: undefined });

  // ── Parse and expand status filters ──────────────────────────────────────
  let statusFilter = null;
  if (statuses) {
    const rawStatuses = Array.isArray(statuses)
      ? statuses
      : String(statuses)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

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
    throw Object.assign(new Error(error.message || 'An unexpected server error occurred.'), { statusCode: 500 });
  }
}

async function getEngineerSchedulesByStatus({ engineerId, status }) {
  const normalizedStatus = normalizeSingleScheduleStatus(status);

  try {
    const schedules = await Scheduler.find({
      engineer: toObjectId(engineerId),
      status: normalizedStatus
    }).sort({ startDate: 1, startTime: 1 });

    return { data: schedules };
  } catch (error) {
    logger.error('Error in getEngineerSchedulesByStatus:', error);
    throw Object.assign(new Error(error.message || 'An unexpected server error occurred.'), { statusCode: 500 });
  }
}

async function getSchedulesByEngineerAndStatus({ engineerId, status }) {
  if (!mongoose.isValidObjectId(engineerId)) {
    throw Object.assign(new Error('Invalid engineerId'), { statusCode: 400 });
  }

  const normalizedStatus = normalizeSingleScheduleStatus(status);

  try {
    const schedules = await Scheduler.find({
      engineer: toObjectId(engineerId),
      status: normalizedStatus
    }).sort({ startDate: 1, startTime: 1 });

    return { data: schedules };
  } catch (error) {
    logger.error('Error in getSchedulesByEngineerAndStatus:', error);
    throw Object.assign(new Error(error.message || 'An unexpected server error occurred.'), { statusCode: 500 });
  }
}

async function getSchedulesByEngineer({ engineerId }) {
  if (!mongoose.isValidObjectId(engineerId)) {
    throw Object.assign(new Error('Invalid engineerId'), { statusCode: 400 });
  }

  try {
    const schedules = await Scheduler.find({
      engineer: toObjectId(engineerId)
    })
      .sort({ startDate: 1, startTime: 1 })
      .populate({ path: 'project', select: 'completeAddress' });

    return { data: schedules };
  } catch (error) {
    logger.error('Error in getSchedulesByEngineer:', error);
    throw Object.assign(new Error(error.message || 'An unexpected server error occurred.'), { statusCode: 500 });
  }
}

async function markSchedulesAsRead(id, engineerId) {
  try {
    const result = await Scheduler.updateOne({ _id: id, engineer: engineerId }, { $set: { read: true } });

    if (!result.matchedCount) throw serviceError('Booking not found', 404);

    return { data: true };
  } catch (error) {
    console.error('Error in markSchedulesAsRead:', error);
    if (error.statusCode) throw error;
    throw serviceError(error.message || 'An unexpected server error occurred.', 500);
  }
}

async function getUnreadSchedulesByEngineer({ engineerId }) {
  if (!mongoose.isValidObjectId(engineerId)) {
    throw Object.assign(new Error('Invalid engineerId'), { statusCode: 400 });
  }
  try {
    const count = await Scheduler.countDocuments({
      engineer: engineerId,
      read: false
    });

    return { count };
  } catch (error) {
    logger.error('Error in getUnreadSchedulesByEngineer:', error);
    throw Object.assign(new Error(error.message || 'An unexpected server error occurred.'), { statusCode: 500 });
  }
}

export {
  remove,
  add,
  addMany,
  getByUser,
  update,
  updateByStatus,
  getByProjectDateRange,
  getAllSchedules,
  getEngineerSchedulesByDateAndStatus,
  getEngineerScheduleStatusAggregate,
  getEngineerSchedulesByStatus,
  getSchedulesByEngineerAndStatus,
  markSchedulesAsRead,
  getUnreadSchedulesByEngineer,
  getScheduleReceivingIntegratorId,
  getSchedulePayingIntegratorId,
  buildPaymentPendingUpdate,
  buildPaymentSucceededUpdate,
  buildPaymentFailedUpdate,
  removeAll,
  getSchedule,
  getSchedulesByEngineer
};
