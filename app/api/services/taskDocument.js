import { documentValidator } from '../validator/user';
import Task from '../models/task';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
const { logger } = require('../utils/logger');

mongoConnect()

async function getDocuments(projectId, taskId) {
  if (!isValidObjectId(taskId)) {
    throw new Error(JSON.stringify([{ field: 'taskId', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const task = await Task.findOne({ _id: taskId, project: projectId }, { attachments: 1, _id : 0 });

    if (!task) {
      throw new Error('Task not found for the given project ID');
    }

    return task.attachments;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function createDocument(taskId, projectId, body) {
  if (!isValidObjectId(taskId)) {
    throw new Error(JSON.stringify([{ field: 'taskId', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = documentValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, project: projectId },
      { $push: { attachments: body } },
      { new: true }
    );

    const createdDocument = task.attachments[task.attachments.length - 1];
    
    return createdDocument;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function removeDocument(projectId, taskId, id) {
  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(taskId)) {
    throw new Error(JSON.stringify([{ field: 'taskId', message: 'Invalid MongoDB ObjectId' }]));
  }
 
  try {
    const task = await Task.findOneAndUpdate(
      { project: projectId, _id: taskId },
      { $pull: { attachments: { _id: id } } },
      { new: true }
    );

    if (!task) {
      throw new Error('Task not found for the given project ID');
    }

    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export { getDocuments, removeDocument, createDocument };
