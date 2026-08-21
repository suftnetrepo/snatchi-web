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
import { v2 as cloudinary } from 'cloudinary';
import { getOrganisationEntitlements, isActiveProjectStatus, releaseEntitlement, reserveEntitlement } from '../services/entitlements';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRETE
});

const deleteProjectAttachment = async (attachment) => {
  if (!attachment?.public_id) return;

  const resourceTypes = attachment.resource_type
    ? [attachment.resource_type]
    : attachment.document_type?.toLowerCase() === 'image'
      ? ['image', 'raw']
      : ['raw', 'image'];

  for (const resourceType of resourceTypes) {
    const result = await cloudinary.uploader.destroy(attachment.public_id, {
      resource_type: resourceType,
      invalidate: true
    });
    if (result.result !== 'not found') return;
  }
};

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
  return NextResponse.json({ success: false, error: message, code: error?.code, details: error?.details }, { status });
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
    dateFrom: url.searchParams.get('dateFrom'),
    dateTo: url.searchParams.get('dateTo'),
    page: parseInt(url.searchParams.get('page') || '1', 10),
    limit: parseInt(url.searchParams.get('limit') || '10', 10)
  };
};

const PROJECT_MUTABLE_FIELDS = new Set([
  'name', 'project_number', 'stakeholder', 'first_name', 'last_name', 'mobile', 'email', 'ppe',
  'description', 'startDate', 'endDate', 'status', 'priority', 'addressLine1', 'completeAddress',
  'county', 'town', 'country', 'postcode', 'location', 'budget'
]);

const sanitizeProjectBody = (body) => Object.fromEntries(
  Object.entries(body || {}).filter(([key]) => PROJECT_MUTABLE_FIELDS.has(key))
);

const canManageProjects = (user) => ['integrator', 'manager'].includes(user?.role);

const forbiddenResponse = () => NextResponse.json(
  { success: false, error: 'You do not have permission to manage projects' },
  { status: 403 }
);

export const GET = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    await getOrganisationEntitlements(user.integrator);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Handle paginate action
    if (action === 'paginate') {
      if (!canManageProjects(user)) return forbiddenResponse();
      const { sortField, sortOrder, searchQuery, dateFrom, dateTo, page, limit } = parsePaginationParams(url);
      
      const { data, success, totalCount, summary } = await getProjects({
        suid: user?.integrator,
        page,
        limit,
        sortField,
        sortOrder,
        searchQuery,
        dateFrom,
        dateTo
      });
      
      return NextResponse.json({ data, success, totalCount, summary });
    }

    // Handle userProjects action
    if (action === 'userProjects') {
      const { data } = await getUserProjects(user.id);
      return successResponse(data);
    }

    // Handle getMyProjects action
    if (action === 'getMyProjects') {
      const { data } = await getMyProjects(user.id);
      return successResponse(data);
    }

    // Handle single action
    if (action === 'single') {
      if (!canManageProjects(user)) return forbiddenResponse();
      const id = url.searchParams.get('id');
      const { data } = await getProjectById(id, user.integrator);
      if (!data) {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
      return successResponse(data);
    }

    // Handle getUserProjectById action
    if (action === 'getUserProjectById') {
      const id = url.searchParams.get('id');
      const { data } = await getUserProjectById(id, user.id);
      if (!data) {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
      return successResponse(data);
    }

    // Handle getMyProjectAggregates action
    if (action === 'getMyProjectAggregates') {
      const { data } = await getMyProjectAggregates(user.id);
      return successResponse(data);
    }

    // Handle aggregate action
    if (action === 'aggregate') {
      if (!canManageProjects(user)) return forbiddenResponse();
      const aggregated = await getProjectStatusAggregates(user?.integrator);
      return successResponse(aggregated);
    }

    // Handle recent action
    if (action === 'recent') {
      if (!canManageProjects(user)) return forbiddenResponse();
      const aggregated = await getProjectSummaryByIntegrator(user?.integrator);
      return successResponse(aggregated);
    }

    // Handle chart action
    if (action === 'chart') {
      if (!canManageProjects(user)) return forbiddenResponse();
      const aggregated = await getProjectWeeklySummary(user?.integrator);
      return successResponse(aggregated);
    }

    // Invalid action
    return NextResponse.json(
      { success: false, error: 'Invalid action' }, 
      { status: 400 }
    );
  } catch (error) {
    return errorResponse(error.message, error.statusCode || 500, error);
  }
};

export const DELETE = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (!canManageProjects(user)) return forbiddenResponse();

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    const deleted = await removeProject(user?.integrator, id);
    if (isActiveProjectStatus(deleted.status)) await releaseEntitlement(user.integrator, 'activeProjects');
    const cleanupResults = await Promise.allSettled(
      (deleted.attachments || []).map(deleteProjectAttachment)
    );
    cleanupResults.forEach((result) => {
      if (result.status === 'rejected') {
        logger.error('Project deleted, but Cloudinary attachment cleanup failed', result.reason);
      }
    });
    return successResponse(deleted);
  } catch (error) {
    return errorResponse(error.message, error.statusCode || 500, error);
  }
};

export const PUT = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (!canManageProjects(user)) return forbiddenResponse();

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const body = sanitizeProjectBody(await req.json());
    await getOrganisationEntitlements(user.integrator);
    const existing = await getProjectById(id, user.integrator);
    if (!existing?.data) return errorResponse('Project not found', 404);
    const wasActive = isActiveProjectStatus(existing.data.status);
    const willBeActive = isActiveProjectStatus(body.status ?? existing.data.status);
    let reserved = false;
    if (!wasActive && willBeActive) {
      await reserveEntitlement(user.integrator, 'activeProjects');
      reserved = true;
    }
    let result;
    try {
      result = await updateProject(user.integrator, id, body);
    } catch (updateError) {
      if (reserved) await releaseEntitlement(user.integrator, 'activeProjects');
      throw updateError;
    }
    if (wasActive && !willBeActive) await releaseEntitlement(user.integrator, 'activeProjects');

    return successResponse(result);
  } catch (error) {
    return errorResponse(error.message, error.statusCode || 500, error);
  }
};

export const POST = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (!canManageProjects(user)) return forbiddenResponse();

    const body = sanitizeProjectBody(await req.json());
    const countsAsActive = isActiveProjectStatus(body.status);
    if (countsAsActive) await reserveEntitlement(user.integrator, 'activeProjects');
    let result;
    try {
      result = await createProject(user?.integrator, body);
    } catch (createError) {
      if (countsAsActive) await releaseEntitlement(user.integrator, 'activeProjects');
      throw createError;
    }
    return successResponse(result);
  } catch (error) {
    return errorResponse(error.message, error.statusCode || 500, error);
  }
};
