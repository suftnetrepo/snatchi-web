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
    const user = await User.findOne({ integrator: suid, _id: userId }, { attachments: 1, _id : 0 }).lean();

    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const result = user.attachments;
    
    return result
  } catch (error) {
    logger.error(error);
    if (error.statusCode) throw error;
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function createDocument(suid, userId, body) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }
  if (!isValidObjectId(userId)) {
    throw Object.assign(new Error('Invalid user ID'), { statusCode: 400 });
  }

  const bodyErrors = documentValidator(body);
  if (bodyErrors.length) {
    throw Object.assign(new Error(bodyErrors.map((it) => it.message).join(',')), { statusCode: 400 });
  }

  try {
    const user = await User.findOneAndUpdate(
      { integrator: suid , _id: userId },
      { $push: { attachments: body } },
      { new: true, runValidators: true }
    );

    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const createdDocument = user.attachments[user.attachments.length - 1];
    return createdDocument;
  } catch (error) {
    logger.error(error);
    if (error.statusCode) throw error;
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
    const existingUser = await User.findOne(
      { integrator: suid, _id: userId, 'attachments._id': id },
      { attachments: { $elemMatch: { _id: id } } }
    ).lean();
    if (!existingUser?.attachments?.length) {
      throw Object.assign(new Error('Document not found'), { statusCode: 404 });
    }
    const document = existingUser.attachments[0];
    const user = await User.findOneAndUpdate(
      { integrator: suid, _id: userId, 'attachments._id': id },
      { $pull: { attachments: { _id: id } } },
      { new: true }
    );

    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    return document;
  } catch (error) {
    logger.error(error);
    if (error.statusCode) throw error;
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function restoreDocument(suid, userId, document) {
  const restored = await User.findOneAndUpdate(
    { integrator: suid, _id: userId },
    { $push: { attachments: document } },
    { new: true, runValidators: true }
  );
  if (!restored) throw Object.assign(new Error('User not found while restoring document'), { statusCode: 404 });
  return true;
}

export { getDocuments, removeDocument, createDocument, restoreDocument };
