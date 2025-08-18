import { schedulerValidator } from '../validator/user';
import Scheduler from '../models/scheduler';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
import { logger } from '../utils/logger';

mongoConnect();

async function get({ suid }) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  const filter = new Date();
  filter.setDate(-30);

  try {
    const result = await Scheduler.find({
      integrator: suid,
      startDate: {
        $gte: filter
      }
    }).populate('user', 'first_name last_name email');

    return {
      data: result
    };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getByUser(user_id) {
  if (!isValidObjectId(user_id)) {
    throw new Error(JSON.stringify([{ field: 'user_id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const filter = new Date();
  filter.setDate(-30);

  try {
    const result = await Scheduler.find({
      user: user_id
    }).populate('user', 'first_name last_name email');

    return {
      data: result
    };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getUsersByDates(suid, startDate, endDate) {
  if (!isValidObjectId(userId)) {
    throw new Error(JSON.stringify([{ field: 'userId', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const result = await Scheduler.find({
      integrator: suid,
      startDate: {
        $gte: new Date(startDate)
      },
      endDate: {
        $lte: new Date(endDate)
      }
    })
      .populate('user', 'first_name last_name email')
      .sort({ date: -1 });

    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function add(body) {
  const bodyErrors = schedulerValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  if (!isValidObjectId(body.user)) {
    throw new Error(JSON.stringify([{ field: 'user', message: 'Invalid user MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(body.integrator)) {
    throw new Error(JSON.stringify([{ field: 'integrator', message: 'Invalid integrator MongoDB ObjectId' }]));
  }

  const { startDate, endDate, ...rest } = body;
  const schedulerData = {
    ...rest,
    startDate: new Date(startDate),
    endDate: new Date(endDate)
  };

  try {
    const scheduler = await Scheduler.create(schedulerData);
    await scheduler.populate('user', 'first_name last_name email');
    return scheduler;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function update(suid, id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'suid', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = schedulerValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const result = await Scheduler.findOneAndUpdate(
      { _id: id, integrator: suid },
      {
        ...body,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('user', 'first_name last_name email');

    return result;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function updateByStatus(id, user_id, body) {
  if (!isValidObjectId(user_id)) {
    throw new Error(JSON.stringify([{ field: 'user_id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    const result = await UserStatus.findOneAndUpdate(
      {
        user: user_id,
        _id: id,
        ...body
      },

      { new: true, runValidators: true }
    ).populate('user', 'first_name last_name email');
    return result;
  } catch (error) {
    logger.error(error);
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
    await Scheduler.findOneAndDelete({ _id: id, integrator: suid });

    return true;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export { remove, add, get, getByUser, update, updateByStatus, getUsersByDates };
