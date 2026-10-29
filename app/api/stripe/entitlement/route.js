import { NextResponse } from 'next/server';
import Integrator from '../../models/integrator';
import { subscriptionStatusAllowsWorkspaceAccess } from '../../services/subscriptionEntitlement';
import { getUserSession } from '../../../../utils/generateToken';
import { logger } from '../../utils/logger';
import { mongoConnect } from '../../../../utils/connectDb';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await mongoConnect();
    const user = await getUserSession(req, { allowInactiveSubscription: true });

    if (!user?.integrator || user.role === 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organisation = await Integrator.findById(user.integrator)
      .select('name plan status startDate endDate trial_start trial_end stripeCustomerId adminSuspension')
      .lean();

    if (!organisation) {
      return NextResponse.json({ error: 'Organisation account not found' }, { status: 404 });
    }

    const status = String(organisation.status || '').trim().toLowerCase();

    return NextResponse.json({
      data: {
        organisationName: organisation.name || '',
        plan: organisation.plan || '',
        status,
        role: user.role,
        hasAccess: subscriptionStatusAllowsWorkspaceAccess(status),
        hasStripeCustomer: Boolean(organisation.stripeCustomerId),
        isAdminSuspended: Boolean(organisation.adminSuspension?.suspended),
        suspensionReason: organisation.adminSuspension?.reason || '',
        startDate: organisation.startDate || null,
        endDate: organisation.endDate || null,
        trialStart: organisation.trial_start || null,
        trialEnd: organisation.trial_end || null
      }
    }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    logger.error(error, 'Failed to check organisation subscription entitlement');
    return NextResponse.json(
      { error: 'Unable to verify your subscription right now. Please try again.' },
      { status: 500 }
    );
  }
}
