import { documentValidator } from '../validator/user';
import User from '../models/user';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
import { logger } from '../utils/logger';

mongoConnect()

async function getDocuments(suid, userId) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(userId)) {
    throw new Error(JSON.stringify([{ field: 'userId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const user = await User.findOne({ integrator: suid, _id: userId }, { attachments: 1, _id : 0 });

    if (!user) {
      throw new Error('User not found for the given integrator ID');
    }

    return User.attachments;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function createDocument(suid, userId, body) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = documentValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const user = await User.findOneAndUpdate(
      { integrator: suid , _id: userId },
      { $push: { attachments: body } },
      { new: true }
    );

    const createdDocument = user.attachments[user.attachments.length - 1];
    return createdDocument;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function removeDocument(suid, userId, id) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(userId)) {
    throw new Error(JSON.stringify([{ field: 'userId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const user = await User.findOneAndUpdate(
      { integrator: suid, _id: userId },
      { $pull: { attachments: { _id: id } } },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found for the given integrator ID');
    }

    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export { getDocuments, removeDocument, createDocument };
