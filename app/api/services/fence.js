const mongoose = require('mongoose');
import { fenceValidator } from '../validator/user';
import Fence from '../models/fence';
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

async function getByUserOnly(user, project, dateString) {
  try {

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
 // await Fence.syncIndexes();
  console.log('✅ Fence collection reset and indexes synced');
}

async function bulkInsert(location) {
  try {

    // resetFenceCollection();

    // 1️⃣ Ensure location is always an array
    if (!Array.isArray(location)) {
      return { inserted: 0, skipped: 0, total: 0 };
    }

    const geofenceEntries = location.filter(
      entry => entry?.geofence?.extras && entry?.uuid
    );

    // 2️⃣ Early exit (CRITICAL)
    if (geofenceEntries.length === 0) {
      return { inserted: 0, skipped: 0, total: 0 };
    }

    // 3️⃣ Always an array now
    const incomingUuids = geofenceEntries.map(entry => entry.uuid);

    // 4️⃣ Only query if we have UUIDs
    const existingFences = await Fence.find({
      uuid: { $in: incomingUuids }
    }).select('uuid');

    const existingUuids = new Set(existingFences.map(f => f.uuid));

    // 5️⃣ Filter new entries
    const newEntries = geofenceEntries.filter(
      entry => !existingUuids.has(entry.uuid)
    );

    // 6️⃣ Prepare bulk insert
    const bulkData = newEntries.map(entry => {
      const { geofence, timestamp, uuid } = entry;
      const extras = geofence.extras;

      return {
        uuid,
        integrator: new mongoose.Types.ObjectId(extras.integrator),
        user: new mongoose.Types.ObjectId(extras.userId),
        project: new mongoose.Types.ObjectId(extras.projectId),
        date: new Date(timestamp),
        siteName: extras.siteName,
        radius: extras.radius,
        first_name: extras.firstName,
        last_name: extras.lastName,
        time: getTimeOnly(timestamp),
        status: geofence.action === 'ENTER' ? 'Enter' : 'Exit',
        completeAddress: extras.completeAddress,
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
      skipped: existingUuids.size,
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

export { bulkInsert, remove, add, getByUser, getBydate, getByUserOnly };
