import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { logger } from '@/app/api/utils/logger';
import {
  registerOrUpdateDeviceToken,
  getUserDeviceTokens,
  deleteDeviceToken
} from '@/app/api/services/deviceToken';

/**
 * PUT /api/user/device-token
 * Register or update a device token for the current user
 *
 * Body:
 * {
 *   token: "fcm_token_string",
 *   device: {
 *     type: "web" | "mobile_ios" | "mobile_android",
 *     platform: "Chrome" | "iOS" | "Android",
 *     appVersion: "1.0.0",
 *     osVersion: "10.0"
 *   }
 * }
 */
export async function PUT(req) {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { token, device } = body;

    const result = await registerOrUpdateDeviceToken({
      userId: user.id,
      token,
      device
    });

    const statusCode = result.action === 'created' ? 201 : 200;

    return NextResponse.json(
      {
        success: true,
        data: result
      },
      { status: statusCode }
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'An unexpected error occurred';
    logger.error('PUT /api/user/device-token failed', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/user/device-token
 * Get all device tokens for the current user
 */
export async function GET(req) {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await getUserDeviceTokens(user.id);

    return NextResponse.json(
      {
        success: true,
        data: result
      },
      { status: 200 }
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'An unexpected error occurred';
    logger.error('GET /api/user/device-token failed', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/user/device-token?tokenId=...
 * Remove a device token
 */
export async function DELETE(req) {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const tokenId = url.searchParams.get('tokenId');

    await deleteDeviceToken(tokenId, user.id);

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'An unexpected error occurred';
    logger.error('DELETE /api/user/device-token failed', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}
