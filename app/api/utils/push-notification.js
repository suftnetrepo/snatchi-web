const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const { logger } = require('../utils/logger');

class FCMNotificationService {
  constructor() {
    const serviceAccount = require('../data/snatchichat-firebase-adminsdk-1vpcs-d06f6114f0.json');
    this.auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    });

    this.baseURL = `https://fcm.googleapis.com/v1/projects/snatchichat/messages:send`;
  }

  async getAccessToken() {
    const token = await this.auth.getAccessToken();
    return token;
  }

  async sendNotification(fcmToken, title, body, data = {}) {
    try {
      const accessToken = await this.getAccessToken();
     
      const message = {
        message: {
          token: fcmToken,
          notification: {
            title,
            body
          },
          data: {
            ...data,
            screen: data.screen || '',
            screenParams: JSON.stringify(data.screenParams || {})
          },
          apns: {
            payload: {
              aps: {
                'content-available': 1,
                sound: 'default'
              }
            }
          },
          android: {
            priority: 'high'
          }
        }
      };

      const response = await axios.post(this.baseURL, message, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      logger.error({
        success: false,
        error: error.response?.data || error.message
      });
    }
  }

  async sendMulticastNotification(body) {
    for (let i = 0; i < body.length; i++) {
      const data = {
        userId: body[i]?.userId,
        role: body[i]?.role,
        first_name: body[i]?.first_name,
        last_name: body[i]?.last_name,
        secure_url: body[i]?.secure_url,
        projectId: body[i]?.projectId
      };

      await this.sendNotification(body[i]?.fcm, 'Hello!', 'Fetching your current location', data);
    }
  }
}

export { FCMNotificationService };
