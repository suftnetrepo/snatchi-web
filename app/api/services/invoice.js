const mongoose = require('mongoose');
import { mongoConnect } from '@/utils/connectDb';
import Invoice from '../models/invoice';
import User from '../models/user';
import Scheduler from '../models/scheduler';
import { isValidObjectId } from '../utils/helps';
const { logger } = require('../utils/logger');

mongoConnect()

async function getInvoices({ suid, page = 1, limit = 10, sortField = 'status', sortOrder = 'desc', searchQuery = '', dateFrom, dateTo }) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const skip = (page - 1) * limit;

  try {
    const parseDateBoundary = (value, endOfDay = false) => {
      if (!value) return null;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Object.assign(new Error('Invalid invoice date range'), { statusCode: 400 });
      const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
      if (Number.isNaN(date.getTime())) throw Object.assign(new Error('Invalid invoice date range'), { statusCode: 400 });
      return date;
    };
    const from = parseDateBoundary(dateFrom);
    const to = parseDateBoundary(dateTo, true);
    if (from && to && from > to) throw Object.assign(new Error('From date must be before or equal to To date'), { statusCode: 400 });
    const issueDateFilter = from || to ? { issueDate: { ...(from && { $gte: from }), ...(to && { $lte: to }) } } : {};
    const sortOptions = sortField ? { [sortField]: sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };

    const escapedSearch = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = escapedSearch ? new RegExp(escapedSearch, 'i') : null;
    const matchingUsers = regex
      ? await User.find({
          integrator: suid,
          $or: [{ first_name: regex }, { last_name: regex }, { email: regex }]
        }).distinct('_id')
      : [];
    const searchFilter = regex ? {
      $or: [
        { status: regex },
        { invoice_type: regex },
        { invoice_description: regex },
        { user: { $in: matchingUsers } }
      ]
    } : {};

    const query = {
      integrator: suid,
      invoice_type: { $in: ['Quote', 'Invoice', 'Save'] },
      ...issueDateFilter,
      ...searchFilter
    };

    const [invoices, totalCount] = await Promise.all([
      Invoice.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'user',
          select: 'first_name last_name'
        })
        .populate('project', 'name project_number')
        .populate('scheduler', 'title startDate endDate status')
        .exec(),
      Invoice.countDocuments(query)
    ]);

    return {
      data: invoices,
      totalCount
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    if (error.statusCode) throw error;
    throw new Error('An unexpected error occurred while retrieving invoices. Please try again.');
  }
}

async function getMyInvoices(user_id) {
  if (!isValidObjectId(user_id)) {
    throw new Error(JSON.stringify([{ field: 'user_id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    try {
      const results = await Invoice.find({ user: user_id })
        .populate('project', 'name project_number')
        .populate('scheduler', 'title startDate endDate status')
        .sort({ createdAt: -1 })
        .exec();
      return results;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

const editableFields = new Set([
  'scheduler', 'invoice_type', 'invoice_description', 'issueDate', 'due_on',
  'items', 'discount', 'notes', 'status'
]);

const cleanInvoiceBody = (body = {}) => Object.fromEntries(
  Object.entries(body).filter(([key]) => editableFields.has(key))
);

const calculateInvoiceTotals = (body) => {
  const items = Array.isArray(body.items) ? body.items.map((item) => ({
    description: String(item.description || '').trim(),
    unit: item.unit === 'hour' ? 'hour' : 'day',
    duration: Number(item.duration),
    rate: Number(item.rate),
    date: String(item.date || '')
  })) : [];
  if (!items.length || items.some((item) => !item.description || !Number.isFinite(item.duration) || item.duration <= 0 || !Number.isFinite(item.rate) || item.rate < 0)) {
    throw Object.assign(new Error('At least one valid invoice item is required'), { statusCode: 400 });
  }
  const subtotal = Number(items.reduce((sum, item) => sum + (item.duration * item.rate), 0).toFixed(2));
  const discount = Math.max(0, Number(body.discount) || 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = Number((taxable * 0.2).toFixed(2));
  return { items, subtotal, discount, tax, totalAmount: Number((taxable + tax).toFixed(2)) };
};

async function createInvoice(user, body) {
  if (!isValidObjectId(user?.id) || !isValidObjectId(body?.scheduler)) {
    throw Object.assign(new Error('A valid booking is required'), { statusCode: 400 });
  }

  try {
    if (String(body.invoice_description || '').trim().length > 500) {
      throw Object.assign(new Error('Invoice description must not exceed 500 characters'), { statusCode: 400 });
    }
    const scheduler = await Scheduler.findOne({ _id: body.scheduler, engineer: user.id });
    if (!scheduler) throw Object.assign(new Error('Booking not found or not assigned to this engineer'), { statusCode: 404 });
    const allowedBookingStatuses = new Set(['Accepted', 'Approved', 'Paid', 'ReadyToStart', 'InProgress', 'Progress', 'Completed', 'Ready']);
    if (!allowedBookingStatuses.has(scheduler.status)) {
      throw Object.assign(new Error('Invoices and quotes can only be submitted for accepted work'), { statusCode: 409 });
    }
    const invoiceType = body.invoice_type === 'Quote' ? 'Quote' : 'Invoice';
    const status = body.status === 'Draft' ? 'Draft' : 'Submitted';
    const totals = calculateInvoiceTotals(body);
    const newInvoice = await Invoice.create({
      ...cleanInvoiceBody(body),
      ...totals,
      invoice_type: invoiceType,
      status,
      integrator: scheduler.integrator,
      user: user.id,
      scheduler: scheduler._id,
      project: scheduler.project,
      ...(status === 'Submitted' && { submittedAt: new Date() })
    });

    if (!newInvoice) {
      throw new Error('create new Invoice failed');
    }

    return newInvoice;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function updateEngineerInvoice(userId, id, body) {
  if (!isValidObjectId(id)) throw Object.assign(new Error('Invalid invoice ID'), { statusCode: 400 });
  const invoice = await Invoice.findOne({ _id: id, user: userId });
  if (String(body.invoice_description || '').trim().length > 500) {
    throw Object.assign(new Error('Invoice description must not exceed 500 characters'), { statusCode: 400 });
  }
  if (!invoice) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
  if (!['Draft', 'Rejected'].includes(invoice.status)) {
    throw Object.assign(new Error('Only draft or rejected invoices can be edited'), { statusCode: 409 });
  }
  const requestedStatus = body.status === 'Submitted' ? 'Submitted' : 'Draft';
  const totals = calculateInvoiceTotals(body);
  Object.assign(invoice, cleanInvoiceBody(body), totals, {
    invoice_type: body.invoice_type === 'Quote' ? 'Quote' : 'Invoice',
    status: requestedStatus,
    ...(requestedStatus === 'Submitted' && { submittedAt: new Date() })
  });
  await invoice.save();
  return invoice;
}

async function reviewInvoice(integratorId, reviewerId, id, status, reviewNotes = '') {
  const allowed = new Set(['Unpaid', 'Paid', 'Rejected', 'Approved', 'Cancelled']);
  if (!allowed.has(status)) throw Object.assign(new Error('Invalid review status'), { statusCode: 400 });
  const invoice = await Invoice.findOne({ _id: id, integrator: integratorId });
  if (!invoice) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
  if (!['Submitted', 'Unpaid', 'Paid', 'Rejected', 'Approved', 'Cancelled'].includes(invoice.status)) {
    throw Object.assign(new Error('This invoice cannot be reviewed in its current status'), { statusCode: 409 });
  }
  if (status === 'Rejected' && !String(reviewNotes || '').trim()) {
    throw Object.assign(new Error('Review notes are required when rejecting an invoice'), { statusCode: 400 });
  }
  if (invoice.invoice_type === 'Quote' && !['Approved', 'Rejected', 'Cancelled'].includes(status)) {
    throw Object.assign(new Error('Quotes can only be approved, rejected or cancelled'), { statusCode: 400 });
  }
  if (invoice.invoice_type !== 'Quote' && status === 'Approved') {
    throw Object.assign(new Error('Invoices cannot use the approved status'), { statusCode: 400 });
  }
  Object.assign(invoice, {
    status,
    reviewNotes,
    reviewedBy: reviewerId,
    ...(status === 'Rejected' ? { rejectedAt: new Date() } : ['Unpaid', 'Paid', 'Approved'].includes(status) ? { verifiedAt: new Date() } : {})
  });
  await invoice.save();
  return invoice.populate('user', 'first_name last_name');
}

async function updateInvoice(suid, id, body) {
  if (!isValidObjectId(suid)) {
    throw Object.assign(new Error('Invalid integrator ID'), { statusCode: 400 });
  }
  if (!isValidObjectId(id)) {
    throw Object.assign(new Error('Invalid invoice ID'), { statusCode: 400 });
  }

  try {
    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: id, integrator: suid },
      body,
      { new: true, runValidators: true }
    ).populate({
      path: 'user',
      select: 'first_name last_name'
    });

    if (!updatedInvoice) {
      throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
    }

    return updatedInvoice;
  } catch (error) {
    logger.error(error);
    if (error.statusCode) throw error;
    throw Object.assign(new Error('The invoice could not be updated. Please try again.'), { statusCode: 500 });
  }
}

async function removeInvoice(suid, id) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    if (!isValidObjectId(id)) throw Object.assign(new Error('Invalid invoice ID'), { statusCode: 400 });
    const deleted = await Invoice.findOneAndDelete({ _id: id, integrator: suid });
    if (!deleted) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
    return deleted;
  } catch (error) {
    logger.error(error);
    if (error.statusCode) throw error;
    throw Object.assign(new Error('The invoice could not be deleted. Please try again.'), { statusCode: 500 });
  }
}

async function removeEngineerInvoice(userId, id) {
  if (!isValidObjectId(userId) || !isValidObjectId(id)) {
    throw Object.assign(new Error('Invalid invoice ID'), { statusCode: 400 });
  }
  const deleted = await Invoice.findOneAndDelete({
    _id: id,
    user: userId,
    status: { $in: ['Draft', 'Rejected'] }
  });
  if (!deleted) {
    throw Object.assign(new Error('Only draft or rejected invoices can be deleted'), { statusCode: 409 });
  }
  return deleted;
}

async function searchInvoiceByUser(searchTerm, integratorId) {
  if (!isValidObjectId(integratorId)) throw Object.assign(new Error('Invalid integrator ID'), { statusCode: 400 });
  try {
    const escapedSearch = String(searchTerm || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escapedSearch) return [];
    const regex = new RegExp(escapedSearch, 'i');

    const users = await User.find({
      integrator: integratorId,
      $or: [{ first_name: regex }, { last_name: regex }, { email: regex }]
    }).limit(10);

    const userIds = users.map((user) => user._id);

    return await Invoice.find({
      integrator: integratorId,
      user: { $in: userIds }
    }).populate({
      path: 'user',
      select: 'first_name last_name email'
    });
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

const aggregateInvoiceDataByStatus = async (integratorId) => {
  try {
    const data = await Invoice.aggregate([
      { $match: { integrator: new mongoose.Types.ObjectId(integratorId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    return data;
  } catch (error) {
    logger.error(error);
    throw new Error('Error aggregating invoice data. Please try again.');
  }
};

export {
  searchInvoiceByUser,
  aggregateInvoiceDataByStatus,
  getInvoices,
  removeInvoice,
  updateInvoice,
  getMyInvoices,
  createInvoice
  ,updateEngineerInvoice
  ,reviewInvoice
  ,removeEngineerInvoice
};
