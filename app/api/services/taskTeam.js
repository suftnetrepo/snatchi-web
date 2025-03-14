import { teamValidator } from '../validator/user';
import Task from '../models/task';
import { isValidObjectId } from '../utils/helps';
const { logger } = require('../utils/logger');

async function getAll(taskId, projectId) {
 
  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }
  
  try {
   
    const task = await Task.findOne({ project: projectId, _id: taskId }, { assignedTo: 1, _id: 0 }).populate({
      path: 'assignedTo.id',
      select: 'first_name last_name fcm secure_url role'
    });
  
    if (!task) {
      throw new Error('AssignedTo not found for the given projectId');
    }
     
    return task.assignedTo;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function addOne(body) {
  const { projectId, user_id, taskId } = body
 
  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, project : projectId },
      { $push: { assignedTo: { id: user_id } } },
      { new: true }
    );
  
    const createdDocument = task?.assignedTo[task?.assignedTo?.length - 1];    
    return createdDocument;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function removeOne(projectId, taskId, id) { 
  if (!isValidObjectId(taskId)) {
    throw new Error(JSON.stringify([{ field: 'taskId', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const task = await Task.findOneAndUpdate(
      { project: projectId, _id: taskId },
      { $pull: { assignedTo: { _id: id } } },
      { new: true }
    );

    if (!task) {
      throw new Error('Task not found for the given taskId ID');
    }

    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export { getAll, removeOne, addOne };
