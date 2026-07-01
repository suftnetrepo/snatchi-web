import {
  remove,
  update,
  add,
  updateByStatus,
  getByUser,
  removeAll,
  getByProjectDateRange,
  getAllSchedules,
  getEngineerSchedulesByDateAndStatus,
  getEngineerScheduleStatusAggregate,
  getEngineerSchedulesByStatus,
  normalizeActor
} from '../services/scheduler';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { sendUserNotification } from '../services/notify';
import notificationEvents from '../services/notificationEvents';
import User from '../models/user';
import { getActiveDays } from '../../../utils/helpers';

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

// Validate engineer access permissions
const validateEngineerAccess = async (user, engineerId) => {
  if (user.role === 'engineer' && user.id !== engineerId) {
    return { valid: false, error: 'Unauthorized', status: 403 };
  }

  if (user.role === 'integrator') {
    const engineer = await User.findById(engineerId).select('integrator');

    if (!engineer || engineer.integrator?.toString() !== user.integrator?.toString()) {
      return { valid: false, error: 'Unauthorized', status: 403 };
    }
  }

  if (!['engineer', 'integrator', 'admin'].includes(user.role)) {
    return { valid: false, error: 'Unauthorized', status: 403 };
  }

  return { valid: true };
};

// Send notification for pending schedules
const sendPendingNotification = async (scheduleId, body, additionalParams = {}) => {
  const { status, engineer, title, startDate } = body;
  const formattedDate = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (status === 'Pending') {
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
  }
};

export const GET = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // await removeAll();

    // Handle getEngineerSchedules action — date + status filtering
    if (action === 'getEngineerSchedules') {
      const engineerId = url.searchParams.get('engineerId');
      const date = url.searchParams.get('date') || undefined;
      // Support both ?status=A,B and ?status[]=A&status[]=B array notation
      const statusArray = url.searchParams.getAll('status[]');
      const statusScalar = url.searchParams.get('status');
      const status = statusArray.length > 0 ? statusArray : statusScalar || undefined;

      if (!engineerId) {
        return NextResponse.json({ success: false, error: 'engineerId is required' }, { status: 400 });
      }

      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
      }

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
      const date = url.searchParams.get('date') || undefined;
      // Support both ?status=A,B and ?status[]=A&status[]=B array notation
      const statusArray = url.searchParams.getAll('status[]');
      const statusScalar = url.searchParams.get('status');
      const statuses = statusArray.length > 0 ? statusArray : statusScalar || undefined;

      if (!engineerId) {
        return NextResponse.json({ success: false, error: 'engineerId is required' }, { status: 400 });
      }

      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
      }

      try {
        const data = await getEngineerScheduleStatusAggregate({ engineerId, date, statuses });
        return successResponse(data);
      } catch (err) {
        return errorResponse(err.message, err.statusCode || 500, err);
      }
    }

    if (action === 'engineerSchedulesByStatus') {
      const engineerId = url.searchParams.get('engineerId');
      const status = url.searchParams.get('status');

      try {
        const results = await getEngineerSchedulesByStatus({ engineerId, status });
        return successResponse(results.data);
      } catch (err) {
        return errorResponse(err.message, err.statusCode || 500, err);
      }
    }

    // Handle getByEngineer action
    if (action === 'getByEngineer') {
      const id = url.searchParams.get('id');
      if (!id) {
        return NextResponse.json({ success: false, error: 'Engineer id is required' }, { status: 400 });
      }

      const access = await validateEngineerAccess(user, id);
      if (!access.valid) {
        return NextResponse.json({ success: false, error: access.error }, { status: access.status });
      }

      const results = await getByUser(id);
      return successResponse(results.data);
    }

    // Handle getByProjectDateRange action
    if (action === 'getByProjectDateRange') {
      const projectId = url.searchParams.get('projectId');
      const results = await getByProjectDateRange(projectId);
      return successResponse(results.data);
    }

    // Handle getAllSchedules action
    if (action === 'getAllSchedules') {
      const results = await getAllSchedules(user.integrator);
      return successResponse(results.data);
    }

    // Invalid action
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

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    const results = await remove(user?.integrator, id);
    return successResponse(results);
  } catch (error) {
    return errorResponse(error.message, 500, error);
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
      const body = await req.json();
      const result = await updateByStatus(id, user, body);
      return successResponse(result);
    }

    // Handle general update action
    if (action === 'update') {
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
          projectName: result.project?.name || '',
          projectDescription: result.project?.description || '',
          completeAddress: result.project?.completeAddress || '',
          latitude: result.project?.location?.coordinates[0],
          longitude: result.project?.location?.coordinates[1],
          radius: 200,
          activeDays: getActiveDays(body.startDate, body.endDate)
        });
      }

      return successResponse(result);
    }

    // No valid action provided
    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return errorResponse(error.message, error.statusCode || 500, error);
  }
};

export const POST = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const body = await req.json();
    const result = await add({ ...body, integrator: user?.integrator });

    // Wire notification event: Booking created
    if (result) {
      try {
        // Get full schedule with populated fields
        const fullSchedule = (await result.execPopulate?.()) || result;

        await notificationEvents.bookingCreated({
          scheduleId: result._id,
          engineerId: fullSchedule.engineer?._id,
          projectId: fullSchedule.project?._id,
          integratorId: fullSchedule.project?.integrator,
          projectName: fullSchedule.project?.name,
          completeAddress: fullSchedule.project?.completeAddress || '',
          latitude: fullSchedule.project?.location?.coordinates[0],
          longitude: fullSchedule.project?.location?.coordinates[1],
          radius: 200,
          activeDays: getActiveDays(result.startDate, result.endDate),
          startDate: result.startDate,
          endDate: result.endDate,
          status: result.status,
          startTime: result.startTime,
          endTime: result.endTime,
          payingIntegratorName: result.payingIntegrator?.name || '',
          receivingIntegratorName: result.receivingIntegrator?.name || '',
          projectDescription: result.project?.description || ''
        });
      } catch (notificationError) {
        console.error('Failed to send booking created notification', {
          scheduleId: result._id,
          error: notificationError.message
        });
      }
    }

    return successResponse(result);
  } catch (error) {
    console.error('Error in POST /scheduler:', error);
    return errorResponse(error.message, 500, error);
  }
};
