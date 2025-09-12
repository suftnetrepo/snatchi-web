import { remove, update, add, get, updateByStatus, getByUser, getUsersByDates } from '../services/scheduler';
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

    if (action === 'getAll') {
      const { data, success, totalCount } = await get({
        suid: user?.integrator
      });

      return NextResponse.json({ data, success, totalCount });
    }

    if (action === 'getByUser') {
      const results = await getByUser(user?.id);
      return NextResponse.json({ data: results });
    }

    if (action === 'getByDates') {
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const results = await getUsersByDates(user?.id, startDate, endDate);
      return NextResponse.json({ data: results });
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
    return NextResponse.json({ data: results });
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
          userId: body.user,
          title,
          body: description,
          screen: 'CalendarListScreen',
          screenParams: { scheduleId: result._id }
        });
      }
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
