const mongoose = require('mongoose');
import DeviceToken from '../models/deviceToken';
import { mongoConnect } from '@/utils/connectDb';
const { logger } = require('../utils/logger');

mongoConnect();

// async function registerOrUpdateDeviceToken({ userId, token, device }) {
//   try {
//     if (!token) {
//       const error = new Error('token is required');
//       logger.error(error);
//       return;
//     }

//      // await DeviceToken.findOneAndUpdate({user :userId }, { token: token, device: device }, { new: true, upsert: true });

//          console.log('Existing token for user:', userId);
//     // Check if token already exists
//     const existingToken = await DeviceToken.findOne({ user :userId });

//     console.log('Existing token for user:', userId, 'is:', existingToken);

//     if (existingToken) {
//       // Token already registered - check ownership
//       logger.warn('Device token registered to different user', {
//         existingUserId: existingToken.user,
//         requestUserId: userId,
//         token: token.substring(0, 20) + '...'
//       });

//       // Update existing token
//       existingToken.token = token;
//       existingToken.device = device;
//       existingToken.status.lastUsed = new Date();
//       existingToken.updatedAt = new Date();
//       await existingToken.save();

//       logger.info('Device token updated', {
//         userId,
//         deviceType: device.type,
//         tokenId: existingToken._id
//       });

//       console.log('Device token updated for user:', userId, 'with token ID:', existingToken._id);

//       return {
//         tokenId: existingToken._id,
//         action: 'updated'
//       };
//     }

//     // Create new device token
//     const newToken = new DeviceToken({
//       user: userId,
//       token,
//       device,
//       status: {
//         active: true,
//         failCount: 0,
//         lastUsed: new Date()
//       },
//       capabilities: {
//         supportsPush: true,
//         supportsBadge: device.type !== 'web',
//         supportsSound: true,
//         supportsActionButtons: device.type !== 'web'
//       }
//     });

//     const savedToken = await newToken.save();

//     logger.info('Device token registered', {
//       userId,
//       deviceType: device.type,
//       tokenId: savedToken._id
//     });

//     console.log('Device token registered for user:', userId, 'with token ID:', savedToken._id);

//     return {
//       tokenId: savedToken._id,
//       action: 'created'
//     };
//   } catch (error) {
//     console.error('Error in registerOrUpdateDeviceToken:', error);
//     logger.error(error);
//   }
// }

async function registerOrUpdateDeviceToken({ userId, token, device }) {
 
  // 2️⃣ Sanitize and prepare data
  const sanitizedData = sanitizeDeviceData({ userId, token, device });

  // 3️⃣ Begin database operation
  try {
    // Check if token already exists for this user
    const existingToken = await findExistingToken(sanitizedData.userId);

    if (existingToken) {
      return await updateExistingToken(existingToken, sanitizedData);
    } else {
      return await createNewToken(sanitizedData);
    }
  } catch (error) {
    logger.error(error, {
      userId,
      tokenId: error?.tokenId,
      context: 'registerOrUpdateDeviceToken'
    });
    console.error('❌ Database operation failed:', error);
  }
}

function sanitizeDeviceData({ userId, token, device }) {
 
  return {
    userId: String(userId),
    token: token.trim(),
    device: {
      type: device.type,
      model: device.model || 'unknown',
      osVersion: device.osVersion || 'unknown',
      appVersion: device.appVersion || 'unknown',
      ...(device.pushToken && { pushToken: device.pushToken })
    }
  };
}

async function findExistingToken(userId) {
  try {
    const existingToken = await DeviceToken.findOne({ user: userId });
    
    if (existingToken) {
      console.log(`🔍 Found existing token for user ${userId}:`, existingToken._id);
    } else {
      console.log(`ℹ️ No existing token found for user ${userId}`);
    }
    
    return existingToken;
  } catch (error) {
    console.error('❌ Error finding existing token:', error);
    throw error;
  }
}

async function updateExistingToken(existingToken, newData) {
  const startTime = Date.now();
  
  try {
    
    // Prepare update data
    const updateData = {
      token: newData.token,
      device: newData.device,
      'status.lastUsed': new Date(),
      updatedAt: new Date(),
      // Reset fail count if token was previously inactive
      'status.failCount': existingToken.status?.failCount > 0 ? 0 : existingToken.status?.failCount,
      'status.active': true
    };
    
    // Perform update
    const updatedToken = await DeviceToken.findByIdAndUpdate(
      existingToken._id,
      updateData,
      { 
        new: true, 
        runValidators: true,
        lean: true
      }
    );
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Token updated for user ${newData.userId} (${duration}ms)`);
    
    return {
      tokenId: updatedToken._id,
      action: 'updated',
      userId: newData.userId,
      deviceType: newData.device.type
    };
    
  } catch (error) {
    console.error('❌ Error updating token:', error);
    logger.error(error);
  }
}

async function getUserDeviceTokens(userId) {
  try {
    const tokens = await DeviceToken.find({ user: userId })
      .select('device.type device.platform status.active createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .exec();

    return {
      tokens,
      count: tokens.length
    };
  } catch (error) {
    logger.error(error);
  }
}

async function deleteDeviceToken(tokenId, userId) {
  try {
    if (!tokenId) {
      const error = new Error('tokenId is required');
      logger.error(error);
      return;
    }

    const token = await DeviceToken.findOne({
      _id: tokenId,
      user: userId
    });

    if (!token) {
      const error = new Error('Token not found');
      logger.error(error);
      return;
    }

    await DeviceToken.deleteOne({ _id: tokenId });

    logger.info('Device token deleted', {
      userId,
      tokenId
    });

    return { success: true };
  } catch (error) {
    logger.error(error);
  }
}

export { registerOrUpdateDeviceToken, getUserDeviceTokens, deleteDeviceToken };
