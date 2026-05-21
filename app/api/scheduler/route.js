import { remove, update, add, updateByStatus, getByUser, getByProjectDateRange, getAllSchedules } from '../services/scheduler';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { sendUserNotification } from '../services/notify';

export const GET = async (req) => {
  console.time('GET /api/scheduler');
  try {
    console.log('🔵 /api/scheduler GET start', { timestamp: new Date().toISOString() });
    
    console.log('🔵 Getting user session...');
    const user = await getUserSession(req);
    console.log('🔵 User session obtained:', { userId: user?.id, integrator: user?.integrator });

    if (!user) {
      console.log('🔴 No user session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');
    const projectId = url.searchParams.get('projectId');

    console.log('🔵 Action:', action);

    if (action === 'getByEngineer') {
      console.log('🔵 Fetching schedules by engineer...');
      const results = await getByUser(id);
      console.log('🟢 Returning schedules by engineer');
      return NextResponse.json({ success: true, data: results.data });
    }

    if (action === 'getByProjectDateRange') {
      console.log('🔵 Fetching schedules by project date range...');
      const results = await getByProjectDateRange(projectId);
      console.log('🟢 Returning schedules by project date range');
      return NextResponse.json({ success: true, data: results.data });
    }

    if (action === 'getAllSchedules') {
      console.log('🔵 Fetching all schedules for integrator:', user.integrator);
      const results = await getAllSchedules(user.integrator);
      console.log('🟢 Returning all schedules, count:', results.data?.length || 0);
      return NextResponse.json({ success: true, data: results.data });
    }

    console.log('🔴 Invalid action:', action);
    return NextResponse.json({ success: false, message: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    console.log('🔴 Error:', error.message);
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    console.timeEnd('GET /api/scheduler');
  }
};

export const DELETE = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    const results = await remove(user?.integrator, id);
    return NextResponse.json({ data: results, success: true }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const PUT = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    if (action === 'status') {
      const body = await req.json();
      const result = await updateByStatus(id, user?.id, body);
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === 'update') {
      const body = await req.json();
      const result = await update(user?.integrator, id, body);
      if (result) {
        const { title, description, status } = body;
        if (status === 'Pending') {
          await sendUserNotification({
            userId: body.engineer,
            title,
            body: description,
            screen: 'calendar',
            screenParams: { scheduleId: id, startDate: body.startDate, endDate: body.endDate, projectId : body.project }
          });
        }
      }
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const POST = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();

    const result = await add({ ...body, integrator: user?.integrator });
    if (result) {
      const { title, description, status } = body;
      if (status === 'Pending') {
        await sendUserNotification({
          userId: body.engineer,
          title,
          body: description,
          screen: 'calendar',
          screenParams: { scheduleId: result._id, projectId : body.project}
        });
      }
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
