import { remove, update, add, updateByStatus, getByUser, getByProjectDateRange } from '../services/scheduler';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { sendUserNotification } from '../services/notify';

export const GET = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');
    const projectId = url.searchParams.get('projectId');

    if (action === 'getByEngineer') {
      const results = await getByUser(id);
      return NextResponse.json({ success: true, data: results.data });
    }

    if (action === 'getByProjectDateRange') {
      const results = await getByProjectDateRange(projectId);
      return NextResponse.json({ success: true, data: results.data });
    }

    return NextResponse.json({ success: false, message: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
