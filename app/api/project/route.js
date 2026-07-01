import {
  getProjectWeeklySummary,
  getProjectSummaryByIntegrator,
  getProjects,
  getProjectById,
  removeProject,
  updateProject,
  createProject,
  getProjectStatusAggregates,
  getUserProjects,
  getUserProjectById,
  getMyProjects,
  getMyProjectAggregates
} from '../services/project';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';

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

// Parse pagination parameters from URL
const parsePaginationParams = (url) => {
  return {
    sortField: url.searchParams.get('sortField'),
    sortOrder: url.searchParams.get('sortOrder'),
    searchQuery: url.searchParams.get('searchQuery'),
    page: parseInt(url.searchParams.get('page') || '1', 10),
    limit: parseInt(url.searchParams.get('limit') || '10', 10)
  };
};

export const GET = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // TODO: Re-enable subscription enforcement after billing rollout is complete.

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Handle paginate action
    if (action === 'paginate') {
      const { sortField, sortOrder, searchQuery, page, limit } = parsePaginationParams(url);
      
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

    // Handle userProjects action
    if (action === 'userProjects') {
      const id = url.searchParams.get('id');
      const { data } = await getUserProjects(id);
      return successResponse(data);
    }

    // Handle getMyProjects action
    if (action === 'getMyProjects') {
      const id = url.searchParams.get('id');
      const { data } = await getMyProjects(id);
      return successResponse(data);
    }

    // Handle single action
    if (action === 'single') {
      const id = url.searchParams.get('id');
      const { data } = await getProjectById(id);
      return successResponse(data);
    }

    // Handle getUserProjectById action
    if (action === 'getUserProjectById') {
      const id = url.searchParams.get('id');
      const { data } = await getUserProjectById(id);
      return successResponse(data);
    }

    // Handle getMyProjectAggregates action
    if (action === 'getMyProjectAggregates') {
      const id = url.searchParams.get('id');
      const { data } = await getMyProjectAggregates(id);
      return successResponse(data);
    }

    // Handle aggregate action
    if (action === 'aggregate') {
      const aggregated = await getProjectStatusAggregates(user?.integrator);
      return successResponse(aggregated);
    }

    // Handle recent action
    if (action === 'recent') {
      const aggregated = await getProjectSummaryByIntegrator(user?.integrator);
      return successResponse(aggregated);
    }

    // Handle chart action
    if (action === 'chart') {
      const aggregated = await getProjectWeeklySummary(user?.integrator);
      return successResponse(aggregated);
    }

    // Invalid action
    return NextResponse.json(
      { success: false, error: 'Invalid action' }, 
      { status: 400 }
    );
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

    const deleted = await removeProject(user?.integrator, id);
    return successResponse(deleted);
  } catch (error) {
    return errorResponse(error.message, 500, error);
  }
};

export const PUT = async (req) => {
  try {
    const { error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const body = await req.json();

    const result = await updateProject(id, body);

    return successResponse(result);
  } catch (error) {
    return errorResponse(error.message, 500, error);
  }
};

export const POST = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const body = await req.json();
    const result = await createProject(user?.integrator, body);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error.message, 500, error);
  }
};