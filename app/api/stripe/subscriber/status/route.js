
import { getVerifySubscriptionStatus } from '../../../services/integrator';
import { logger } from '../../../utils/logger';
import { NextResponse } from 'next/server';

export const GET = async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const stripeCustomerId = searchParams.get('stripeCustomerId');

        const data = await getVerifySubscriptionStatus(stripeCustomerId);
        
        return NextResponse.json({ data, success: true });
    } catch (error) {
        logger.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
};