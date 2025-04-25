import { attendanceValidator } from '../validator/user';
import Attendance from '../models/attendance';
import mongoose from 'mongoose';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
import { logger } from '../utils/logger';

mongoConnect()

async function get({ suid, page = 1, limit = 10, sortField, sortOrder, searchQuery }) {
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
          ]
        }
      : {};

    const query = {
      integrator: suid,
      ...searchFilter
    };

    const [attendances, totalCount] = await Promise.all([
      Attendance.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      Attendance.countDocuments({ integrator: suid })
    ]);

    return {
      data: attendances,
      totalCount
    };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getBydate(dateString, suid) {
  const date = new Date(dateString);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  try {
    const result =  await Attendance.find({
      integrator : suid,
      date: {
        $gte: date,
        $lt: nextDay
      }
    });

    if (!result) {
      throw new Error('create new attendance failed');
    }

    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function add(body) {
  const bodyErrors = attendanceValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const result = await Attendance.create({
      ...body
    });

    if (!result) {
      throw new Error('create new attendance failed');
    }

    return result;
  } catch (error) {
    console.error(error);
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
    await Attendance.findOneAndDelete({ _id: id, integrator: suid });
    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export { remove, add, get, getBydate };
