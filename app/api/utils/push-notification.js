const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const { logger } = require('../utils/logger');

class FCMNotificationService {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID;
    if (!this.projectId) {
      throw new Error('FIREBASE_PROJECT_ID is not set');
    }

    this.auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    this.baseURL = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;
  }

  async getAccessToken() {
    const client = await this.auth.getClient();
    const { token } = await client.getAccessToken();
    return token;
  }

  async sendNotification(fcmToken, title, body, data = {}) {
    try {
      const accessToken = await this.getAccessToken();

      const message = {
        message: {
          token: fcmToken,
          notification: { title, body },
          data: {
            ...data,
            screen: data.screen || '',
            screenParams: JSON.stringify(data.screenParams || {}),
          },
          android: { priority: 'high' },
          apns: {
            payload: {
              aps: {
                'content-available': 1,
                sound: 'default',
              },
            },
          },
        },
      };

      const response = await axios.post(this.baseURL, message, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      logger.info('FCM sent', { name: response.data.name });
      return { success: true };
    } catch (err) {
      logger.error('FCM failed', err.response?.data || err.message);
      return { success: false };
    }
  }
}

module.exports = { FCMNotificationService };
