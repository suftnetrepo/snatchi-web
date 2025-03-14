const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const serviceAccountKeyPath = require('../data/snatchichat-firebase-adminsdk-1vpcs-e127d7282f.json');
const { logger } = require('../utils/logger');

class FCMNotificationService {
  constructor() {
    this.auth = new GoogleAuth({
      credentials: serviceAccountKeyPath,
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
          priority: "high",
          silent: true,
          data: {
            title,
            body,
            ...data
          },
          apns: {
            payload: {
              aps: {
                'content-available': 1
              }
            }
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
        name: body[i]?.name,
        projectId: body[i]?.projectId
      };

      await this.sendNotification(body[i]?.fcm, 'Hello!', 'Fetching your current location', data);
    }
  }
}

export { FCMNotificationService };
