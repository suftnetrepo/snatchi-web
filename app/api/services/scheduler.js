const mongoose = require('mongoose');
import { schedulerValidator } from '../validator/user';
import Scheduler from '../models/scheduler';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
import { logger } from '../utils/logger';

mongoConnect();

async function getSchedules({ suid, page = 1, limit = 10, sortField, sortOrder, searchQuery }) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const skip = (page - 1) * limit;

  try {
    const sortOptions = sortField ? { [sortField]: sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };

    // Build match condition for search
    const searchMatch = searchQuery
      ? {
          $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { status: { $regex: searchQuery, $options: 'i' } },
            { 'user.first_name': { $regex: searchQuery, $options: 'i' } },
            { 'user.last_name': { $regex: searchQuery, $options: 'i' } },
            { 'user.email': { $regex: searchQuery, $options: 'i' } }
          ]
        }
      : {};

    const pipeline = [
      // Match by integrator first
      { $match: { integrator: new mongoose.Types.ObjectId(suid) } },
      
      // Lookup (populate) user
      {
        $lookup: {
          from: 'users', // Make sure this matches your User collection name
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      
      // Unwind user array to object
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      
      // Apply search filter if exists
      ...(searchQuery ? [{ $match: searchMatch }] : []),
      
      // Sort
      { $sort: sortOptions },
      
      // Facet for both data and count
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                status: 1,
                createdAt: 1,
                startDate:1,
                endDate:1,
                title : 1,
                // Include other Scheduler fields you need
                user: {
                  _id: 1,
                  first_name: 1,
                  last_name: 1,
                  email: 1
                }
              }
            }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const [result] = await Scheduler.aggregate(pipeline);
    
    const schedulers = result.data;
    const totalCount = result.totalCount[0]?.count || 0;
    return {
      data: schedulers,
      totalCount
    };
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function get({ suid }) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  const filter = new Date();
  filter.setDate(-30);

  try {
    const result = await Scheduler.find({
      integrator: suid,
      startDate: {
        $gte: filter
      }
    }).populate('user', 'first_name last_name email');

    return {
      data: result
    };
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getByUser(user_id, startDate, endDate) {
  if (!isValidObjectId(user_id)) {
    throw new Error(JSON.stringify([
      { field: 'user_id', message: 'Invalid MongoDB ObjectId' }
    ]));
  }

  try {
    const query = { user: user_id };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.$or = [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ];
    }

    const result = await Scheduler.find(query)
      .populate('user', 'first_name last_name email');
    return { data: result };

  } catch (error) {
    logger.error(error);
    throw new Error("Unexpected server error");
  }
}

async function getUsersByDates(suid, startDate, endDate) {
  if (!isValidObjectId(userId)) {
    throw new Error(JSON.stringify([{ field: 'userId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const result = await Scheduler.find({
      integrator: suid,
      startDate: {
        $gte: new Date(startDate)
      },
      endDate: {
        $lte: new Date(endDate)
      }
    })
      .populate('user', 'first_name last_name email')
      .sort({ date: -1 });

    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function add(body) {
  const bodyErrors = schedulerValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  if (!isValidObjectId(body.user)) {
    throw new Error(JSON.stringify([{ field: 'user', message: 'Invalid user MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(body.integrator)) {
    throw new Error(JSON.stringify([{ field: 'integrator', message: 'Invalid integrator MongoDB ObjectId' }]));
  }

  const { startDate, endDate, ...rest } = body;
  const schedulerData = {
    ...rest,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
  };

  try {
    const scheduler = await Scheduler.create(schedulerData);
    await scheduler.populate('user', 'first_name last_name email');
    return scheduler;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function update(suid, id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = schedulerValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const result = await Scheduler.findOneAndUpdate(
      { _id: id, integrator: suid },
      {
        ...body,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('user', 'first_name last_name email');

    return result;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function updateByStatus(id, user_id, body) {
  if (!isValidObjectId(user_id)) {
    throw new Error(JSON.stringify([{ field: 'user_id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const result = await UserStatus.findOneAndUpdate(
      {
        user: user_id,
        _id: id,
        ...body
      },

      { new: true, runValidators: true }
    ).populate('user', 'first_name last_name email');
    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function remove(suid, id) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    await Scheduler.findOneAndDelete({ _id: id, integrator: suid });

    return true;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export { getSchedules, remove, add, get, getByUser, update, updateByStatus, getUsersByDates };
