import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { logger } from '@/app/api/utils/logger';
import notificationService from '@/app/api/services/notificationService';
import { mongoConnect } from '@/utils/connectDb';

await mongoConnect();

// GET /api/notifications/unread-count
export async function GET(req) {
  try {
    const user = await getUserSession(req);

    // if (!user || user.role !== 'engineer') {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const count = await notificationService.getUnreadCount(user.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          count
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/notifications/unread-count failed', error);

    logger.error('GET /api/notifications/unread-count failed', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
