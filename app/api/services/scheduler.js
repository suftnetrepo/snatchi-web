const mongoose = require('mongoose');
import { schedulerValidator } from '../validator/user';
import Scheduler from '../models/scheduler';
import Project from '../models/project';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
import { logger } from '../utils/logger';

mongoConnect();

// Helper function to extract time from date
const extractTimeFromDate = (dateString) => {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

async function getByUser(user_id) {
  try {
    const query = {};

    if (user_id) {
      if (!mongoose.isValidObjectId(user_id)) {
        throw new Error(JSON.stringify([{ field: 'user_id', message: 'Invalid MongoDB ObjectId' }]));
      }
      query.engineer = user_id;
    }

    // Only return future schedules
    const now = new Date();

    query.startDate = { $gte: now };

    const result = await Scheduler.find(query).populate('engineer', 'first_name last_name email');
    return { data: result };
  } catch (error) {
    logger.error(error);
    throw new Error('Unexpected server error');
  }
}

async function add(body) {
  const bodyErrors = schedulerValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  const { startDate, endDate, startTime, endTime, ...rest } = body;
  
  // Extract time from dates if startTime/endTime not provided
  const derivedStartTime = startTime || extractTimeFromDate(startDate);
  const derivedEndTime = endTime || extractTimeFromDate(endDate);
  
  const schedulerData = {
    ...rest,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    startTime: derivedStartTime,
    endTime: derivedEndTime
  };

  try {
    const scheduler = await Scheduler.create(schedulerData);
    await scheduler.populate('engineer', 'first_name last_name email');
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

  // Extract time from dates if startTime/endTime not provided
  const derivedStartTime = body.startTime || extractTimeFromDate(body.startDate);
  const derivedEndTime = body.endTime || extractTimeFromDate(body.endDate);

  try {
    const result = await Scheduler.findOneAndUpdate(
      { _id: id, integrator: suid },
      {
        ...body,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        startTime: derivedStartTime,
        endTime: derivedEndTime,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('engineer', 'first_name last_name email');

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

async function getByProjectDateRange(projectId) {
  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    // Get the project to find its start and end dates
    const project = await Project.findById(projectId, { startDate: 1, endDate: 1 });

    if (!project) {
      throw new Error('Project not found');
    }

    // Find all schedules for this project that fall within the project's date range
    const schedules = await Scheduler.find({
      project: projectId,
      startDate: { $gte: project.startDate },
      endDate: { $lte: project.endDate }
    }).populate('engineer', 'first_name last_name role secure_url');

    // Transform the result to include schedule ID and engineer info
    const result = schedules.map((schedule) => ({
      scheduleId: schedule._id,
      engineerId: schedule.engineer?._id,
      firstName: schedule.engineer?.first_name || '',
      lastName: schedule.engineer?.last_name || '',
      role: schedule.engineer?.role || '',
      avatar: schedule.engineer?.secure_url || ''
    }));

    return { data: result };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export { remove, add, getByUser, update, updateByStatus, getByProjectDateRange };
