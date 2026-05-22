import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { updateByStatus } from '../../../services/scheduler';
import { logger } from '../../../utils/logger';

export async function PUT(req, { params }) {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = await updateByStatus(params.id, user, body);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}