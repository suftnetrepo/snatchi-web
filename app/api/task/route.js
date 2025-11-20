import {
  getMyTasks,
  getTaskById,
  getTasks,
  removeTask,
  updateTask,
  createTask,
  updateOneTask,
  getMyRecentTasks,
  getTaskStatusAggregates,
  getMyTasksById
} from '../services/task';
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

    if (action === 'paginate') {
      const sortField = url.searchParams.get('sortField');
      const sortOrder = url.searchParams.get('sortOrder');
      const searchQuery = url.searchParams.get('searchQuery');
      const projectId = url.searchParams.get('projectId');
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);

      const { data, success, totalCount } = await getTasks({
        projectId,
        page,
        limit,
        sortField,
        sortOrder,
        searchQuery
      });

      return NextResponse.json({ data, success, totalCount }, { status: 200 });
    }

    if (action === 'single') {
      const id = url.searchParams.get('id');
      const projectId = url.searchParams.get('projectId');
      const { data } = await getTaskById(projectId, id);
      return NextResponse.json({ data, success: true }, { status: 200 });
    }

    if (action === 'myTasks') {
      const date = url.searchParams.get('date');
      const tasks = await getMyTasks(user.id, date);
      return NextResponse.json({ data: tasks, success: true }, { status: 200 });
    }

    if (action === 'getMyTasksById') {
      const id = url.searchParams.get('id');
      const tasks = await getMyTasksById(id);
      return NextResponse.json({ data: tasks, success: true }, { status: 200 });
    }

    if (action === 'myRecentTasks') {
      const tasks = await getMyRecentTasks(user.id);
      return NextResponse.json({ data: tasks, success: true }, { status: 200 });
    }

    if (action === 'aggregate') {
      const aggregated = await getTaskStatusAggregates(user.id);
      return NextResponse.json({ success: true, data: aggregated });
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
    const projectId = url.searchParams.get('projectId');

    const deleted = await removeTask(projectId, id);

    return NextResponse.json({ success: true, data: deleted }, { status: 200 });
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
    const body = await req.json();

    if (action === 'single') {
      const updated = await updateOneTask(id, body);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'multiple') {
      const updated = await updateTask(id, body);
      return NextResponse.json({ success: true, data: updated }, { status: 200 });
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

    const result = await createTask(body);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
