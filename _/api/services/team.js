import { teamValidator } from '../validator/user';
import Project from '../models/project';
import { isValidObjectId } from '../utils/helps';
const { logger } = require('../utils/logger');

async function getAll(suid, projectId) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const project = await Project.findOne({ integrator: suid, _id: projectId }, { assignedTo: 1, _id : 0 });
  
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
  const { projectId, image, name, user_id, role } = body
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = teamValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const project = await Project.findOneAndUpdate(
      { integrator: suid , _id: projectId },
      { $push: { assignedTo: { image, name, id: user_id, role: role } } },
      { new: true }
    );
  
    const createdDocument = project?.assignedTo[project?.assignedTo?.length - 1];
    
    return createdDocument;
  } catch (error) {
    logger.error(error);
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
