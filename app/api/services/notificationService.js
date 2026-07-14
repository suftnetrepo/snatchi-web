const { logger } = require('../utils/logger');
const Notification = require('../models/notification');
const DeviceToken = require('../models/deviceToken');
const { FCMNotificationService } = require('../utils/push-notification');
const { RECIPIENT_TYPES, CHANNEL_TYPES } = require('../constants/notificationTypes');

class NotificationService {
  constructor() {
    this.fcmService = new FCMNotificationService();
  }

  /**
   * Create and send a notification
   * IMPORTANT: Persist FIRST, send FCM AFTER
   *
   * @param {Object} data
   * @param {Object} data.recipient - { userId, type: 'user'|'integrator' } or { integratorId, type: 'integrator' }
   * @param {string} data.type - notification type constant
   * @param {string} data.title - notification title
   * @param {string} data.body - notification body
   * @param {string} data.screen - target screen
   * @param {Object} data.screenParams - screen navigation data
   * @param {Object} data.relatedTo - { schedule, payment, project, integrator }
   * @param {string} data.priority - high|normal|low
   *
   * @returns {Object} created notification with _id
   */
  async createNotification(data) {
    try {
      const {
        recipient,
        type,
        title,
        body,
        screen,
        screenParams = {},
        relatedTo = {},
        priority = 'normal'
      } = data;

      if (!recipient || !recipient.type) {
        throw new Error('Recipient and recipient.type required');
      }

      if (!type || !title || !body || !screen) {
        throw new Error('type, title, body, and screen are required');
      }

      // Create notification document
      const notification = new Notification({
        recipient,
        type,
        title,
        body,
        screen,
        screenParams,
        relatedTo,
        priority,
        channels: [
          {
            type: CHANNEL_TYPES.PUSH,
            sent: false
          },
          {
            type: CHANNEL_TYPES.IN_APP,
            sent: true // in-app is ready immediately
          }
        ]
      });

      // Persist to database FIRST
      const savedNotification = await notification.save();
   
      // After DB save: Send FCM push
      await this._sendPushNotification(savedNotification);

      return savedNotification;
    } catch (error) {
      console.error('Failed to create notification', error);
      throw error;
    }
  }

  /**
   * Send push notification to all user's active devices
   * Updates notification delivery status in DB
   *
   * @private
   */
  async _sendPushNotification(notification) {
    try {
      // Determine which user(s) to send to
      let targetUserIds = [];

      if (notification.recipient.type === RECIPIENT_TYPES.USER) {
        targetUserIds = [notification.recipient.userId];
      } else if (notification.recipient.type === RECIPIENT_TYPES.INTEGRATOR) {
        // For integrator notifications, send to all staff of that integrator
        const User = require('../models/user');
        const staffUsers = await User.find({
          integrator: notification.recipient.integratorId,
          role: { $in: ['admin', 'integrator', 'manager'] }
        }).select('_id');
        targetUserIds = staffUsers.map((u) => u._id);
      }

      if (targetUserIds.length === 0) {
        logger.warn('No target users for notification', { notificationId: notification._id });
        return;
      }

      // Get all active device tokens for target users
      const deviceTokens = await DeviceToken.find({
        user: { $in: targetUserIds },
        'status.active': true
      });

      if (deviceTokens.length === 0) {
        logger.warn('No active device tokens for users', {
          notificationId: notification._id,
          userCount: targetUserIds.length
        });
        return;
      }

      // Send to all devices
      const sendResults = await Promise.allSettled(
        deviceTokens.map((token) =>
          this._sendToDevice(token, notification)
        )
      );

      // Process results
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < sendResults.length; i++) {
        if (sendResults[i].status === 'fulfilled') {
          successCount++;
        } else {
          failureCount++;
          logger.error('Failed to send to device', {
            reason: sendResults[i].reason,
            tokenId: deviceTokens[i]._id
          });
        }
      }

      // Update notification delivery status
      const pushChannel = notification.channels.find((c) => c.type === CHANNEL_TYPES.PUSH);
      if (pushChannel) {
        pushChannel.sent = successCount > 0;
        if (successCount > 0) {
          notification.status.delivered = true;
          notification.deliveredAt = new Date();
        }
      }

      await notification.save();

      logger.info('Push notification sent', {
        notificationId: notification._id,
        successCount,
        failureCount,
        totalDevices: deviceTokens.length
      });
    } catch (error) {
      logger.error('Error sending push notification', error);
      // Don't throw - notification already persisted in DB
    }
  }

  /**
   * Send notification to a single device
   * @private
   */
  async _sendToDevice(deviceToken, notification) {
    try {
      // Mark token as used
      await deviceToken.markUsed();

      // Send via FCM
      const result = await this.fcmService.sendNotification(
        deviceToken.token,
        notification.title,
        notification.body,
        {
          screen: notification.screen,
          screenParams: JSON.stringify(notification.screenParams),
          notificationId: notification._id.toString(),
          type: notification.type,
          priority: notification.priority
        }
      );

      if (!result.success) {
        // Record failure and potentially deactivate
        await deviceToken.recordFailure();
        throw new Error('FCM send failed');
      }

      return { success: true, tokenId: deviceToken._id };
    } catch (error) {
      logger.error('Send to device failed', {
        tokenId: deviceToken._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   *
   * @param {Array} userIds - array of user IDs
   * @param {Object} notificationData - notification data
   *
   * @returns {Array} created notifications
   */
  async sendToUsers(userIds, notificationData) {
    try {
      const notifications = await Promise.all(
        userIds.map((userId) =>
          this.createNotification({
            ...notificationData,
            recipient: {
              userId,
              type: RECIPIENT_TYPES.USER
            }
          })
        )
      );

      return notifications;
    } catch (error) {
      logger.error('Failed to send to users', error);
      throw error;
    }
  }

  /**
   * Send notification to all staff of an integrator
   *
   * @param {string} integratorId - integrator ID
   * @param {Object} notificationData - notification data
   *
   * @returns {Object} created notification
   */
  async sendToIntegrator(integratorId, notificationData) {
    try {
      return await this.createNotification({
        ...notificationData,
        recipient: {
          integratorId,
          type: RECIPIENT_TYPES.INTEGRATOR
        }
      });
    } catch (error) {
      logger.error('Failed to send to integrator', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with pagination
   *
   * @param {string} userId - user ID
   * @param {Object} options - { limit, offset, unreadOnly, archived }
   *
   * @returns {Object} { notifications, total, unread }
   */
  async getNotifications(userId, options = {}) {
    try {
      const { limit = 20, offset = 0, unreadOnly = false, archived = false } = options;

      let query = Notification.find().forUser(userId);

      if (unreadOnly) {
        query = query.unread();
      }

      if (!archived) {
        query = query.where('status.archived', false);
      }

      // Get total and unread counts
      const [notifications, total, unread] = await Promise.all([
        query
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .lean(),
        Notification.find().forUser(userId).countDocuments(),
        Notification.find().forUser(userId).unread().countDocuments()
      ]);

      console.log('Fetched notifications', {
        userId,
        limit,
        offset,
        unreadOnly,
        archived,
        total,
        unread,
        fetched: notifications.length
      });

      return {
        notifications,
        total,
        unread,
        limit,
        offset
      };
    } catch (error) {
        logger.error('Failed to get notifications', error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   *
   * @param {string} userId - user ID
   *
   * @returns {number} unread count
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        'recipient.userId': userId,
        'recipient.type': RECIPIENT_TYPES.USER,
        'status.read': false,
        'status.archived': false
      });
      return count;
    } catch (error) {
      logger.error('Failed to get unread count', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   *
   * @param {string} notificationId - notification ID
   * @param {string} userId - user ID (for permission check)
   *
   * @returns {Object} updated notification
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);

      notification.status.read = true;
      notification.readAt = new Date();

      const updated = await notification.save();

      logger.info('Notification marked as read', {
        notificationId,
        userId
      });

      return updated;
    } catch (error) {
      logger.error('Failed to mark as read', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   *
   * @param {string} userId - user ID
   *
   * @returns {Object} { modifiedCount }
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        {
          'recipient.userId': userId,
          'recipient.type': RECIPIENT_TYPES.USER,
          'status.read': false
        },
        {
          $set: {
            'status.read': true,
            readAt: new Date()
          }
        }
      );

      logger.info('Marked all as read', {
        userId,
        count: result.modifiedCount
      });

      return result;
    } catch (error) {
      logger.error('Failed to mark all as read', error);
      throw error;
    }
  }

  /**
   * Archive a notification
   *
   * @param {string} notificationId - notification ID
   * @param {string} userId - user ID (for permission check)
   *
   * @returns {Object} updated notification
   */
  async archive(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);

      notification.status.archived = true;
      notification.archivedAt = new Date();

      const updated = await notification.save();

      return updated;
    } catch (error) {
      logger.error('Failed to archive notification', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   *
   * @param {string} notificationId - notification ID
   * @param {string} userId - user ID (for permission check)
   *
   * @returns {boolean} success
   */
  async delete(notificationId, userId) {
    try {
     
      await Notification.deleteOne({ _id: notificationId });

      logger.info('Notification deleted', {
        notificationId,
        userId
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete notification', error);
      throw error;
    }
  }

   async deleteByScheduleId(scheduleId) {
    try {
      const result = await Notification.deleteMany({ 'relatedTo.schedule': scheduleId });

      logger.info('Deleted notifications by schedule', {
        scheduleId,
        count: result.deletedCount
      });

      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Failed to delete notification', error);
      throw error;
    }
  }

  /**
   * Clean up inactive device tokens
   * Runs as maintenance task
   */
  async cleanupInactiveTokens() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await DeviceToken.updateMany(
        {
          'status.active': true,
          'status.lastUsed': { $lt: thirtyDaysAgo }
        },
        {
          $set: {
            'status.active': false,
            'status.deactivatedAt': new Date(),
            'status.deactivatedReason': 'expired'
          }
        }
      );

      logger.info('Cleaned up inactive tokens', {
        count: result.modifiedCount
      });

      return result;
    } catch (error) {
      logger.error('Failed to cleanup inactive tokens', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications (TTL handled by MongoDB)
   * This is a backup cleanup if TTL is not working
   */
  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      logger.info('Cleaned up expired notifications', {
        count: result.deletedCount
      });

      return result;
    } catch (error) {
      logger.error('Failed to cleanup expired notifications', error);
      throw error;
    }
  }


async cleanAll() {
  try {
    const result = await Notification.deleteMany({});
    logger.info('Deleted all notifications', {
      count: result.deletedCount
    });
    return result;
  } catch (error) {
    logger.error('Failed to delete all notifications', error);
    throw error;
  }
}
}


module.exports = new NotificationService();
