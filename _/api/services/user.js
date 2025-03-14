const mongoose = require('mongoose');
import { userValidator } from '../validator/user';
import User from '../models/user';
import { isValidObjectId } from '../utils/helps';
const { generatePassword } = require('../utils/helps');
const { logger } = require('../utils/logger');

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
      User.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
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
      const results = await User.f({ _id: id })
        .exec();
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
      password: await generatePassword('#12345!'),
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

  const bodyErrors = userValidator(body);
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

    return updatedUser;
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
    password: await generatePassword(body?.password),
  };

  try {
    await User.findByIdAndUpdate(id, newPassword);
    return true;
  } catch (error) {
    console.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
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
      $or: [
        { first_name: regex },
        { last_name: regex },
        { email: regex },
      ],
    }).limit(10)
  
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
          _id: "$role", 
          count: { $sum: 1 } 
        }
      },
      {
        $project: {
          role: "$_id", 
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

export { searchUsers, aggregateUserDataByRole, getUsers, removeUser, updateUser, getUserById, changePassword, createUser };
