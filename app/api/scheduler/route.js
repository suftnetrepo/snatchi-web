import {
  remove,
  update,
  add,
  addMany,
  updateByStatus,
  getByUser,
  getByProjectDateRange,
  getAllSchedules,
  getEngineerSchedulesByDateAndStatus,
  getEngineerScheduleStatusAggregate,
  getEngineerSchedulesByStatus,
  getSchedulesByEngineerAndStatus,
  markSchedulesAsRead,
  getUnreadSchedulesByEngineer,
  getSchedule,
  getSchedulesByEngineer,
  removeAll
} from '../services/scheduler';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { sendUserNotification } from '../services/notify';
import User from '../models/user';
import { getActiveDays } from '../../../utils/helpers';
import { ensureFirebaseAuthUser } from '../services/firebaseAuthService';

// Authentication middleware
const authenticateUser = async (req) => {
  const user = await getUserSession(req);

  if (!user) {
    return { user: null, error: { message: 'Unauthorized', status: 401 } };
  }

  return { user, error: null };
};

// Error response helper
const errorResponse = (message, status = 500, error = null) => {
  logger.error(error || message);
  return NextResponse.json({ success: false, error: message }, { status });
};

// Success response helper
const successResponse = (data, status = 200) => {
  return NextResponse.json({ success: true, data }, { status });
};

const canManageSchedules = (user) => ['integrator', 'manager'].includes(user?.role);
const forbiddenResponse = () => errorResponse('You do not have permission to manage bookings', 403);
const scheduleActor = (user) => ({ userId: user?.id, integratorId: user?.integrator, role: user?.role });
const canReadEngineer = (user, engineerId) =>
  canManageSchedules(user) || user?.id?.toString() === engineerId?.toString();
const SCHEDULE_CREATE_FIELDS = new Set([
  'title',
  'description',
  'status',
  'engineer',
  'project',
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'price_offer',
  'service_rate',
  'bookingDates'
]);
const sanitizeScheduleBody = (body) =>
  Object.fromEntries(Object.entries(body || {}).filter(([key]) => SCHEDULE_CREATE_FIELDS.has(key)));

const provisionEngineerChatUser = async (schedule) => {
  const engineer = schedule?.engineer;
  if (!engineer?.email) return null;

  try {
    const displayName =
      [engineer.first_name, engineer.last_name].filter(Boolean).join(' ') || engineer.email.split('@')[0];
    return await ensureFirebaseAuthUser(engineer.email, displayName);
  } catch (error) {
    logger.error('Failed to provision Firebase chat user for engineer', {
      engineerId: engineer?._id,
      email: engineer.email,
      error: error.message
    });
    return null;
  }
};

const sendPendingNotification = async (scheduleId, body, additionalParams = {}) => {
  const { status, engineer, title, startDate } = body;
  const formattedDate = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  await sendUserNotification({
    userId: engineer,
    title: 'Updated Booking Request',
    body: `Updated booking for ${title} - ${formattedDate}`,
    screen: 'calendar',
    screenParams: {
      scheduleId,
      ...additionalParams
    }
  });
};

export const GET = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // await removeAll()

    // Handle getEngineerSchedules action — date + status filtering
    if (action === 'getEngineerSchedules') {
      const engineerId = url.searchParams.get('engineerId');
      if (!canReadEngineer(user, engineerId)) return forbiddenResponse();
      const date = url.searchParams.get('date') || undefined;
      const statusArray = url.searchParams.getAll('status[]');
      const statusScalar = url.searchParams.get('status');
      const status = statusArray.length > 0 ? statusArray : statusScalar || undefined;

      try {
        const results = await getEngineerSchedulesByDateAndStatus({ engineerId, date, status });
        return successResponse(results.data);
      } catch (err) {
        return errorResponse(err.message, err.statusCode || 500, err);
      }
    }

    // Handle engineerStatusAggregate action — count schedules by status
    if (action === 'engineerStatusAggregate') {
      const engineerId = url.searchParams.get('engineerId');
      if (!canReadEngineer(user, engineerId)) return forbiddenResponse();
      const date = url.searchParams.get('date') || undefined;
      // Support both ?status=A,B and ?status[]=A&status[]=B array notation
      const statusArray = url.searchParams.getAll('status[]');
      const statusScalar = url.searchParams.get('status');
      const statuses = statusArray.length > 0 ? statusArray : statusScalar || undefined;

      try {
        const data = await getEngineerScheduleStatusAggregate({ engineerId, date, statuses });
        return successResponse(data);
      } catch (err) {
        return errorResponse(err.message, err.statusCode || 500, err);
      }
    }

    if (action === 'engineerSchedulesByStatus') {
      const engineerId = url.searchParams.get('engineerId');
      if (!canReadEngineer(user, engineerId)) return forbiddenResponse();
      const status = url.searchParams.get('status');

      try {
        const results = await getEngineerSchedulesByStatus({ engineerId, status });
        return successResponse(results.data);
      } catch (err) {
        return errorResponse(err.message, err.statusCode || 500, err);
      }
    }

    if (action === 'getSchedulesByEngineerStatus') {
      const engineerId = url.searchParams.get('engineerId');
      if (!canReadEngineer(user, engineerId)) return forbiddenResponse();
      const status = url.searchParams.get('status');

      try {
        const results = await getSchedulesByEngineerAndStatus({ engineerId, status });
        return successResponse(results.data);
      } catch (err) {
        return errorResponse(err.message, err.statusCode || 500, err);
      }
    }

    if (action === 'getSchedulesByEngineer') {
      try {
        const results = await getSchedulesByEngineer({ engineerId: user.id });
        return successResponse(results.data);
      } catch (err) {
        return errorResponse(err.message, err.statusCode || 500, err);
      }
    }

    if (action === 'getUnreadByEngineer') {
      try {
        const results = await getUnreadSchedulesByEngineer({ engineerId: user.id });
        return successResponse(results.count);
      } catch (err) {
        return errorResponse(err.message, err.statusCode || 500, err);
      }
    }

    // Handle getByEngineer action
    if (action === 'getByEngineer') {
      if (!canManageSchedules(user)) return forbiddenResponse();
      const id = url.searchParams.get('id');
      const results = await getByUser(id);
      return successResponse(results.data);
    }

    // Handle getByProjectDateRange action
    if (action === 'getByProjectDateRange') {
      if (!canManageSchedules(user)) return forbiddenResponse();
      const projectId = url.searchParams.get('projectId');
      const results = await getByProjectDateRange(projectId, user.integrator);
      return successResponse(results.data);
    }

    // Handle getAllSchedules action
    if (action === 'getAllSchedules') {
      if (!canManageSchedules(user)) return forbiddenResponse();
      const results = await getAllSchedules(user.integrator);
      return successResponse(results.data);
    }

    return NextResponse.json({ success: false, message: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    return errorResponse(error.message, 500, error);
  }
};

export const DELETE = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (!canManageSchedules(user)) return forbiddenResponse();

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    await remove(user?.integrator, id);

    const schedule = await getSchedule(id);
    if (schedule?.data?.engineer) {
      await sendUserNotification({
        userId: schedule.data.engineer._id,
        title: 'Removed Booking Request',
        body: `Removed booking for ${schedule.data.title}`,
        screen: 'project',
        screenParams: {
          scheduleId: schedule.data._id,
          projectId: schedule.data.project?._id || ''
        }
      });
    }

    return successResponse(true);
  } catch (error) {
    return errorResponse(error.message, error.statusCode || 500, error);
  }
};

export const PUT = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    // Handle status update action
    if (action === 'status') {
      const body = sanitizeScheduleBody(await req.json());
      const result = await updateByStatus(id, body, scheduleActor(user));
      return successResponse(result);
    }

    // Handle general update action
    if (action === 'update') {
      if (!canManageSchedules(user)) return forbiddenResponse();
      const body = await req.json();

      const result = await update(user?.integrator, id, body);
      if (result) {
        await sendPendingNotification(id, body, {
          startDate: body.startDate,
          endDate: body.endDate,
          startTime: body.startTime,
          endTime: body.endTime,
          status: body.status,
          projectId: result.project?._id || '',
          scheduleId: result._id,
          engineerId: result.engineer?._id || '',
          projectName: result.project?.name || '',
          projectDescription: result.project?.description || '',
          completeAddress: result.project?.completeAddress || '',
          latitude: result.project?.location?.coordinates[0],
          longitude: result.project?.location?.coordinates[1],
          integratorId: result.project?.integrator || '',
          priority: result.project?.priority || '',
          radius: 200,
          activeDays: getActiveDays(body.startDate, body.endDate)
        });
      }

      return successResponse(result);
    }

    // No valid action provided
    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error in PUT /scheduler:', error);
    return errorResponse(error.message, error.statusCode || 500, error);
  }
};

export const POST = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (!canManageSchedules(user)) return forbiddenResponse();

    const body = sanitizeScheduleBody(await req.json());
    if (Array.isArray(body.bookingDates)) {
      const result = await addMany({ ...body, integrator: user?.integrator });
      const fullSchedule = result.bookings?.[0];
      const engineerFirebaseUid = await provisionEngineerChatUser(fullSchedule);
      return successResponse(
        {
          ...result,
          title: fullSchedule?.title,
          engineerFirebaseUid
        },
        201
      );
    }
    const result = await add({ ...body, integrator: user?.integrator });
    let engineerFirebaseUid = null;

    if (result) {
      const fullSchedule = (await result.execPopulate?.()) || result;

      // Ensure engineer has a Firebase user (creates if doesn't exist)
      if (fullSchedule.engineer?.email) {
        engineerFirebaseUid = await provisionEngineerChatUser(fullSchedule);
      }
      await sendPendingNotification(result._id, body, {
        scheduleId: result._id,
        engineerId: result.engineer?._id,
        projectId: result.project?._id,
        integratorId: result.project?.integrator,
        projectName: result.project?.name,
        completeAddress: result.project?.completeAddress || '',
        latitude: result.project?.location?.coordinates[0],
        longitude: result.project?.location?.coordinates[1],
        radius: 200,
        activeDays: getActiveDays(result.startDate, result.endDate),
        startDate: result.startDate,
        endDate: result.endDate,
        status: result.status,
        startTime: result.startTime,
        endTime: result.endTime,
        projectDescription: result.project?.description || '',
        priority: result.project?.priority || '',
        engineerFirebaseUid
      });
    }

    return successResponse(
      {
        ...(result.toObject?.() || result),
        engineerFirebaseUid
      },
      201
    );
  } catch (error) {
    const status = error.statusCode || 500;
    if (status < 500) {
      logger.warn(`Scheduler request rejected (${status}): ${error.message}`);
      return NextResponse.json({ success: false, error: error.message }, { status });
    }
    return errorResponse(error.message, status, error);
  }
};

export const PATCH = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    const result = await markSchedulesAsRead(id, user.id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error.message, 500, error);
  }
};
