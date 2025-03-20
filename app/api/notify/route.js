
import { logger } from '../utils/logger';
import { FCMNotificationService } from '../utils/push-notification';
const { NextResponse } = require('next/server');

export const PUT = async (req) => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    const body = await req.json();

    const notificationService = new FCMNotificationService();

    if (action === 'single') {
      const { fcm, projectId, userId, role, name } = body;

      const result = await notificationService.sendNotification(fcm, 'Hello!', 'Fetching your current location', {
        projectId,
        userId,
        role,
        name
      });

      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === 'multiple') {
      const { data } = body;
      const result = await notificationService.sendMulticastNotification(data);

      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    return NextResponse.json({ success: false, data: null }, { status: 500 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
