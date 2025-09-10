const mongoose = require('mongoose');
import { mongoConnect } from '@/utils/connectDb';
import Invoice from '../models/invoice';
import User from '../models/user';
import { isValidObjectId } from '../utils/helps';
const { logger } = require('../utils/logger');

mongoConnect()

async function getInvoices({ suid, page = 1, limit = 10, sortField = 'status', sortOrder = 'desc', searchQuery = '' }) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const skip = (page - 1) * limit;

  try {
    const sortOptions = sortField ? { [sortField]: sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };

    const searchFilter = searchQuery
      ? {
          $or: [
            { status: { $regex: searchQuery, $options: 'i' } },
          ]
        }
      : {};

    const query = {
      integrator: suid,
      invoice_type: { $in: ['Quote', 'Save'] },
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
      Invoice.countDocuments({ integrator: suid })
    ]);

    return {
      data: invoices,
      totalCount
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
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
      integrator: integratorId,
      user: userId,
      ...body
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

async function updateInvoice(id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(id, body, {
      new: true
    });

    if (!updatedInvoice) {
      throw new Error('Invoice not found or update failed');
    }

    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function removeInvoice(suid, id) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    await Invoice.findOneAndDelete({ _id: id, integrator: suid });
    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function searchInvoiceByUser(searchTerm) {
  try {
    const regex = new RegExp(searchTerm, 'i');

    const users = await User.find({
      $or: [{ firstName: regex }, { lastName: regex }, { email: regex }]
    }).limit(10);

    const userIds = users.map((user) => user._id);

    return await Invoice.find({
      user: { $in: userIds }
    }).populate({
      path: 'user',
      select: 'firstName lastName email'
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
