import { taskValidator } from '../validator/user';
import Task from '../models/task';
import Project from '../models/project';
import User from '../models/user';
const mongoose = require('mongoose');
import { isValidObjectId } from '../utils/helps';
import { getDayStartEnd } from '../utils/date-format';
const { logger } = require('../utils/logger');

async function getTasks({ projectId, page = 1, limit = 10, sortField, sortOrder, searchQuery }) {
  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  const skip = (page - 1) * limit;

  try {
    const sortOptions = sortField ? { [sortField]: sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };

    const searchFilter = searchQuery
      ? {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { priority: { $regex: searchQuery, $options: 'i' } },
            { status: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      : {};

    const query = {
      project: projectId,
      ...searchFilter
    };

    const [tasks, totalCount] = await Promise.all([
      Task.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      Task.countDocuments({ project: projectId })
    ]);

    return {
      data: tasks,
      totalCount
    };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getTaskById(projectId, id) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    return Task.findOne({ _id: id, project: projectId })
      .populate({
        path: 'assignedTo.id',
        select: 'first_name, last_name, fcm, secure_url, role '
      })
      .exec()
      .then((results) => {
        return { data: results };
      })
      .catch((error) => {
        throw error;
      });
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getMyTasks(user_id, date) {
  if (!isValidObjectId(user_id)) {
    throw new Error(JSON.stringify([{ field: 'user_id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const { startDate, endDate } = getDayStartEnd(date);

  try {
    const tasks = await Task.find({
      'assignedTo.id': user_id,
      startDate: { $gte: startDate, $lt: endDate }
    })
      .populate({
        path: 'project',
        select: 'name addressLine1 completeAddress county town country postcode location'
      })
      .sort({ createdAt: -1 });

    return tasks;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function createTask(body) {
  const bodyErrors = taskValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const newTask = await Task.create({
      ...body
    });

    if (!newTask) {
      throw new Error('create new task failed');
    }

    return newTask;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function updateTask(id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = taskValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const updatedTask = await Task.findByIdAndUpdate(id, body, {
      new: true
    });

    if (!updatedTask) {
      throw new Error('Task not found or update failed');
    }

    return updatedTask;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function updateOneTask(id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const updatedTask = await Task.findByIdAndUpdate(id, body, {
      new: true
    });

    if (!updatedTask) {
      throw new Error('Task not found or update failed');
    }

    return updatedTask;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function removeTask(projectId, id) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    await Task.findOneAndDelete({ _id: id, project: projectId });
    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getTaskStatusAggregates(user_id) {
  if (!isValidObjectId(user_id)) {
    throw new Error('Invalid user ID');
  }

  try {
    const aggregates = await Task.aggregate([
      {
        $match: {
          'assignedTo.id': new mongoose.Types.ObjectId(user_id)
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          statuses: {
            $push: {
              status: '$_id',
              count: '$count'
            }
          },
          totalTasks: { $sum: '$count' }
        }
      },
      {
        $project: {
          _id: 0,
          statuses: 1,
          totalTasks: 1
        }
      }
    ]);

    return aggregates.length > 0 ? aggregates[0] : { statuses: [], totalProjects: 0 };
  } catch (error) {
    logger.error(error);
    throw new Error(`Error aggregating project statuses: ${error.message}`);
  }
}

export { updateOneTask, getTaskStatusAggregates, getMyTasks, getTasks, getTaskById, removeTask, updateTask, createTask };
