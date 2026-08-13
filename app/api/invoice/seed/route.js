import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import Invoice from '../../models/invoice';
import User from '../../models/user';
import { logger } from '../../utils/logger';

const errorResponse = (message, status) => NextResponse.json({ success: false, error: message }, { status });

export const POST = async (req) => {
  if (process.env.NODE_ENV !== 'development') return errorResponse('Not found', 404);

  try {
    const sessionUser = await getUserSession(req);
    if (!sessionUser) return errorResponse('Unauthorized', 401);
    if (!['integrator', 'manager'].includes(sessionUser.role)) return errorResponse('Forbidden', 403);

    const engineer = await User.findOne({ integrator: sessionUser.integrator, role: 'engineer' }).select('_id');
    const invoiceUserId = engineer?._id || sessionUser.id;
    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);
    const seedRun = Date.now().toString().slice(-6);

    const invoices = Array.from({ length: 10 }, (_, index) => {
      const isPast = index < 5;
      const offset = isPast ? -(index + 1) * 7 : (index - 4) * 7;
      const issueDate = new Date(today);
      issueDate.setUTCDate(today.getUTCDate() + offset);
      const dueDate = new Date(issueDate);
      dueDate.setUTCDate(issueDate.getUTCDate() + 14);
      const duration = (index % 3) + 1;
      const rate = 220 + index * 15;
      const subtotal = duration * rate;
      const tax = Number((subtotal * 0.2).toFixed(2));

      return {
        integrator: sessionUser.integrator,
        user: invoiceUserId,
        issueDate,
        due_on: dueDate,
        status: isPast ? (index % 2 === 0 ? 'Paid' : 'Unpaid') : 'Unpaid',
        invoice_type: index % 3 === 0 ? 'Quote' : 'Save',
        invoice_description: `${isPast ? 'Past' : 'Future'} development invoice ${seedRun}-${index + 1}`,
        items: [{ description: 'Engineering services', unit: 'day', duration, rate, date: issueDate.toISOString().slice(0, 10) }],
        subtotal,
        tax,
        discount: 0,
        totalAmount: subtotal + tax,
        notes: 'Development seed data'
      };
    });

    const created = await Invoice.insertMany(invoices, { ordered: true });
    return NextResponse.json({ success: true, data: { count: created.length } }, { status: 201 });
  } catch (error) {
    logger.error(error);
    return errorResponse('Unable to seed development invoices', 500);
  }
};
