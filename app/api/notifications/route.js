import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { logger } from '@/app/api/utils/logger';
import notificationService from '@/app/api/services/notificationService';
import { mongoConnect } from '@/utils/connectDb';

await mongoConnect();

// GET /api/notifications?limit=20&offset=0&unread=false&archived=false
export async function GET(req) {
  try {
    const user = await getUserSession(req);

    if (!user || user.role !== 'engineer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Fetching notifications for user:', user);

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const archived = url.searchParams.get('archived') === 'true';

    const result = await notificationService.getNotifications(user.id, {
      limit: Math.min(limit, 100), // Max 100 per request
      offset,
      unreadOnly,
      archived
    });

    return NextResponse.json(
      {
        success: true,
        data: result
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('GET /api/notifications failed', error);
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - mark as read, archive, etc
export async function PUT(req) {
  try {
    const user = await getUserSession(req);

    if (!user || user.role !== 'engineer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, notificationId } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action is required' },
        { status: 400 }
      );
    }

    if (action === 'read' && !notificationId) {
      return NextResponse.json(
        { success: false, error: 'notificationId is required' },
        { status: 400 }
      );
    }

    let result;

    if (action === 'read') {
      result = await notificationService.markAsRead(notificationId, user.id);
    } else if (action === 'read-all') {
      result = await notificationService.markAllAsRead(user.id);
    } else if (action === 'archive') {
      result = await notificationService.archive(notificationId, user.id);
    } else {
      return NextResponse.json(
        { success: false, error: 'Unknown action' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result
      },
      { status: 200 }
    );
  } catch (error) {
    conole.error('PUT /api/notifications failed', error);
    logger.error('PUT /api/notifications failed', error);
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: error.message === 'Unauthorized' ? 403 : 500 }
    );
  }
}

// DELETE /api/notifications/[id]
export async function DELETE(req) {
  try {
    const user = await getUserSession(req);

    if (!user || user.role !== 'engineer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'notificationId is required' },
        { status: 400 }
      );
    }

    await notificationService.delete(notificationId, user.id);

    return NextResponse.json(
      {
        success: true
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('DELETE /api/notifications failed', error);
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: error.message === 'Unauthorized' ? 403 : 500 }
    );
  }
}
