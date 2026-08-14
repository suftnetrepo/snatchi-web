
import {
  searchInvoiceByUser,
  getMyInvoices,
  removeInvoice,
  updateInvoice,
  createInvoice,
  getInvoices,
  aggregateInvoiceDataByStatus
  ,updateEngineerInvoice
  ,reviewInvoice
  ,removeEngineerInvoice
} from '../services/invoice';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';

const canManageInvoices = (user) => ['integrator', 'manager'].includes(user?.role);
const errorResponse = (message, status = 500) => NextResponse.json({ success: false, error: message }, { status });

export const GET = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'paginate') {
      if (!canManageInvoices(user)) return errorResponse('You do not have permission to view invoices', 403);
      const sortField = url.searchParams.get('sortField');
      const sortOrder = url.searchParams.get('sortOrder');
      const searchQuery = url.searchParams.get('searchQuery');
      const dateFrom = url.searchParams.get('dateFrom');
      const dateTo = url.searchParams.get('dateTo');
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);

      const { data, totalCount } = await getInvoices({
        suid: user?.integrator,
        page,
        limit,
        sortField,
        sortOrder,
        searchQuery,
        dateFrom,
        dateTo
      });

      return NextResponse.json({ data, success: true, totalCount });
    }

    if (action === 'myInvoices') {
      const results = await getMyInvoices(user.id);
      return NextResponse.json({ data: results, success: true });
    }

    if (action === 'aggregate') {
      if (!canManageInvoices(user)) return errorResponse('You do not have permission to view invoice totals', 403);
      const aggregated = await aggregateInvoiceDataByStatus(user?.integrator);
      return NextResponse.json({ success: true, data: aggregated });
    }

    if (action === 'searchInvoices') {
      if (!canManageInvoices(user)) return errorResponse('You do not have permission to search invoices', 403);
      const searchQuery = url.searchParams.get('searchQuery');
      const searchResults = await searchInvoiceByUser(searchQuery, user.integrator);
      return NextResponse.json({ success: true, data: searchResults });
    }

    return NextResponse.json({ success: false, message: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    logger.error(error);
    return errorResponse(error.message, error.statusCode || 500);
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
    const deleted = user.role === 'engineer'
      ? await removeEngineerInvoice(user.id, id)
      : canManageInvoices(user)
        ? await removeInvoice(user.integrator, id)
        : null;
    if (!deleted) return errorResponse('You do not have permission to delete invoices', 403);
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    logger.error(error);
    return errorResponse(error.message, error.statusCode || 500);
  }
};

export const PUT = async (req) => {
  try {
    const user = await getUserSession(req);
    if (!user) return errorResponse('Unauthorized', 401);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const body = await req.json();
    const action = url.searchParams.get('action');
    let updated;
    if (user.role === 'engineer') {
      updated = await updateEngineerInvoice(user.id, id, body);
    } else if (canManageInvoices(user) && action === 'review') {
      updated = await reviewInvoice(user.integrator, user.id, id, body.status, body.reviewNotes);
    } else if (canManageInvoices(user)) {
      const allowedStatuses = new Set(['Paid', 'Unpaid', 'Cancelled']);
      if (!allowedStatuses.has(body?.status) || Object.keys(body || {}).some((key) => key !== 'status')) {
        return errorResponse('Only a valid payment status can be updated', 400);
      }
      updated = await updateInvoice(user.integrator, id, { status: body.status });
    } else {
      return errorResponse('You do not have permission to update invoices', 403);
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error(error);
    return errorResponse(error.message, error.statusCode || 500);
  }
};

export const POST = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'engineer') return errorResponse('Only engineers can submit invoices and quotes', 403);
    const body = await req.json();
  
    const result = await createInvoice(user, body);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error(error);
    return errorResponse(error.message, error.statusCode || 500);
  }
};
