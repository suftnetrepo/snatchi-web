const mongoose = require('mongoose');
import { userValidator, userEditValidator } from '../validator/user';
import User from '../models/user';
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

async function getUsers({ suid, page = 1, limit = 10, sortField, sortOrder, searchQuery }) {
  if (!isValidObjectId(suid)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const skip = (page - 1) * limit;

  try {
    const sortOptions = {};
    if (sortField) {
      sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
    }

    const searchFilter = searchQuery
      ? {
          $or: [
            { first_name: { $regex: searchQuery, $options: 'i' } },
            { last_name: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } },
            { role: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      : {};

    const query = {
      integrator: suid,
      ...searchFilter
    };

    const [users, totalCount] = await Promise.all([
      User.find(query).sort(sortOptions).skip(skip).select('-password').limit(limit).exec(),
      User.countDocuments({ integrator: suid })
    ]);

    return {
      data: users,
      totalCount
    };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getUserById(id) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  try {
    try {
      const results = await User.findOne({ _id: id }).exec();
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
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const newUser = await User.create({
      integrator: id,
      password: await generatePassword('12345!'),
      ...body
    });

    if (!newUser) {
      throw new Error('create new user failed');
    }

    return newUser;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function updateUser(id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = userEditValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(id, body, {
      new: true
    });

    if (!updatedUser) {
      throw new Error('User not found or update failed');
    }

    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function changePassword(id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
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
  console.log('updateEngineerAddress called with userId:', userId, 'address:', address, 'actor:', actor);

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

  console.log('Address update set:', updateSet);

  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
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
    await User.findOneAndDelete({ _id: id, integrator: suid });
    return true;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function searchUsers(searchTerm) {
  try {
    const regex = new RegExp(searchTerm, 'i');
    return User.find({
      $or: [{ first_name: regex }, { last_name: regex }, { email: regex }]
    }).limit(10);
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
async function searchUsersByMultipleCriteria({ suid, page = 1, limit = 10, sortField, sortOrder, searchQuery }) {
  if (!searchQuery || searchQuery.trim().length === 0) {
    throw new Error(JSON.stringify([{ field: 'searchQuery', message: 'Search term is required' }]));
  }

  const skip = (page - 1) * limit;

  try {
    const searchFilter = buildUserSearchFilter(searchQuery.trim());

    // Build base query with role filter for engineers only
    let query = {
      $and: [searchFilter, { role: 'engineer' }]
    };

    // Add integrator filter if provided
    if (suid) {
      query = {
        $and: [searchFilter, { role: 'engineer' }, { integrator: suid }]
      };
    }

    // Execute query with pagination
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('_id integrator first_name last_name address secure_url email role')
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      User.countDocuments(query)
    ]);

    return {
      data: users,
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
