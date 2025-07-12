import { userStatusValidator } from '../validator/user';
import UserStatus from '../models/userStatus';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
import { logger } from '../utils/logger';

mongoConnect();

// GET - Retrieve user statuses with pagination, sorting, and filtering
async function get({ suid, page = 1, limit = 10, sortField, sortOrder, searchQuery, dateQuery }) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  const skip = (page - 1) * limit;

  try {
    const sortOptions = sortField ? { [sortField]: sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };

    const searchFilter = searchQuery
      ? {
          $or: [
            { first_name: { $regex: searchQuery, $options: 'i' } },
            { last_name: { $regex: searchQuery, $options: 'i' } },
            { status: { $regex: searchQuery, $options: 'i' } },
            { note: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      : {};

    let dateFilter = {};
    if (dateQuery) {
      if (typeof dateQuery === 'string') {
        const startOfDay = new Date(dateQuery);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(dateQuery);
        endOfDay.setHours(23, 59, 59, 999);
        
        dateFilter = { date: { $gte: startOfDay, $lte: endOfDay } };
      } else if (typeof dateQuery === 'object') {
        dateFilter = { date: dateQuery };
      }
    }

    const query = {
      integrator: suid,
      ...searchFilter,
      ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
    };

    const [userStatuses, totalCount] = await Promise.all([
      UserStatus.find(query)
        .populate('user', 'first_name last_name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      UserStatus.countDocuments({ integrator: suid })
    ]);

    return {
      data: userStatuses,
      totalCount
    };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getByMonthYear(month, year, suid) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  // Create start and end dates for the month
  const startDate = new Date(year, month - 1, 1); // First day of month
  const endDate = new Date(year, month, 1); // First day of next month

  try {
    const result = await UserStatus.find({
      integrator: suid,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).populate('user', 'first_name last_name email');

    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// GET BY DATE - Retrieve user statuses for a specific date
async function getByDate(dateString, suid) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  const date = new Date(dateString);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  try {
    const result = await UserStatus.find({
      integrator: suid,
      date: {
        $gte: date,
        $lt: nextDay
      }
    }).populate('user', 'first_name last_name email');

    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// GET BY USER - Retrieve statuses for a specific user
async function getByUser(userId, suid, startDate, endDate) {
  if (!isValidObjectId(userId)) {
    throw new Error(JSON.stringify([{ field: 'userId', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const query = {
      user: userId,
      integrator: suid
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const result = await UserStatus.find(query)
      .populate('user', 'first_name last_name email')
      .sort({ date: -1 });

    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// POST - Create new user status
async function add(body) {
  const bodyErrors = userStatusValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  if (!isValidObjectId(body.user)) {
    throw new Error(JSON.stringify([{ field: 'user', message: 'Invalid user MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(body.integrator)) {
    throw new Error(JSON.stringify([{ field: 'integrator', message: 'Invalid integrator MongoDB ObjectId' }]));
  }

  try {
    // Check if status already exists for this user and date
    const existingStatus = await UserStatus.findOne({
      user: body.user,
      date: {
        $gte: new Date(body.date).setHours(0, 0, 0, 0),
        $lt: new Date(body.date).setHours(23, 59, 59, 999)
      }
    });

    if (existingStatus) {
      throw new Error('User status already exists for this date');
    }

    const result = await UserStatus.create({
      ...body,
      date: new Date(body.date)
    });

    if (!result) {
      throw new Error('Create new user status failed');
    }

    return result;
  } catch (error) {
    logger.error(error);
    if (error.message.includes('already exists')) {
      throw error;
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// PUT - Update existing user status
async function update(suid, id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = userStatusValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const result = await UserStatus.findOneAndUpdate(
      { _id: id, integrator: suid },
      {
        ...body,
        date: new Date(body.date),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('user', 'first_name last_name email');

    if (!result) {
      throw new Error('User status not found or update failed');
    }

    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// PATCH - Update user status by user ID and date
async function updateByUserAndDate(userId, dateString, suid, updateData) {
  if (!isValidObjectId(userId)) {
    throw new Error(JSON.stringify([{ field: 'userId', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  const date = new Date(dateString);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  try {
    const result = await UserStatus.findOneAndUpdate(
      {
        user: userId,
        integrator: suid,
        date: {
          $gte: date,
          $lt: nextDay
        }
      },
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('user', 'first_name last_name email');

    if (!result) {
      throw new Error('User status not found for the specified date');
    }

    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// DELETE - Remove user status
async function remove(suid, id) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const result = await UserStatus.findOneAndDelete({ _id: id, integrator: suid });
    
    if (!result) {
      throw new Error('User status not found');
    }

    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// DELETE BY USER AND DATE - Remove user status by user ID and date
async function removeByUserAndDate(userId, dateString, suid) {
  if (!isValidObjectId(userId)) {
    throw new Error(JSON.stringify([{ field: 'userId', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  const date = new Date(dateString);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  try {
    const result = await UserStatus.findOneAndDelete({
      user: userId,
      integrator: suid,
      date: {
        $gte: date,
        $lt: nextDay
      }
    });

    if (!result) {
      throw new Error('User status not found for the specified date');
    }

    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}


export { 
  remove, 
  add, 
  get, 
  getByDate, 
  getByUser, 
  update, 
  updateByUserAndDate, 
  removeByUserAndDate, 
  getByMonthYear
};