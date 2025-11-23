import {
    updateFcmToken
} from '../../services/user';
import { logger } from '../../utils/logger';
import { NextResponse } from 'next/server';

export const PUT = async (req) => {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        const token = url.searchParams.get('token');
        const updated = await updateFcmToken(id, token);
        return NextResponse.json({ success: true, data: updated });

    } catch (error) {
        logger.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
};
