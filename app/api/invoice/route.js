import {
  searchInvoiceByUser,
  getMyInvoices,
  removeInvoice,
  updateInvoice,
  createInvoice,
  getInvoices,
  aggregateInvoiceDataByStatus
} from '../services/invoice';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';

export const GET = async (req) => {
  try {
    const userData = req.headers.get('x-user-data');
    const user = userData ? JSON.parse(userData) : null;

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'paginate') {

      const sortField = url.searchParams.get('sortField');
      const sortOrder = url.searchParams.get('sortOrder');
      const searchQuery = url.searchParams.get('searchQuery');
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);

      const { data, totalCount } = await getInvoices({
        suid: user?.integrator,
        page,
        limit,
        sortField,
        sortOrder,
        searchQuery
      });

      return NextResponse.json({ data, success: true, totalCount});
    }

    if (action === 'myInvoices') {
      const results = await getMyInvoices(user.id);
      return NextResponse.json({ data: results, success: true });
    }

    if (action === 'aggregate') {
      const aggregated = await aggregateInvoiceDataByStatus(user?.integrator);
      return NextResponse.json({ success: true, data: aggregated });
    }

    if (action === 'searchInvoices') {
      const searchQuery = url.searchParams.get('searchQuery');
      const searchResults = await searchInvoiceByUser(searchQuery);
      return NextResponse.json({ success: true, data: searchResults });
    }

    return NextResponse.json({ success: false, message: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const DELETE = async (req) => {
  try {
    const userData = req.headers.get('x-user-data');
    const user = userData ? JSON.parse(userData) : null;
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    const deleted = await removeInvoice(user?.integrator, id);
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const PUT = async (req) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const body = await req.json();

    const updated = await updateInvoice(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const POST = async (req) => {
  try {
    const userData = req.headers.get('x-user-data');
    const user = userData ? JSON.parse(userData) : null;
    const body = await req.json();

    const result = await createInvoice(user?.integrator, user?.id, body);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
