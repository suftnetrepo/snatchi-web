const mongoose = require('mongoose');
import { projectValidator } from '../validator/user';
import Project from '../models/project';
import Task from '../models/task';
import { isValidObjectId } from '../utils/helps';
const { logger } = require('../utils/logger');

async function getProjects({ suid, page = 1, limit = 10, sortField, sortOrder, searchQuery }) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const skip = (page - 1) * limit;

  try {
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

    const query = {
      integrator: suid,
      ...searchFilter
    };

    const [projects, totalCount] = await Promise.all([
      Project.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      Project.countDocuments({ integrator: suid })
    ]);

    return {
      data: projects,
      totalCount
    };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getProjectById(id) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    return Project.findOne({ _id: id })
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

async function createProject(id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = projectValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const newProject = await Project.create({
      integrator: id,
      ...body
    });

    if (!newProject) {
      throw new Error('create new project failed');
    }

    return newProject;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function updateProject(id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = projectValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const updatedProject = await Project.findByIdAndUpdate(id, body, {
      new: true
    });

    if (!updatedProject) {
      throw new Error('Project not found or update failed');
    }

    return updatedProject;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function removeProject(suid, id) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    await Project.findOneAndDelete({ _id: id, integrator: suid });
    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
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
    console.error(error);
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
      {
        $lookup: {
          from: 'tasks', 
          localField: '_id',
          foreignField: 'project',
          as: 'tasks'
        }
      },
      {
        $addFields: {
          totalTasks: { $size: '$tasks' }, 
          completedTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'Completed'] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          progress: {
            $cond: [
              { $gt: ['$totalTasks', 0] }, 
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] }, 
              0 
            ]
          }
        }
      },
      {
        $addFields: {
          progress: { $round: ['$progress', 2] } 
        }
      },
      {
        $project: {
          _id: 0,
          name: '$name',
          assignedTo: { $size: '$assignedTo' }, 
          tasks: { $concat: [{ $toString: '$completedTasks' }, '/', { $toString: '$totalTasks' }] }, 
          progress: '$progress', 
          status: '$status',
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
    console.error(error);
    throw new Error(`Error fetching project summary by integrator: ${error.message}`);
  }
};

const getProjectWeeklySummary = async (integratorId) => {
  try {
    
    if (!mongoose.Types.ObjectId.isValid(integratorId)) {
      throw new Error('Invalid integrator ID');
    }

    const projects = await Project.find({ integrator: integratorId }).select('_id createdAt').lean();

    if (projects.length === 0) {
     return { projects: [], tasks: [], days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
    }

    const projectIds = projects.map((project) => project._id);

    const tasksByDay = await Task.aggregate([
      { $match: { project: { $in: projectIds } } }, 
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' }, 
          count: { $sum: 1 }
        }
      }
    ]);

    const projectsByDay = await Project.aggregate([
      { $match: { _id: { $in: projectIds } } },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' }, 
          count: { $sum: 1 }
        }
      }
    ]);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedProjects = Array(7).fill(0);
    const formattedTasks = Array(7).fill(0);

    projectsByDay.forEach((item) => {
      const dayIndex = item._id - 1;
      formattedProjects[dayIndex] = item.count;
    });

    tasksByDay.forEach((item) => {
      const dayIndex = item._id - 1;
      formattedTasks[dayIndex] = item.count;
    });

    return { projects: formattedProjects, tasks: formattedTasks, days: daysOfWeek };
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
  createProject
};
