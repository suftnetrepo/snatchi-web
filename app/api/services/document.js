import { documentValidator } from '../validator/user';
import Project from '../models/project';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
const { logger } = require('../utils/logger');

mongoConnect()

async function getDocuments(suid, projectId) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(projectId)) {
    throw new Error(JSON.stringify([{ field: 'projectId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const project = await Project.findOne({ integrator: suid, _id: projectId }, { attachments: 1, _id : 0 });

    if (!project) {
      throw new Error('Project not found for the given integrator ID');
    }

    return project.attachments;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function createDocument(suid, projectId, body) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = documentValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const project = await Project.findOneAndUpdate(
      { integrator: suid , _id: projectId },
      { $push: { attachments: body } },
      { new: true }
    );

    const createdDocument = project.attachments[project.attachments.length - 1];
    
    return createdDocument;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function removeDocument(suid, projectId, id) {
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
      { $pull: { attachments: { _id: id } } },
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

export { getDocuments, removeDocument, createDocument };
