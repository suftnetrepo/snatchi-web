import { fenceValidator } from '../validator/user';
import Fence from '../models/fence';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
import { logger } from '../utils/logger';

mongoConnect();

async function getBydate(dateString, suid) {
  const date = new Date(dateString);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  try {
    const result = await Fence.find({
      integrator: suid,
      date: {
        $gte: date,
        $lt: nextDay
      }
    });

    if (!result) {
      throw new Error('create new fence failed');
    }

    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getByUser(dateString, user) {
  const date = new Date(dateString);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  try {
    const result = await Fence.find({
      user: user,
      date: {
        $gte: date,
        $lt: nextDay
      }
    });

    if (!result) {
      throw new Error('create new fence failed');
    }

    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getByUserOnly(user, project) {
  try {
    const result = await Fence.find({
      user: user,
      project: project
    }).sort({ date: -1 });

    console.log('Fence result', result);

    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function add(body) {
  const bodyErrors = fenceValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const result = await Fence.create({
      ...body
    });

    if (!result) {
      throw new Error('create new fence failed');
    }

    return result;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function remove(suid, id) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    await Fence.findOneAndDelete({ _id: id, integrator: suid });
    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export { remove, add, getByUser, getBydate, getByUserOnly };
