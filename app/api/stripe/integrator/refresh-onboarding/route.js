/* eslint-disable linebreak-style */
/**
 * POST /api/stripe/integrator/refresh-onboarding
 * Refresh the onboarding link (in case user left without completing)
 * 
 * Creates a new account link with a fresh expiration time
 */

import { NextResponse } from 'next/server';
import Integrator from '../../../models/integrator';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { logger } from '../../../utils/logger';
import { getOnboardingRefreshLink } from '../../../services/stripeConnectService';
import { connectDb } from '../../../../../utils/connectDb';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      logger.warn('Unauthorized refresh onboarding - no session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'integrator') {
      logger.warn('Unauthorized refresh onboarding - invalid role', {
        userId: session.user.id,
        role: session.user.role
      });
      return NextResponse.json(
        { error: 'Only integrators can refresh onboarding' },
        { status: 403 }
      );
    }

    const integratorId = session.user.integrator_id;
    if (!integratorId) {
      logger.warn('Missing integrator ID for refresh onboarding');
      return NextResponse.json(
        { error: 'Integrator ID is required' },
        { status: 400 }
      );
    }

    await connectDb();

    const integrator = await Integrator.findById(integratorId);
    if (!integrator) {
      logger.warn('Integrator not found for refresh onboarding', {
        integratorId
      });
      return NextResponse.json(
        { error: 'Integrator not found' },
        { status: 404 }
      );
    }

    // Verify Connect account exists
    if (!integrator.stripeConnectAccountId) {
      logger.warn('No Connect account to refresh', {
        integratorId
      });
      return NextResponse.json(
        { error: 'No Connect account found. Please start onboarding first.' },
        { status: 400 }
      );
    }

    // Create new account link
    const accountLink = await createIntegratorAccountLink(integrator.stripeConnectAccountId);

    logger.info('Onboarding link refreshed successfully', {
      integratorId,
      accountId: integrator.stripeConnectAccountId
    });

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      expiresAt: accountLink.expires_at
    });
  } catch (error) {
    logger.error('Refresh onboarding failed', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: 'Failed to refresh onboarding link' },
      { status: 500 }
    );
  }
}
