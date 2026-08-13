import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { isValidObjectId } from '../../utils/helps';
import Invoice from '../../models/invoice';
import { getInvoices } from '../../services/invoice';
import { generateInvoiceCsv, generateInvoicePdf, generateInvoiceRegisterCsv } from '../../services/invoiceExport';
import { logger } from '../../utils/logger';

export const GET = async (req) => {
  try {
    const user = await getUserSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['integrator', 'manager'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const format = url.searchParams.get('format');
    const scope = url.searchParams.get('scope');
    if (!['pdf', 'csv'].includes(format)) return NextResponse.json({ error: 'Invalid export request' }, { status: 400 });

    if (scope === 'register') {
      if (format !== 'csv') return NextResponse.json({ error: 'The invoice register is available as CSV' }, { status: 400 });
      const { data, totalCount } = await getInvoices({
        suid: user.integrator,
        page: 1,
        limit: 5000,
        sortField: 'createdAt',
        sortOrder: 'desc',
        searchQuery: url.searchParams.get('searchQuery') || '',
        dateFrom: url.searchParams.get('dateFrom') || undefined,
        dateTo: url.searchParams.get('dateTo') || undefined
      });
      const body = generateInvoiceRegisterCsv(data);
      const suffix = new Date().toISOString().slice(0, 10);
      return new NextResponse(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="invoice-register-${suffix}.csv"`, 'Cache-Control': 'private, no-store', 'X-Exported-Records': String(data.length), 'X-Total-Records': String(totalCount) } });
    }

    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });

    const invoice = await Invoice.findOne({ _id: id, integrator: user.integrator }).populate('user', 'first_name last_name').lean();
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const filename = `invoice-${String(invoice._id).slice(-8).toUpperCase()}.${format}`;
    const body = format === 'pdf' ? generateInvoicePdf(invoice) : generateInvoiceCsv(invoice);
    return new NextResponse(body, { headers: { 'Content-Type': format === 'pdf' ? 'application/pdf' : 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ error: 'Unable to export invoice' }, { status: 500 });
  }
};
