import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { logger } from '../../utils/logger';
import Integrator from '../../models/integrator';
import { mongoConnect } from '../../../../utils/connectDb';
import { getEntitlementUsage } from '../../services/entitlements';

export async function GET(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await mongoConnect();

    // Get integrator by user ID (assuming user.id is the integrator ID)
    const integrator = await Integrator.findById(session.user.id);

    if (!integrator) {
      return NextResponse.json(
        { error: 'Integrator not found' },
        { status: 404 }
      );
    }

    // Return subscription details
    const entitlementUsage = await getEntitlementUsage(integrator._id).catch(() => null);
    const data = {
      subscriptionId: integrator.subscriptionId,
      status: integrator.status,
      plan: integrator.plan,
      priceId: integrator.priceId,
      startDate: integrator.startDate,
      endDate: integrator.endDate,
      trial_start: integrator.trial_start,
      trial_end: integrator.trial_end,
      stripeCustomerId: integrator.stripeCustomerId,
      email: integrator.email,
      name: integrator.name,
      entitlements: entitlementUsage
    };

    return NextResponse.json(
      { data },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}
