import {
  removeByUserAndDate,
  remove,
  update,
  add,
  get,
  getByUser,
  getByDate,
  getByMonthYear
} from '../../services/userStatus';
import { logger } from '../../utils/logger';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';

export const GET = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'users') {
      const sortField = url.searchParams.get('sortField');
      const sortOrder = url.searchParams.get('sortOrder');
      const searchQuery = url.searchParams.get('searchQuery');
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);

      const { data, success, totalCount } = await get({
        suid: user?.integrator,
        page,
        limit,
        sortField,
        sortOrder,
        searchQuery
      });

      return NextResponse.json({ data, success, totalCount });
    }

    if (action === 'getByUser') {
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const results = await getByUser(user?.id, user?.integrator, startDate, endDate);
      return NextResponse.json({ data: results });
    }

    if (action === 'getByDate') {
      const date = url.searchParams.get('date');
      const results = await getByDate(date, user?.integrator);
      return NextResponse.json({ success: true, data: results });
    }

    if (action === 'getByMonthYear') {
      const month = url.searchParams.get('month');
      const year = url.searchParams.get('year');
      const results = await getByMonthYear(month, year, user?.integrator);
      return NextResponse.json({ success: true, data: results });
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
    const action = url.searchParams.get('action');

    if (action === 'removeByUserAndDate') {
      const date = url.searchParams.get('date');
      const results = await removeByUserAndDate(id, date, user?.integrator);
      return NextResponse.json({ data: results });
    }

    if (action === 'remove') {
      const results = await remove(user?.integratorid);
      return NextResponse.json({ data: results });
    }

    return NextResponse.json({ success: false, message: 'Invalid action parameter' }, { status: 400 });
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

    const body = await req.json();

    const result = await update(user?.integrator, id, body);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
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

    const result = await add({ ...body, integrator: user?.integrator, user: user.id });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
