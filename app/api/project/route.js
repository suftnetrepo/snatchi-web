import {
  getProjectWeeklySummary,
  getProjectSummaryByIntegrator,
  getProjects,
  getProjectById,
  removeProject,
  updateProject,
  createProject,
  getProjectStatusAggregates,
  getUserProjects, getUserProjectById, getMyProjects, getMyProjectAggregates
} from '../services/project';
import { logger } from '../utils/logger';
const { NextResponse } = require('next/server');
import { getUserSession } from '@/utils/generateToken';
import { notifyAssignedUsers } from "../utils/format-project";

export const GET = async (req) => {
  console.time('GET /api/project');
  try {
    console.log('🔵 /api/project GET start', { timestamp: new Date().toISOString() });
    
    console.log('🔵 Getting user session...');
    const user = await getUserSession(req);
    console.log('🔵 User session obtained:', { userId: user?.id, integrator: user?.integrator });

    if (!user) {
      console.log('🔴 No user session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Re-enable subscription enforcement after billing rollout is complete.

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    console.log('🔵 Action:', action);

    if (action === 'paginate') {
      const sortField = url.searchParams.get('sortField');
      const sortOrder = url.searchParams.get('sortOrder');
      const searchQuery = url.searchParams.get('searchQuery');
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);

      console.log('🔵 Fetching projects with pagination...');
      const { data, success, totalCount } = await getProjects({
        suid: user?.integrator,
        page,
        limit,
        sortField,
        sortOrder,
        searchQuery
      });
      console.log('🟢 Returning projects');
      return NextResponse.json({ data, success, totalCount });
    }

    if (action === 'userProjects') {
      const id = url.searchParams.get('id');
      console.log('🔵 Fetching user projects...');
      const { data } = await getUserProjects(id);
      console.log('🟢 Returning user projects');
      return NextResponse.json({ data, success: true });
    }

    if (action === 'getMyProjects') {
      const id = url.searchParams.get('id');
      console.log("🔵 Fetching my projects for user id:", id);
      const { data } = await getMyProjects(id);
      console.log("🟢 Returning my projects");
      return NextResponse.json({ data, success: true });
    }

    if (action === 'single') {
      const id = url.searchParams.get('id');
      console.log('🔵 Fetching single project...');
      const { data } = await getProjectById(id);
      console.log('🟢 Returning single project');
      return NextResponse.json({ data, success: true });
    }

    if (action === 'getUserProjectById') {
      const id = url.searchParams.get('id');
      console.log('🔵 Fetching user project by id...');
      const { data } = await getUserProjectById(id);
      console.log('🟢 Returning user project by id');
      return NextResponse.json({ data, success: true });
    }

    if (action === 'getMyProjectAggregates') {
      const id = url.searchParams.get('id');
      console.log('🔵 Fetching my project aggregates...');
      const { data } = await getMyProjectAggregates(id);
      console.log('🟢 Returning my project aggregates');
      return NextResponse.json({ data, success: true });
    }

    if (action === 'aggregate') {
      console.log('🔵 Fetching project status aggregates...');
      const aggregated = await getProjectStatusAggregates(user?.integrator);
      console.log('🟢 Returning project status aggregates');
      return NextResponse.json({ success: true, data: aggregated });
    }

    if (action === 'recent') {
      console.log('🔵 Fetching project summary...');
      const aggregated = await getProjectSummaryByIntegrator(user?.integrator);
      console.log('🟢 Returning project summary');
      return NextResponse.json({ success: true, data: aggregated });
    }

    if (action === 'chart') {
      console.log('🔵 Fetching project weekly summary...');
      const aggregated = await getProjectWeeklySummary(user?.integrator);
      console.log('🟢 Returning project weekly summary');
      return NextResponse.json({ success: true, data: aggregated });
    }

    console.log('🔴 Invalid action:', action);
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.log('🔴 Error:', error.message);
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    console.timeEnd('GET /api/project');
  }
};

export const DELETE = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Re-enable subscription enforcement after billing rollout is complete.

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    const deleted = await removeProject(user?.integrator, id);
    return NextResponse.json({ success: true, data: deleted });
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

    // TODO: Re-enable subscription enforcement after billing rollout is complete.

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const body = await req.json();

    const { notify } = body;
    const result = await updateProject(id, body);
    if (result && notify) {
      notifyAssignedUsers(result);
    }

    return NextResponse.json({ success: true, data: result });
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

    // TODO: Re-enable subscription enforcement after billing rollout is complete.

    const body = await req.json();
    const result = await createProject(user?.integrator, body);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
