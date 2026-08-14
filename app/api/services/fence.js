const mongoose = require('mongoose');
import { fenceValidator } from '../validator/user';
import Fence from '../models/fence';
import Scheduler from '../models/scheduler';
import { isValidObjectId, getTimeOnly } from '../utils/helps';
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

async function getByDatesUser(startDateString, endDateString, user, id) {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  try {
    const result = await Fence.find({
      user: user,
      project: id,
      date: {
        $gte: startDate,
        $lt: endDate
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

async function getByUserOnly(user, project, dateString) {
  try {

    // resetFenceCollection()

    if (!dateString) {
      throw new Error('Date is required');
    }

    const [year, month, day] = dateString.split('-').map(Number);
    if (
      !year || !month || !day ||
      isNaN(year) || isNaN(month) || isNaN(day)
    ) {
      throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD`);
    }

    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const result = await Fence.find({
      user: user,
      project: project,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ date: -1 });
    return result;

  } catch (error) {
    logger.error('Fence query error:', error);
    throw error;
  }
}

async function resetFenceCollection() {
  await Fence.deleteMany({});
  await Fence.syncIndexes();
  console.log('✅ Fence collection reset and indexes synced');
}

async function bulkInsert(location, actor) {
  try {

    // resetFenceCollection();

    // 1️⃣ Ensure location is always an array
    if (!Array.isArray(location)) {
      return { inserted: 0, skipped: 0, total: 0 };
    }

    const geofenceEntries = location.filter(
      entry => entry?.geofence?.extras && entry?.uuid &&
        mongoose.Types.ObjectId.isValid(entry.geofence.extras.scheduleId || entry.geofence.extras.id)
    );

    // 2️⃣ Early exit (CRITICAL)
    if (geofenceEntries.length === 0) {
      return { inserted: 0, skipped: 0, total: 0 };
    }

    if (!actor?.id || !mongoose.Types.ObjectId.isValid(actor.id)) {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
    }

    const scheduleIds = [...new Set(geofenceEntries.map(
      entry => String(entry.geofence.extras.scheduleId || entry.geofence.extras.id)
    ))];
    const schedules = await Scheduler.find({
      _id: { $in: scheduleIds.map(id => new mongoose.Types.ObjectId(id)) },
      engineer: new mongoose.Types.ObjectId(actor.id),
      status: { $in: ['InProgress', 'Completed'] }
    }).populate('project', 'name completeAddress location integrator');
    const scheduleById = new Map(schedules.map(schedule => [String(schedule._id), schedule]));

    const authorizedEntries = geofenceEntries.filter(entry => {
      const extras = entry.geofence.extras;
      const schedule = scheduleById.get(String(extras.scheduleId || extras.id));
      if (!schedule?.startedAt) return false;
      const timestamp = new Date(entry.timestamp);
      if (Number.isNaN(timestamp.getTime()) || timestamp < schedule.startedAt) return false;
      return !schedule.completedAt || timestamp <= schedule.completedAt;
    });

    if (authorizedEntries.length === 0) {
      return { inserted: 0, skipped: geofenceEntries.length, total: geofenceEntries.length };
    }

    // 3️⃣ Always an array now
    const incomingUuids = authorizedEntries.map(entry => entry.uuid);

    // 4️⃣ Only query if we have UUIDs
    const existingFences = await Fence.find({
      uuid: { $in: incomingUuids }
    }).select('uuid');

    const existingUuids = new Set(existingFences.map(f => f.uuid));

    // 5️⃣ Filter new entries
    const newEntries = authorizedEntries.filter(
      entry => !existingUuids.has(entry.uuid)
    );

    // 6️⃣ Prepare bulk insert
    const bulkData = newEntries.map(entry => {
      const { geofence, timestamp, uuid } = entry;
      const extras = geofence.extras;
      const schedule = scheduleById.get(String(extras.scheduleId || extras.id));
      const project = schedule.project;

      return {
        uuid,
        integrator: schedule.integrator,
        user: schedule.engineer,
        project: project._id,
        schedule: schedule._id,
        date: new Date(timestamp),
        siteName: project.name || extras.siteName || schedule.title,
        radius: Number(extras.radius) || 200,
        first_name: extras.firstName || 'Engineer',
        last_name: extras.lastName || 'User',
        time: getTimeOnly(timestamp),
        status: geofence.action === 'ENTER' ? 'Enter' : 'Exit',
        completeAddress: project.completeAddress || extras.completeAddress,
        latitude: String(extras.latitude),
        longitude: String(extras.longitude),
      };
    });

    let insertedDocs = [];
    if (bulkData.length > 0) {
      insertedDocs = await Fence.insertMany(bulkData, { ordered: false });
    }

    return {
      inserted: insertedDocs.length,
      skipped: geofenceEntries.length - insertedDocs.length,
      total: geofenceEntries.length,
    };
  } catch (error) {
    logger.error('Fence query error:', error);
    throw error;
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

export { getByDatesUser, bulkInsert, remove, add, getByUser, getBydate, getByUserOnly };
