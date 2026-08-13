
import { getVerifySubscriptionStatus } from '../../../services/integrator';
import { logger } from '../../../utils/logger';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const GET = async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');
        if (!token) return NextResponse.json({ success: false, error: 'Missing checkout token' }, { status: 400 });
        const checkout = jwt.verify(token, process.env.NEXTAUTH_SECRET);
        if (checkout.purpose !== 'checkout-status') {
          return NextResponse.json({ success: false, error: 'Invalid checkout token' }, { status: 401 });
        }

        const data = await getVerifySubscriptionStatus(checkout.customerId);
        if (data.active) data.email = checkout.email;
        
        return NextResponse.json({ data, success: true });
    } catch (error) {
        logger.error(error);
        return NextResponse.json({ success: false, error: 'Unable to verify checkout status' }, { status: 401 });
    }
};
