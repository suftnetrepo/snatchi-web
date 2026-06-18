const mongoose = require('mongoose');
import DeviceToken from '../models/deviceToken';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
const { logger } = require('../utils/logger');

mongoConnect();

const VALID_DEVICE_TYPES = ['web', 'mobile_ios', 'mobile_android'];

async function registerOrUpdateDeviceToken({ userId, token, device }) {
  try {
    if (!userId) {
      const error = new Error('userId is required');
      error.statusCode = 400;
      throw error;
    }

    if (!token) {
      const error = new Error('token is required');
      error.statusCode = 400;
      throw error;
    }

    if (!device || !device.type) {
      const error = new Error('device.type is required');
      error.statusCode = 400;
      throw error;
    }

    if (!VALID_DEVICE_TYPES.includes(device.type)) {
      const error = new Error(`Invalid device.type. Must be one of: ${VALID_DEVICE_TYPES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // Check if token already exists
    const existingToken = await DeviceToken.findOne({ token });

    if (existingToken) {
      // Token already registered - check ownership
      if (existingToken.user.toString() !== userId.toString()) {
        logger.warn('Device token registered to different user', {
          existingUserId: existingToken.user,
          requestUserId: userId,
          token: token.substring(0, 20) + '...'
        });

        const error = new Error('Token already registered to another user');
        error.statusCode = 409;
        throw error;
      }

      // Update existing token
      existingToken.device = device;
      existingToken.status.lastUsed = new Date();
      existingToken.updatedAt = new Date();

      // Reactivate if it was deactivated
      if (!existingToken.status.active) {
        await existingToken.reactivate();
      } else {
        await existingToken.save();
      }

      logger.info('Device token updated', {
        userId,
        deviceType: device.type,
        tokenId: existingToken._id
      });

      return {
        tokenId: existingToken._id,
        action: 'updated'
      };
    }

    // Create new device token
    const newToken = new DeviceToken({
      user: userId,
      token,
      device,
      status: {
        active: true,
        failCount: 0,
        lastUsed: new Date()
      },
      capabilities: {
        supportsPush: true,
        supportsBadge: device.type !== 'web',
        supportsSound: true,
        supportsActionButtons: device.type !== 'web'
      }
    });

    const savedToken = await newToken.save();

    logger.info('Device token registered', {
      userId,
      deviceType: device.type,
      tokenId: savedToken._id
    });

    return {
      tokenId: savedToken._id,
      action: 'created'
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    logger.error(error);
    throw new Error('Failed to register or update device token');
  }
}

async function getUserDeviceTokens(userId) {
  try {
    if (!userId) {
      const error = new Error('userId is required');
      error.statusCode = 400;
      throw error;
    }

    const tokens = await DeviceToken.find({ user: userId })
      .select('device.type device.platform status.active createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .exec();

    return {
      tokens,
      count: tokens.length
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    logger.error(error);
    throw new Error('Failed to fetch device tokens');
  }
}

async function deleteDeviceToken(tokenId, userId) {
  try {
    if (!tokenId) {
      const error = new Error('tokenId is required');
      error.statusCode = 400;
      throw error;
    }

    if (!userId) {
      const error = new Error('userId is required');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidObjectId(tokenId)) {
      const error = new Error('Invalid tokenId');
      error.statusCode = 400;
      throw error;
    }

    const token = await DeviceToken.findOne({
      _id: tokenId,
      user: userId
    });

    if (!token) {
      const error = new Error('Token not found');
      error.statusCode = 404;
      throw error;
    }

    await DeviceToken.deleteOne({ _id: tokenId });

    logger.info('Device token deleted', {
      userId,
      tokenId
    });

    return { success: true };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    logger.error(error);
    throw new Error('Failed to delete device token');
  }
}

export {
  registerOrUpdateDeviceToken,
  getUserDeviceTokens,
  deleteDeviceToken
};
