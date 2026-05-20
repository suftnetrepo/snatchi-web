const mongoose = require('mongoose');
import { projectValidator } from '../validator/user';
import Project from '../models/project';
import User from '../models/user';
import Task from '../models/task';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
import { PROJECT_STATUS, TASK_STATUS } from '../constants/statuses';
const { logger } = require('../utils/logger');

mongoConnect();

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

const getMyProjects = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Always return all projects — no status filtering
    const matchStage = {
      'assignedTo.id': new mongoose.Types.ObjectId(userId)
    };

    const projects = await Project.aggregate([
      { $match: matchStage },

      // Lookup tasks
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'project',
          as: 'tasks'
        }
      },

      // Lookup assigned user details
      {
        $lookup: {
          from: 'users',
          let: { assignedIds: '$assignedTo.id' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$assignedIds'] }
              }
            },
            {
              $project: {
                _id: 1,
                public_id: 1,
                secure_url: 1,
                name: {
                  $concat: [
                    { $ifNull: ['$first_name', ''] },
                    ' ',
                    { $ifNull: ['$last_name', ''] }
                  ]
                }
              }
            }
          ],
          as: 'assignedUsers'
        }
      },

      // Merge assigned users into assignedTo[]
      {
        $addFields: {
          assignedTo: {
            $map: {
              input: '$assignedTo',
              as: 'assignee',
              in: {
                $mergeObjects: [
                  '$$assignee',
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$assignedUsers',
                          as: 'user',
                          cond: { $eq: ['$$user._id', '$$assignee.id'] }
                        }
                      },
                      0
                    ]
                  }
                ]
              }
            }
          }
        }
      },

      // Cleanup
      {
        $project: {
          __v: 0,
          'tasks.__v': 0,
          assignedUsers: 0
        }
      }
    ]);

    const today = new Date();

    // Enhance tasks with defaults
    const result = projects.map(project => {
      const activeTasks = project.tasks; // keep all tasks

      const totalTasks = activeTasks.length;
      const completedTasks = activeTasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;

      const progress = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 10000) / 100
        : 0;

      const enhancedTasks = activeTasks.map(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;

        let dueInDays = null;
        let overdue = false;
        let statusLabel = task.status;

        if (dueDate) {
          const diffMs = dueDate - today;
          dueInDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          overdue = dueInDays < 0;
        }

        if (task.status === TASK_STATUS.COMPLETED) {
          statusLabel = 'Completed';
        } else if (overdue) {
          statusLabel = 'Delayed';
        } else {
          statusLabel = 'On Track';
        }

        return {
          ...task,
          dueInDays,
          overdue,
          statusLabel,
          totalTasks,
          completedTasks,
          progress
        };
      });

      return {
        ...project,
        tasks: enhancedTasks,
        totalTasks,
        completedTasks,
        progress
      };
    });

    console.log('Fetched ALL projects for user:', userId, 'Count:', result.length);

    return { data: result };

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

    const matchStage = {
      'assignedTo.id': new mongoose.Types.ObjectId(userId)
    };

    if (excludeProjectStatuses.length > 0) {
      matchStage.status = { $nin: excludeProjectStatuses };
    }

    const projects = await Project.aggregate([
      {
        $match: matchStage
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'project',
          as: 'tasks'
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { assignedIds: '$assignedTo.id' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$assignedIds'] }
              }
            },
            {
              $project: {
                _id: 1,
                public_id: 1,
                secure_url: 1,
                name: {
                  $concat: [
                    { $ifNull: ['$first_name', ''] },
                    ' ',
                    { $ifNull: ['$last_name', ''] }
                  ]
                }
              }
            }
          ],
          as: 'assignedUsers'
        }
      },
      // Merge assigned user details into each assignedTo entry
      {
        $addFields: {
          assignedTo: {
            $map: {
              input: '$assignedTo',
              as: 'assignee',
              in: {
                $mergeObjects: [
                  '$$assignee',
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$assignedUsers',
                          as: 'user',
                          cond: { $eq: ['$$user._id', '$$assignee.id'] }
                        }
                      },
                      0
                    ]
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          __v: 0,
          'tasks.__v': 0,
          assignedUsers: 0
        }
      }
    ]);

    const today = new Date();

    const result = projects.map(project => {
      const activeTasks = project.tasks.filter(
        t => ![PROJECT_STATUS.CANCELED, 'Archived'].includes(t.status)
      );

      const totalTasks = activeTasks.length;
      const completedTasks = activeTasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
      const progress = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 10000) / 100
        : 0;

      const enhancedTasks = activeTasks.map(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        let dueInDays = null;
        let overdue = false;
        let statusLabel = task.status;

        if (dueDate) {
          const diffMs = dueDate - today;
          dueInDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          overdue = dueInDays < 0;
        }

        if (task.status === TASK_STATUS.COMPLETED) {
          statusLabel = 'Completed';
        } else if (overdue) {
          statusLabel = 'Delayed';
        } else {
          statusLabel = 'On Track';
        }

        return {
          ...task,
          dueInDays,
          overdue,
          statusLabel,
          totalTasks,
          completedTasks,
          progress
        };
      });

      return {
        ...project,
        tasks: enhancedTasks,
        totalTasks,
        completedTasks,
        progress
      };
    });

    console.log('Fetched projects for user:', userId, 'Count:', result.length);

    return { data: result };
  } catch (error) {
    logger.error(error);
    throw new Error(`Error fetching project summary by assigned user: ${error.message}`);
  }
};

const getUserProjectById = async (projectId) => {
  try {
   
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error('Invalid project ID');
    }

    const matchStage = {
      _id: new mongoose.Types.ObjectId(projectId),
    };

    const projectResult = await Project.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'project',
          as: 'tasks',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { assignedIds: '$assignedTo.id' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$assignedIds'] } } },
            {
              $project: {
                _id: 1,
                public_id: 1,
                secure_url: 1,
                name: {
                  $concat: [
                    { $ifNull: ['$first_name', ''] },
                    ' ',
                    { $ifNull: ['$last_name', ''] },
                  ],
                },
              },
            },
          ],
          as: 'assignedUsers',
        },
      },
      {
        $addFields: {
          assignedTo: {
            $map: {
              input: '$assignedTo',
              as: 'assignee',
              in: {
                $mergeObjects: [
                  '$$assignee',
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$assignedUsers',
                          as: 'user',
                          cond: { $eq: ['$$user._id', '$$assignee.id'] },
                        },
                      },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          __v: 0,
          'tasks.__v': 0,
          assignedUsers: 0,
        },
      },
    ]);

    if (projectResult.length === 0) {
      throw new Error('Project not found');
    }

    const today = new Date();
    const project = projectResult[0];
    const activeTasks = project.tasks.filter(
      (t) => ![PROJECT_STATUS.CANCELED, 'Archived'].includes(t.status)
    );

    const totalTasks = activeTasks.length;
    const completedTasks = activeTasks.filter(
      (t) => t.status === TASK_STATUS.COMPLETED
    ).length;
    const progress =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 10000) / 100
        : 0;

    const enhancedTasks = activeTasks.map((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      let dueInDays = null;
      let overdue = false;
      let statusLabel = task.status;

      if (dueDate) {
        const diffMs = dueDate - today;
        dueInDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        overdue = dueInDays < 0;
      }

      if (task.status === TASK_STATUS.COMPLETED) {
        statusLabel = 'Completed';
      } else if (overdue) {
        statusLabel = 'Delayed';
      } else {
        statusLabel = 'On Track';
      }

      return {
        ...task,
        dueInDays,
        overdue,
        statusLabel,
        totalTasks,
        completedTasks,
        progress,
      };
    });

    return {
      data: {
        ...project,
        tasks: enhancedTasks,
        totalTasks,
        completedTasks,
        progress,
      },
    };
  } catch (error) {
    console.error(error);
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

    console.log("Aggregate results:", aggregates);

    return { data: aggregates };

  } catch (error) {
    console.error(error);
    throw new Error(`Error fetching project aggregates: ${error.message}`);
  }
};


async function getProjectById(id) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    return Project.findOne({ _id: id })
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
    }).populate({
      path: 'assignedTo.id',
      select: 'first_name last_name fcm secure_url role id'
    });

    console.log('Updated Project:', JSON.stringify(updatedProject));

    return updatedProject;
  } catch (error) {
    logger.error(error);
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
                cond: { $eq: ['$$task.status', TASK_STATUS.COMPLETED] }
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
          projectId: { $toString: '$_id' },
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
      return { projects: [], tasks: [], days: emptyDays };
    }

    const projectIds = projects.map((project) => project._id);

    // Calculate date range for last 7 days (inclusive of today) using UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6); // 7 days = today + 6 previous days
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Get last 7 days of trends (rolling window)
    // Using UTC timezone in MongoDB to match our UTC date calculations in Node.js
    const tasksByDay = await Task.aggregate([
      {
        $match: {
          project: { $in: projectIds },
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
    const formattedTasks = Array(7).fill(0);

    // Fill in actual data from aggregation
    projectsByDay.forEach((item) => {
      const index = last7Days.findIndex(
        (d) => dateToUTCString(d) === item._id
      );
      if (index !== -1) {
        formattedProjects[index] = item.count;
      }
    });

    tasksByDay.forEach((item) => {
      const index = last7Days.findIndex(
        (d) => dateToUTCString(d) === item._id
      );
      if (index !== -1) {
        formattedTasks[index] = item.count;
      }
    });

    // Format day labels as "Mon 20" for display
    const dayLabels = last7Days.map(formatDateLabel);

    return { projects: formattedProjects, tasks: formattedTasks, days: dayLabels };
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
