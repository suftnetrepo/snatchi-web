
import Task from '../models/task';
import User from '../models/user';
import { isValidObjectId } from '../utils/helps';
const { logger } = require('../utils/logger');

async function getAll(taskId, projectId) {
 
  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }
  
  try {
   
    const task = await Task.findOne({ project: projectId, _id: taskId }, { comments: 1, _id: 0 }).populate({
      path: 'comments.author',
      select: 'first_name last_name  secure_url'
    });
  
    if (!task) {
      throw new Error('comments not found for the given projectId');
    }
     
    return task.comments;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function addOne(body) {
  const { projectId, taskId, author, text } = body;

  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }
  
  if (!isValidObjectId(taskId)) {
    throw new Error(JSON.stringify([{ field: 'taskId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, project: projectId },
      { 
        $push: { comments: { author, text, createdAt: new Date() } },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    ).populate('comments.author', 'first_name last_name');

    if (!task) {
      throw new Error(JSON.stringify([{ field: 'taskId', message: 'Task not found or does not belong to the project' }]));
    }

    const createdComment = task.comments[task.comments.length - 1];    
    return createdComment;
  } catch (error) {
    logger.error(error);
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
      { $pull: { comments: { _id: id } } },
      { new: true }
    );

    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export { getAll, removeOne, addOne };
