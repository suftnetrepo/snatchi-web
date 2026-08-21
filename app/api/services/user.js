const mongoose = require('mongoose');
import { userValidator, userEditValidator } from '../validator/user';
import User from '../models/user';
import EngineerServiceRate from '../models/engineerServiceRate';
import Invoice from '../models/invoice';
import Project from '../models/project';
import Scheduler from '../models/scheduler';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
const { generatePassword } = require('../utils/helps');
const { logger } = require('../utils/logger');

mongoConnect();

const ALLOWED_ADDRESS_FIELDS = new Set([
  'addressLine1',
  'county',
  'town',
  'country',
  'country_code',
  'postcode',
  'completeAddress',
  'location'
]);

const buildAddressUpdateSet = (address) => {
  if (!address || typeof address !== 'object' || Array.isArray(address)) {
    throw Object.assign(new Error('address must be an object'), { statusCode: 400 });
  }

  const updateSet = {};

  Object.entries(address).forEach(([key, value]) => {
    if (!ALLOWED_ADDRESS_FIELDS.has(key)) {
      return;
    }

    if (key === 'location') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw Object.assign(new Error('address.location must be an object'), { statusCode: 400 });
      }

      if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
        throw Object.assign(new Error('address.location.coordinates must be an array of [lng, lat]'), {
          statusCode: 400
        });
      }

      if (!value.coordinates.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate))) {
        throw Object.assign(new Error('address.location.coordinates must contain only numbers'), {
          statusCode: 400
        });
      }

      if (value.type && value.type !== 'Point') {
        throw Object.assign(new Error('address.location.type must be Point'), { statusCode: 400 });
      }

      updateSet['address.location.type'] = 'Point';
      updateSet['address.location.coordinates'] = value.coordinates;
      return;
    }

    updateSet[`address.${key}`] = value;
  });

  if (!Object.keys(updateSet).length) {
    throw Object.assign(new Error('address must include at least one allowed field'), { statusCode: 400 });
  }

  return updateSet;
};

async function getUsers({ suid, page = 1, limit = 10, sortField, sortOrder, searchQuery, allOrganizations = false }) {
  if (!allOrganizations && !isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (safePage - 1) * safeLimit;

  try {
    const allowedSortFields = new Set(['first_name', 'last_name', 'mobile', 'email', 'role', 'visible', 'chat_status', 'user_status', 'createdAt']);
    const sortOptions = { createdAt: -1 };
    if (sortField && allowedSortFields.has(sortField)) {
      delete sortOptions.createdAt;
      sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
    }

    const escapedSearch = String(searchQuery || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchFilter = escapedSearch
      ? {
          $or: [
            { first_name: { $regex: escapedSearch, $options: 'i' } },
            { last_name: { $regex: escapedSearch, $options: 'i' } },
            { email: { $regex: escapedSearch, $options: 'i' } },
            { mobile: { $regex: escapedSearch, $options: 'i' } },
            { role: { $regex: escapedSearch, $options: 'i' } }
          ]
        }
      : {};

    const query = {
      ...(!allOrganizations && { integrator: suid }),
      ...searchFilter
    };

    const [users, totalCount] = await Promise.all([
      User.find(query).sort(sortOptions).skip(skip).select('-password').limit(safeLimit).lean().exec(),
      User.countDocuments(query)
    ]);

    return {
      data: users,
      totalCount
    };
  } catch (error) {
    logger.error(error);
    if (error.statusCode) throw error;
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getUserById(id, integratorId = null) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    try {
      const results = await User.findOne({ _id: id, ...(integratorId && { integrator: integratorId }) }).select('-password').lean().exec();
      return results;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function createUser(id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = userValidator(body);
  if (bodyErrors.length) {
    throw Object.assign(new Error(bodyErrors.map((it) => it.message).join(',')), { statusCode: 400 });
  }

  try {
    const allowedFields = ['first_name', 'last_name', 'email', 'mobile', 'role', 'visible', 'user_status', 'chat_status'];
    const safeBody = Object.fromEntries(allowedFields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));
    const newUser = await User.create({
      integrator: id,
      password: await generatePassword('12345!'),
      ...safeBody
    });

    if (!newUser) {
      throw new Error('create new user failed');
    }

    return newUser.toObject({ transform: (_document, result) => { delete result.password; return result; } });
  } catch (error) {
    logger.error(error);
    if (error.code === 11000) throw Object.assign(new Error('A user with this email already exists'), { statusCode: 409 });
    throw error;
  }
}

async function updateUser(suid, id, body) {
  if (!isValidObjectId(suid)) {
    throw Object.assign(new Error('Invalid integrator ID'), { statusCode: 400 });
  }
  if (!isValidObjectId(id)) {
    throw Object.assign(new Error('Invalid user ID'), { statusCode: 400 });
  }

  const bodyErrors = userEditValidator(body);
  if (bodyErrors.length) {
    throw Object.assign(new Error(bodyErrors.map((it) => it.message).join(',')), { statusCode: 400 });
  }

  try {
    const allowedFields = ['first_name', 'last_name', 'email', 'mobile', 'role', 'visible', 'user_status', 'chat_status', 'secure_url', 'public_id'];
    const safeBody = Object.fromEntries(allowedFields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));
    const updatedUser = await User.findOneAndUpdate(
      { _id: id, integrator: suid },
      { $set: safeBody },
      { new: true, runValidators: true }
    ).select('-password').lean();

    if (!updatedUser) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    return updatedUser;
  } catch (error) {
    logger.error(error);
    if (error.statusCode) throw error;
    if (error.code === 11000) throw Object.assign(new Error('A user with this email already exists'), { statusCode: 409 });
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function changePassword(id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  if (typeof body?.password !== 'string' || body.password.length < 8 || body.password.length > 72) {
    throw Object.assign(new Error('Password must be between 8 and 72 characters'), { statusCode: 400 });
  }

  const newPassword = {
    password: await generatePassword(body?.password)
  };

  try {
    await User.findByIdAndUpdate(id, newPassword);
    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function updateFcmToken(id, token) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    await User.findByIdAndUpdate(id, { fcm: token });
    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function updateEngineerAddress({ userId, address, actor }) {
  if (!userId) {
    throw Object.assign(new Error('userId is required'), { statusCode: 400 });
  }

  if (!isValidObjectId(userId)) {
    throw Object.assign(new Error('Invalid userId'), { statusCode: 400 });
  }

  if (typeof address === 'undefined') {
    throw Object.assign(new Error('address is required'), { statusCode: 400 });
  }

  // await assertAddressUpdateAccess({ actor, userId });

  const updateSet = buildAddressUpdateSet(address);

  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, integrator: actor.integrator },
      { $set: updateSet },
      {
        new: true,
        runValidators: true,
        projection: { address: 1 }
      }
    );

    if (!updatedUser) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    return updatedUser;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    logger.error(error);
    throw Object.assign(new Error('An unexpected error occurred. Please try again.'), {
      statusCode: 500
    });
  }
}

async function removeUser(suid, id) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    if (!isValidObjectId(id)) throw Object.assign(new Error('Invalid user ID'), { statusCode: 400 });
    const [scheduleCount, invoiceCount, projectCount] = await Promise.all([
      Scheduler.countDocuments({ engineer: id }),
      Invoice.countDocuments({ user: id }),
      Project.countDocuments({ 'assignedTo.id': id })
    ]);
    if (scheduleCount || invoiceCount || projectCount) {
      throw Object.assign(new Error('This user has project, booking, or invoice history. Deactivate the user instead of deleting them.'), { statusCode: 409 });
    }
    const deleted = await User.findOneAndDelete({ _id: id, integrator: suid }).select('-password').lean();
    if (!deleted) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return deleted;
  } catch (error) {
    logger.error(error);
    if (error.statusCode) throw error;
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function searchUsers(searchTerm, integratorId) {
  if (!isValidObjectId(integratorId)) throw Object.assign(new Error('Invalid integrator ID'), { statusCode: 400 });
  try {
    const escapedSearch = String(searchTerm || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escapedSearch) return [];
    const regex = new RegExp(escapedSearch, 'i');
    return User.find({
      integrator: integratorId,
      $or: [{ first_name: regex }, { last_name: regex }, { email: regex }]
    }).select('-password').limit(10).lean();
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

const aggregateUserDataByRole = async (integratorId) => {
  try {
    const data = await User.aggregate([
      { $match: { integrator: new mongoose.Types.ObjectId(integratorId) } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    return data;
  } catch (error) {
    logger.error(error);
    throw new Error('Error aggregating user data. Please try again.');
  }
};

/**
 * Build search filter for multiple criteria (name, contact info, address fields)
 * @param {string} searchTerm - The search term
 * @returns {Object} MongoDB query filter with $or operator
 */
function buildUserSearchFilter(searchTerm) {
  const regexPattern = { $regex: searchTerm, $options: 'i' };

  return {
    $or: [
      // Name fields
      { first_name: regexPattern },
      { last_name: regexPattern },
      // Contact fields
      { email: regexPattern },
      { mobile: regexPattern },
      // Address fields (nested)
      { 'address.addressLine1': regexPattern },
      { 'address.county': regexPattern },
      { 'address.town': regexPattern },
      { 'address.country': regexPattern },
      { 'address.postcode': regexPattern },
      { 'address.completeAddress': regexPattern }
    ]
  };
}

/**
 * Search users by multiple criteria including name, contact info, address, and integration name
 * @param {Object} options - Search options
 * @param {string} options.searchTerm - Search term (required)
 * @param {string} options.integratorId - Filter by integrator ID (optional)
 * @param {number} options.page - Page number for pagination (default: 1)
 * @param {number} options.limit - Results limit per page (default: 10)
 * @returns {Object} Search results with data and totalCount
 */
async function searchUsersByMultipleCriteria({ suid, scope = 'all', page = 1, limit = 10, sortField, sortOrder, searchQuery = '' }) {

  const skip = (page - 1) * limit;

  try {
    const trimmedSearch = searchQuery.trim();
    const searchFilter = trimmedSearch ? buildUserSearchFilter(trimmedSearch) : null;

    // Build base query with role filter for engineers only
    const conditions = [{ role: 'engineer' }];
    if (searchFilter) conditions.push(searchFilter);
    if (scope === 'mine' && suid) conditions.push({ integrator: suid });
    if (scope === 'external' && suid) conditions.push({ integrator: { $ne: suid } });
    const query = conditions.length === 1 ? conditions[0] : { $and: conditions };

    const allowedSortFields = new Set(['first_name', 'last_name', 'createdAt']);
    const sort = sortField && allowedSortFields.has(sortField)
      ? { [sortField]: sortOrder === 'desc' ? -1 : 1 }
      : { first_name: 1, last_name: 1 };

    // Execute query with pagination
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('_id integrator first_name last_name address secure_url email role')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      User.countDocuments(query)
    ]);

    const rates = await EngineerServiceRate.find({
      engineer: { $in: users.map((engineer) => engineer._id) },
      active: true
    }).select('engineer serviceName rate rateType').sort({ rate: 1 }).lean();
    const ratesByEngineer = rates.reduce((result, rate) => {
      const key = rate.engineer.toString();
      if (!result[key]) result[key] = [];
      result[key].push(rate);
      return result;
    }, {});

    return {
      data: users.map((engineer) => ({
        ...engineer,
        isInternal: !!suid && engineer.integrator?.toString() === suid.toString(),
        serviceRates: ratesByEngineer[engineer._id.toString()] || []
      })),
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred during user search. Please try again.');
  }
}

export {
  searchUsers,
  aggregateUserDataByRole,
  getUsers,
  removeUser,
  updateUser,
  getUserById,
  changePassword,
  createUser,
  updateFcmToken,
  searchUsersByMultipleCriteria,
  updateEngineerAddress
};
