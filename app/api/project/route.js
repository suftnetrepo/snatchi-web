
import {
  getProjectWeeklySummary,
  getProjectSummaryByIntegrator,
  getProjects,
  getProjectById,
  removeProject,
  updateProject,
  createProject,
  getProjectStatusAggregates
} from '../services/project';
import { logger } from '../utils/logger';
const { NextResponse } = require('next/server');

export const GET = async (req) => {
  try {
    const userData = req.headers.get("x-user-data");
    const user = userData ? JSON.parse(userData) : null;

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'paginate') {
      const sortField = url.searchParams.get('sortField');
      const sortOrder = url.searchParams.get('sortOrder');
      const searchQuery = url.searchParams.get('searchQuery');
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);

      const { data, success, totalCount } = await getProjects({
        suid: user?.integrator,
        page,
        limit,
        sortField,
        sortOrder,
        searchQuery
      });
      return NextResponse.json({ data, success, totalCount });
    }

    if (action === 'single') {
      const id = url.searchParams.get('id');
      const { data } = await getProjectById(id);
      return NextResponse.json({ data, success: true });
    }

    if (action === 'aggregate') {
      const aggregated = await getProjectStatusAggregates(user?.integrator);
      return NextResponse.json({ success: true, data: aggregated });
    }

    if (action === 'recent') {
      const aggregated = await getProjectSummaryByIntegrator(user?.integrator);
      return NextResponse.json({ success: true, data: aggregated });
    }

    if (action === 'chart') {
      const aggregated = await getProjectWeeklySummary(user?.integrator);
      return NextResponse.json({ success: true, data: aggregated });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error(error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const DELETE = async (req) => {
  try {
    const userData = req.headers.get("x-user-data");
    const user = userData ? JSON.parse(userData) : null;
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
    const userData = req.headers.get("x-user-data");
    const user = userData ? JSON.parse(userData) : null;
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const body = await req.json();

    const updated = await updateProject(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const POST = async (req) => {
  try {
    const userData = req.headers.get("x-user-data");
    const user = userData ? JSON.parse(userData) : null;
    const body = await req.json();

    const result = await createProject(user?.integrator, body);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
