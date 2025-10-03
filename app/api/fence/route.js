import { add, remove, getBydate, getByUser } from '../services/fence';
import { logger } from '../utils/logger';
const { NextResponse } = require('next/server');
import { getUserSession } from '@/utils/generateToken';

export const GET = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'getBydate') {
      const date = url.searchParams.get('date');
      const tasks = await getBydate(date, user.integrator);
      return NextResponse.json({ data: tasks, success: true }, { status: 200 });
    }

    if (action === 'getByUser') {
      const date = url.searchParams.get('date');
      const userId = url.searchParams.get('userId');
      const tasks = await getByUser(date, userId);
      return NextResponse.json({ data: tasks, success: true }, { status: 200 });
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

    const deleted = await remove(user.integrator, id);

    return NextResponse.json({ success: true, data: deleted }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const POST = async (req) => {
  try {
  
    const body = await req.json();
    console.log('Fence body', body);
    const result = await add(body);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
