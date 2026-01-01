import { add, remove, getBydate, getByUser, getByUserOnly } from '../services/fence';
import { logger } from '../utils/logger';
const { NextResponse } = require('next/server');
import { getUserSession } from '@/utils/generateToken';

export const GET = async (request) => {
  try {
    // 1. Authentication
    const user = await getUserSession(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse URL parameters
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: action' },
        { status: 400 }
      );
    }

    // 3. Route handlers based on action
    const handlers = {
      async getByUserOnly() {
        const userId = url.searchParams.get('userId');
        const projectId = url.searchParams.get('projectId');
        const date = url.searchParams.get('date');

        if (!userId || !date) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required parameters for getByUserOnly: userId and date are required'
            },
            { status: 400 }
          );
        }

        const result = await getByUserOnly(userId, projectId, date);
        return NextResponse.json({ success: true, data: result }, { status: 200 });
      },

      async getBydate() {
        const date = url.searchParams.get('date');

        if (!date) {
          return NextResponse.json(
            { success: false, error: 'Missing required parameter: date' },
            { status: 400 }
          );
        }

        const result = await getBydate(date, user.integrator);
        return NextResponse.json({ success: true, data: result }, { status: 200 });
      },

      async getByUser() {
        const date = url.searchParams.get('date');
        const userId = url.searchParams.get('userId');

        if (!date || !userId) {
          return NextResponse.json(
            { success: false, error: 'Missing required parameters: date and userId' },
            { status: 400 }
          );
        }

        const result = await getByUser(date, userId);
        return NextResponse.json({ success: true, data: result }, { status: 200 });
      }
    };

    // 4. Execute the appropriate handler
    if (!handlers[action]) {
      return NextResponse.json(
        { success: false, error: `Invalid action: ${action}` },
        { status: 400 }
      );
    }

    return await handlers[action]();

  } catch (error) {
    // 5. Centralized error handling
    logger.error('GET handler error:', error);

    const statusCode = error.statusCode || 500;
    const message = statusCode === 500
      ? 'Internal server error'
      : error.message;

    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
};

export const DELETE = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    const deleted = await remove(user.integrator, id);

    return NextResponse.json({ success: true, data: deleted }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const POST = async (req) => {
  try {

    const body = await req.json();
    console.log('Fence body', body);
    const result = await add(body);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
