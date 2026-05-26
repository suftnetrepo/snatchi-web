import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { logger } from '@/app/api/utils/logger';
import DeviceToken from '@/app/api/models/deviceToken';
import { mongoConnect } from '@/utils/connectDb';

await mongoConnect();

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

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'token is required' },
        { status: 400 }
      );
    }

    if (!device || !device.type) {
      return NextResponse.json(
        { success: false, error: 'device.type is required' },
        { status: 400 }
      );
    }

    if (!['web', 'mobile_ios', 'mobile_android'].includes(device.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid device.type' },
        { status: 400 }
      );
    }

    // Check if token already exists
    const existingToken = await DeviceToken.findOne({ token });

    if (existingToken) {
      // Token already registered - update it
      if (existingToken.user.toString() !== user.id.toString()) {
        // Token belongs to different user - reject
        logger.warn('Device token registered to different user', {
          existingUserId: existingToken.user,
          requestUserId: user.id,
          token: token.substring(0, 20) + '...'
        });

        return NextResponse.json(
          { success: false, error: 'Token already registered to another user' },
          { status: 409 }
        );
      }

      // Update existing token
      existingToken.device = device;
      existingToken.status.lastUsed = new Date();
      existingToken.updatedAt = new Date();

      // Reactivate if it was deactivated
      if (!existingToken.status.active) {
        await existingToken.reactivate();
      } else {
        await existingToken.save();
      }

      logger.info('Device token updated', {
        userId: user.id,
        deviceType: device.type,
        tokenId: existingToken._id
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            tokenId: existingToken._id,
            action: 'updated'
          }
        },
        { status: 200 }
      );
    }

    // Create new device token
    const newToken = new DeviceToken({
      user: user.id,
      token,
      device,
      status: {
        active: true,
        failCount: 0,
        lastUsed: new Date()
      },
      capabilities: {
        supportsPush: true,
        supportsBadge: device.type !== 'web', // Web doesn't support badges same way
        supportsSound: true,
        supportsActionButtons: device.type !== 'web'
      }
    });

    const savedToken = await newToken.save();

    logger.info('Device token registered', {
      userId: user.id,
      deviceType: device.type,
      tokenId: savedToken._id
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          tokenId: savedToken._id,
          action: 'created'
        }
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('PUT /api/user/device-token failed', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
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

    const tokens = await DeviceToken.find({ user: user.id })
      .select('device.type device.platform status.active createdAt updatedAt')
      .sort({ updatedAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: {
          tokens,
          count: tokens.length
        }
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('GET /api/user/device-token failed', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
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

    if (!tokenId) {
      return NextResponse.json(
        { success: false, error: 'tokenId is required' },
        { status: 400 }
      );
    }

    const token = await DeviceToken.findOne({
      _id: tokenId,
      user: user.id
    });

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token not found' },
        { status: 404 }
      );
    }

    await DeviceToken.deleteOne({ _id: tokenId });

    logger.info('Device token deleted', {
      userId: user.id,
      tokenId
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    logger.error('DELETE /api/user/device-token failed', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
