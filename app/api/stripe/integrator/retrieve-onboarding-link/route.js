/* eslint-disable linebreak-style */
/**
 * POST /api/stripe/integrator/retrieve-onboarding-link
 * Get the current onboarding link for a Connect account in progress
 * 
 * Used when user needs to resume onboarding without creating a new account
 */

import { NextResponse } from 'next/server';
import Integrator from '@/_/api/models/integrator';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { logger } from '../../../utils/logger';
import { getOnboardingRefreshLink } from '../../../services/stripeConnectService';
import { mongoConnect } from '../../../../../utils/connectDb';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      logger.warn('Unauthorized retrieve link - no session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'integrator') {
      logger.warn('Unauthorized retrieve link - invalid role', {
        userId: session.user.id,
        role: session.user.role
      });
      return NextResponse.json(
        { error: 'Only integrators can retrieve onboarding links' },
        { status: 403 }
      );
    }

    const integratorId = session.user.integrator_id;
    if (!integratorId) {
      logger.warn('Missing integrator ID for retrieve link');
      return NextResponse.json(
        { error: 'Integrator ID is required' },
        { status: 400 }
      );
    }

    await mongoConnect();

    const integrator = await Integrator.findById(integratorId);
    if (!integrator) {
      logger.warn('Integrator not found for retrieve link', {
        integratorId
      });
      return NextResponse.json(
        { error: 'Integrator not found' },
        { status: 404 }
      );
    }

    // Verify Connect account exists
    if (!integrator.stripeConnectAccountId) {
      logger.warn('No Connect account to retrieve link for', {
        integratorId
      });
      return NextResponse.json(
        { error: 'No Connect account found. Please start onboarding first.' },
        { status: 400 }
      );
    }

    // Get account link from Stripe
    const accountLink = await createIntegratorAccountLink(integrator.stripeConnectAccountId);

    logger.info('Onboarding link retrieved successfully', {
      integratorId,
      accountId: integrator.stripeConnectAccountId
    });

    return NextResponse.json({
      success: true,
      accountId: integrator.stripeConnectAccountId,
      onboardingUrl: accountLink.url,
      expiresAt: accountLink.expires_at
    });
  } catch (error) {
    logger.error('Retrieve onboarding link failed', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: 'Failed to retrieve onboarding link' },
      { status: 500 }
    );
  }
}
