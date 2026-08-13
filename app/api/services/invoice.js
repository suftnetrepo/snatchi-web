const mongoose = require('mongoose');
import { mongoConnect } from '@/utils/connectDb';
import Invoice from '../models/invoice';
import User from '../models/user';
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
      invoice_type: { $in: ['Quote', 'Save'] },
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
      const results = await Invoice.find({ user: user_id }).exec();
      return results;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function createInvoice(integratorId, userId, body) {
  if (!isValidObjectId(integratorId)) {
    throw new Error(JSON.stringify([{ field: 'integratorId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const newInvoice = await Invoice.create({
      ...body,
      integrator: integratorId,
      user: userId
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
};
