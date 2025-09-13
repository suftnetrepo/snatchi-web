import { FCMNotificationService } from '../utils/push-notification';
import User from '../models/user'; // adjust path as needed
const { logger } = require('../utils/logger');

/**
 * Send a push notification to a user with navigation data.
 * @param {Object} params
 * @param {string} params.userId - The user's MongoDB ID.
 * @param {string} params.title - Notification title.
 * @param {string} params.body - Notification body.
 * @param {string} params.screen - The screen to open in the app.
 * @param {Object} params.screenParams - Params to pass to the screen.
 */
export async function sendUserNotification({ userId, title, body, screen, screenParams = {} }) {
    try {
        const user = await User.findById(userId);
        if (user && user.fcm) {
            const notificationService = new FCMNotificationService();
            const result = await notificationService.sendNotification(
                user.fcm,
                title,
                body,
                {
                    screen,
                    screenParams
                }
            );

            if (result) {
                const { response, success } = result;
                console.log('Notification sent:', { response, success });
            } else {
                console.warn('Notification service returned undefined.');
            }
        } else {
            console.warn({
                success: false,
                message: !user
                    ? `User not found for userId: ${userId}`
                    : `FCM token missing for userId: ${userId}`
            });
        }
    } catch (error) {
        console.error({
            success: false,
            error: error.response?.data || error.message
        });
    }
}