
import { mongoConnect } from '@/utils/connectDb';
import Project from '../models/project';
import { isValidObjectId } from '../utils/helps';
const { logger } = require('../utils/logger');

mongoConnect()

async function getAll(suid, projectId) {

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const project = await Project.findOne({ integrator: suid, _id: projectId }, { assignedTo: 1, _id: 0 }).populate({
      path: 'assignedTo.id',
      select: 'first_name last_name fcm secure_url role'
    });

    if (!project) {
      throw new Error('AssignedTo not found for the given integrator ID');
    }

    return project.assignedTo;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function addOne(suid, body) {
  const { user_id, projectId } = body;
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const project = await Project.findOneAndUpdate(
      { integrator: suid, _id: projectId },
      { $push: { assignedTo: { id: user_id } } },
      { new: true }
    );

    const createdDocument = project?.assignedTo[project?.assignedTo?.length - 1];

    return createdDocument;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function removeOne(suid, projectId, id) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const project = await Project.findOneAndUpdate(
      { integrator: suid, _id: projectId },
      { $pull: { assignedTo: { _id: id } } },
      { new: true }
    );

    if (!project) {
      throw new Error('Project not found for the given integrator ID');
    }

    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export { getAll, removeOne, addOne };
