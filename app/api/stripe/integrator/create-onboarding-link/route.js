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
import { logger } from '../../../utils/logger';
import { getUserSession } from '@/utils/generateToken';
import {
  createIntegratorExpressAccount,
  createIntegratorAccountLink
} from '../../../services/stripeConnectService';
import { mongoConnect } from '../../../../../utils/connectDb';

export async function POST(req) {
  let session = null;

  try {
    session = await getUserSession(req);

    // Verify user is authenticated
    if (!session) {
      logger.warn('Unauthorized Connect onboarding attempt - no session');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.id || session.sub || session.user?.id || null;
    const sessionRole = session.role || session.user?.role || null;
    const sessionIntegratorId = session.integrator || session.integrator_id || session.user?.integrator || session.user?.integrator_id || null;
    const integratorId = sessionIntegratorId;

    // Verify user has integrator role
    if (sessionRole !== 'integrator') {
      logger.warn('Unauthorized Connect onboarding - invalid role', {
        userId,
        role: sessionRole
      });
      return NextResponse.json(
        { success: false, error: 'Only integrators can create Connect accounts' },
        { status: 403 }
      );
    }

    // Verify integrator ID is provided
    if (!integratorId) {
      logger.warn('Missing integrator ID for Connect onboarding', { userId });
      return NextResponse.json(
        { success: false, error: 'Integrator ID is required' },
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
        { success: false, error: 'Integrator not found' },
        { status: 404 }
      );
    }

    // Verify user owns this integrator (security check)
    // This would be verified by comparing session.integrator
    if (sessionIntegratorId !== integratorId.toString()) {
      logger.warn('User attempting to create Connect account for different integrator', {
        userId,
        sessionIntegratorId,
        requestedIntegratorId: integratorId
      });
      return NextResponse.json(
        { success: false, error: 'Cannot create Connect account for other integrators' },
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
      details: error.details || null,
      stack: error.stack,
      userId: session?.id || session?.sub || session?.user?.id || null,
      integratorId: session?.integrator || session?.integrator_id || session?.user?.integrator || session?.user?.integrator_id || null
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create onboarding link',
        details: error.details || null
      },
      { status: 500 }
    );
  }
}
