/* eslint-disable linebreak-style */
/**
 * POST /api/stripe/integrator/create-onboarding-link
 * Create a new Stripe Connect Express account and return onboarding link
 * 
 * Only authenticated integrator users can create their own account
 * Requires integrator role and must be creating for their own integrator
 */

import { NextResponse } from 'next/server';
import Integrator from '@/_/api/models/integrator';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { logger } from '../../../utils/logger';
import {
  createIntegratorExpressAccount,
  createIntegratorAccountLink,
  mapStripeConnectStatus
} from '../../../services/stripeConnectService';
import { mongoConnect } from '../../../../../utils/connectDb';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    // Verify user is authenticated
    if (!session || !session.user) {
      logger.warn('Unauthorized Connect onboarding attempt - no session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const integratorId = session.user.integrator_id || req.body?.integratorId;

    // Verify user has integrator role
    if (session.user.role !== 'integrator') {
      logger.warn('Unauthorized Connect onboarding - invalid role', {
        userId,
        role: session.user.role
      });
      return NextResponse.json(
        { error: 'Only integrators can create Connect accounts' },
        { status: 403 }
      );
    }

    // Verify integrator ID is provided
    if (!integratorId) {
      logger.warn('Missing integrator ID for Connect onboarding', { userId });
      return NextResponse.json(
        { error: 'Integrator ID is required' },
        { status: 400 }
      );
    }

    await mongoConnect();

    // Fetch integrator
    const integrator = await Integrator.findById(integratorId);
    if (!integrator) {
      logger.warn('Integrator not found for Connect onboarding', {
        userId,
        integratorId
      });
      return NextResponse.json(
        { error: 'Integrator not found' },
        { status: 404 }
      );
    }

    // Verify user owns this integrator (security check)
    // This would be verified by comparing session.user.integrator_id
    if (session.user.integrator_id !== integratorId.toString()) {
      logger.warn('User attempting to create Connect account for different integrator', {
        userId,
        sessionIntegratorId: session.user.integrator_id,
        requestedIntegratorId: integratorId
      });
      return NextResponse.json(
        { error: 'Cannot create Connect account for other integrators' },
        { status: 403 }
      );
    }

    // Check if already has a Connect account
    if (integrator.stripeConnectAccountId) {
      logger.info('Integrator already has Connect account, returning existing', {
        integratorId,
        accountId: integrator.stripeConnectAccountId
      });

      // Create new account link for existing account
      const accountLink = await createIntegratorAccountLink(integrator.stripeConnectAccountId);

      return NextResponse.json({
        success: true,
        accountId: integrator.stripeConnectAccountId,
        onboardingUrl: accountLink.url,
        expiresAt: accountLink.expires_at,
        message: 'Using existing Connect account'
      });
    }

    // Create new Stripe Express account
    const stripeAccount = await createIntegratorExpressAccount(integrator);

    // Create account link for onboarding
    const accountLink = await createIntegratorAccountLink(stripeAccount.id);

    // Update integrator with Connect account details
    integrator.stripeConnectAccountId = stripeAccount.id;
    integrator.connectAccountStatus = 'onboarding_started';
    integrator.connectOnboardingStartedAt = new Date();
    await integrator.save();

    logger.info('Connect onboarding initiated successfully', {
      integratorId,
      accountId: stripeAccount.id
    });

    return NextResponse.json({
      success: true,
      accountId: stripeAccount.id,
      onboardingUrl: accountLink.url,
      expiresAt: accountLink.expires_at
    });
  } catch (error) {
    logger.error('Connect onboarding creation failed', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}
