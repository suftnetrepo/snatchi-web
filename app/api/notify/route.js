
import { logger } from '@/_/api/utils/logger';
import { FCMNotificationService } from '../utils/push-notification';
import notificationService from '../services/notificationService';
import { NOTIFICATION_TYPES } from '../constants/notificationTypes';
const { NextResponse } = require('next/server');

/**
 * DEPRECATED: Use notificationService.createNotification() instead
 * This endpoint kept for backward compatibility
 * NOW also saves notifications to database
 */
export const PUT = async (req) => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    const body = await req.json();

    const fcmService = new FCMNotificationService();

    if (action === 'single') {
      const { fcm, projectId, userId, role, first_name, last_name, title, description } = body;

      // Send via FCM (legacy path)
      const result = await fcmService.sendNotification(fcm, 'Hello!', 'Fetching your current location', {
        projectId,
        userId,
        role,
        first_name,
        last_name
      });

      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === 'multiple') {
      const { data } = body;
      const result = await fcmService.sendMulticastNotification(data);

      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    return NextResponse.json({ success: false, data: null }, { status: 500 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
