const mongoose = require('mongoose');
import { projectValidator } from '../validator/user';
import Project from '../models/project';
// Register the model referenced by Project.assignedTo before using populate().
import '../models/user';
import Scheduler from '../models/scheduler';
import Fence from '../models/fence';
import Payment from '../models/payment';
import Notification from '../models/notification';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
import { PROJECT_STATUS } from '../constants/statuses';
const { logger } = require('../utils/logger');

mongoConnect();

async function getProjects({ suid, page = 1, limit = 10, sortField, sortOrder, searchQuery, dateFrom, dateTo }) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const skip = (page - 1) * limit;

  try {
    const isDateKey = (value) => {
      if (!value) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    };
    if (!isDateKey(dateFrom) || !isDateKey(dateTo)) {
      const error = new Error('Invalid project date range');
      error.statusCode = 400;
      throw error;
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      const error = new Error('Start date must be on or before end date');
      error.statusCode = 400;
      throw error;
    }

    const sortOptions = sortField ? { [sortField]: sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };

    const searchFilter = searchQuery
      ? {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { stakeholder: { $regex: searchQuery, $options: 'i' } },
          { priority: { $regex: searchQuery, $options: 'i' } },
          { manager: { $regex: searchQuery, $options: 'i' } },
          { status: { $regex: searchQuery, $options: 'i' } }
        ]
      }
      : {};

    const dateConditions = [];
    // A project matches when any part of its delivery window overlaps the selected range.
    if (dateFrom) dateConditions.push({ endDate: { $gte: new Date(`${dateFrom}T00:00:00.000Z`) } });
    if (dateTo) dateConditions.push({ startDate: { $lte: new Date(`${dateTo}T23:59:59.999Z`) } });

    const query = {
      integrator: suid,
      ...searchFilter,
      ...(dateConditions.length > 0 && { $and: dateConditions })
    };

    const [projects, totalCount, statusCounts] = await Promise.all([
      Project.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      Project.countDocuments(query),
      Project.aggregate([
        { $match: { ...query, integrator: new mongoose.Types.ObjectId(suid) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const summary = statusCounts.reduce(
      (result, item) => ({ ...result, [item._id]: item.count }),
      { Pending: 0, Progress: 0, Completed: 0, Canceled: 0 }
    );

    return {
      data: projects,
      totalCount,
      summary
    };
  } catch (error) {
    logger.error(error);
    if (error.statusCode) throw error;
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

const getMyProjects = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    const engineerId = new mongoose.Types.ObjectId(userId);
    const scheduledProjectIds = await Scheduler.distinct('project', { engineer: engineerId });
    const projects = await Project.find({
      $or: [
        { 'assignedTo.id': engineerId },
        { _id: { $in: scheduledProjectIds } }
      ]
    })
      .populate('assignedTo.id', 'first_name last_name public_id secure_url')
      .sort({ startDate: 1 })
      .lean();

    return { data: projects };

  } catch (error) {
    logger.error(error);
    throw new Error(`Error fetching user projects: ${error.message}`);
  }
};


const getUserProjects = async (userId, excludeProjectStatuses = [PROJECT_STATUS.COMPLETED, PROJECT_STATUS.CANCELED]) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    const engineerId = new mongoose.Types.ObjectId(userId);
    const scheduledProjectIds = await Scheduler.distinct('project', { engineer: engineerId });
    const query = {
      $or: [
        { 'assignedTo.id': engineerId },
        { _id: { $in: scheduledProjectIds } }
      ],
      ...(excludeProjectStatuses.length > 0 && { status: { $nin: excludeProjectStatuses } })
    };
    const projects = await Project.find(query)
      .populate('assignedTo.id', 'first_name last_name public_id secure_url')
      .sort({ startDate: 1 })
      .lean();

    return { data: projects };
  } catch (error) {
    logger.error(error);
    throw new Error(`Error fetching project summary by assigned user: ${error.message}`);
  }
};

const getUserProjectById = async (projectId, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid project ID');
    }
    const engineerId = new mongoose.Types.ObjectId(userId);
    const hasSchedule = await Scheduler.exists({ project: projectId, engineer: engineerId });
    const project = await Project.findOne({
      _id: projectId,
      ...(hasSchedule ? {} : { 'assignedTo.id': engineerId })
    })
      .populate('assignedTo.id', 'first_name last_name public_id secure_url')
      .lean();

    if (!project) {
      throw new Error('Project not found');
    }
    return { data: project };
  } catch (error) {
    logger.error(error);
    throw new Error(`Error fetching project by ID: ${error.message}`);
  }
};

const getMyProjectAggregates = async (userId) => {

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const matchStage = {
      'assignedTo.id': new mongoose.Types.ObjectId(userId)
    };

    const aggregates = await Project.aggregate([
      { $match: matchStage },

      // Group by project status
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },

      // Format output
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1
        }
      },

      // Sort alphabetically (optional)
      { $sort: { status: 1 } }
    ]);

    return { data: aggregates };

  } catch (error) {
    logger.error(error);
    throw new Error(`Error fetching project aggregates: ${error.message}`);
  }
};


async function getProjectById(id, integratorId) {
  if (!isValidObjectId(id) || !isValidObjectId(integratorId)) {
    const error = new Error('Invalid project ID');
    error.statusCode = 400;
    throw error;
  }

  try {
    return Project.findOne({ _id: id, integrator: integratorId })
      .populate({
        path: 'assignedTo.id',
        select: 'first_name last_name fcm secure_url role id'
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
    throw error;
  }
}

async function createProject(id, body) {
  if (!isValidObjectId(id)) {
    const error = new Error('Invalid integrator ID');
    error.statusCode = 400;
    throw error;
  }

  const bodyErrors = projectValidator(body);
  if (bodyErrors !== true) {
    const error = new Error(bodyErrors.map((it) => it.message).join(','));
    error.statusCode = 400;
    throw error;
  }

  try {
    const newProject = await Project.create({
      integrator: id,
      ...body
    }).populate({
      path: 'assignedTo.id',
      select: 'first_name last_name fcm secure_url role id'
    });

    if (!newProject) {
      throw new Error('create new project failed');
    }

    return newProject;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function updateProject(integratorId, id, body) {
  if (!isValidObjectId(id) || !isValidObjectId(integratorId)) {
    const error = new Error('Invalid project ID');
    error.statusCode = 400;
    throw error;
  }

  const bodyErrors = projectValidator(body);
  if (bodyErrors !== true) {
    const error = new Error(bodyErrors.map((it) => it.message).join(','));
    error.statusCode = 400;
    throw error;
  }

  try {

    const updatedProject = await Project.findOneAndUpdate({ _id: id, integrator: integratorId }, body, {
      new: true,
      runValidators: true
    }).populate({
      path: 'assignedTo.id',
      select: 'first_name last_name fcm secure_url role id'
    });

    if (!updatedProject) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    return updatedProject;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function removeProject(suid, id) {
  if (!isValidObjectId(suid)) {
    const error = new Error('Invalid integrator ID');
    error.statusCode = 400;
    throw error;
  }

  try {
    if (!isValidObjectId(id)) {
      const error = new Error('Invalid project ID');
      error.statusCode = 400;
      throw error;
    }

    const project = await Project.findOne({ _id: id, integrator: suid });
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const [scheduleCount, fenceCount, paymentCount, notificationCount] = await Promise.all([
      Scheduler.countDocuments({ project: id }),
      Fence.countDocuments({ project: id }),
      Payment.countDocuments({ project: id }),
      Notification.countDocuments({ 'relatedTo.project': id })
    ]);

    if (scheduleCount || fenceCount || paymentCount || notificationCount) {
      const error = new Error(
        'This project has related work records and cannot be permanently deleted. Mark it as Canceled instead.'
      );
      error.statusCode = 409;
      throw error;
    }

    const deletedProject = await Project.findOneAndDelete({ _id: id, integrator: suid });
    if (!deletedProject) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }
    return deletedProject;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function getProjectStatusAggregates(integratorId) {
  if (!isValidObjectId(integratorId)) {
    throw new Error('Invalid integrator ID');
  }

  try {
    const aggregates = await Project.aggregate([
      {
        $match: { integrator: new mongoose.Types.ObjectId(integratorId) }
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
          totalProjects: { $sum: '$count' }
        }
      },
      {
        $project: {
          _id: 0,
          statuses: 1,
          totalProjects: 1
        }
      }
    ]);

    return aggregates.length > 0 ? aggregates[0] : { statuses: [], totalProjects: 0 };
  } catch (error) {
    logger.error(error);
    throw new Error(`Error aggregating project statuses: ${error.message}`);
  }
}

const getProjectSummaryByIntegrator = async (integratorId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(integratorId)) {
      throw new Error('Invalid integrator ID');
    }

    const summary = await Project.aggregate([
      { $match: { integrator: new mongoose.Types.ObjectId(integratorId) } },
      { $sort: { updatedAt: -1, createdAt: -1, _id: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          projectId: { $toString: '$_id' },
          name: '$name',
          assignedTo: { $size: '$assignedTo' },
          status: '$status',
          updatedAt: '$updatedAt',
          endDate: {
            $dateToString: { format: '%Y-%m-%d', date: '$endDate' }
          },
          startDate: {
            $dateToString: { format: '%Y-%m-%d', date: '$startDate' }
          }
        }
      }
    ]);

    return summary;
  } catch (error) {
    logger.error(error);
    throw new Error(`Error fetching project summary by integrator: ${error.message}`);
  }
};

const getProjectWeeklySummary = async (integratorId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(integratorId)) {
      throw new Error('Invalid integrator ID');
    }

    const projects = await Project.find({ integrator: integratorId }).select('_id createdAt').lean();

    // Helper: Format date as "Mon 20" format for display
    const formatDateLabel = (date) => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[date.getDay()];
      const day = date.getDate();
      return `${dayName} ${day}`;
    };

    // Helper: Convert date to YYYY-MM-DD string in UTC
    const dateToUTCString = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Helper: Get last 7 days in correct order (oldest to newest) using UTC
    const getLast7Days = () => {
      const days = [];
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setUTCDate(date.getUTCDate() - i);
        days.push(date);
      }
      return days;
    };

    if (projects.length === 0) {
      const emptyDays = getLast7Days().map(formatDateLabel);
      return { projects: [], days: emptyDays };
    }

    const projectIds = projects.map((project) => project._id);

    // Calculate date range for last 7 days (inclusive of today) using UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6); // 7 days = today + 6 previous days
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const projectsByDay = await Project.aggregate([
      {
        $match: {
          _id: { $in: projectIds },
          createdAt: { $gte: sevenDaysAgo, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get last 7 days with correct formatting
    const last7Days = getLast7Days();
    
    // Initialize result arrays with 0 for all 7 days
    const formattedProjects = Array(7).fill(0);

    // Fill in actual data from aggregation
    projectsByDay.forEach((item) => {
      const index = last7Days.findIndex(
        (d) => dateToUTCString(d) === item._id
      );
      if (index !== -1) {
        formattedProjects[index] = item.count;
      }
    });

    // Format day labels as "Mon 20" for display
    const dayLabels = last7Days.map(formatDateLabel);

    return { projects: formattedProjects, days: dayLabels };
  } catch (error) {
    logger.error('Error fetching project analysis data:', error);
    throw new Error('Error fetching project analysis data');
  }
};

export {
  getProjectWeeklySummary,
  getProjectSummaryByIntegrator,
  getProjectStatusAggregates,
  getProjects,
  getProjectById,
  removeProject,
  updateProject,
  createProject,
  getUserProjects,
  getUserProjectById,
  getMyProjects,
  getMyProjectAggregates
};
