/* eslint-disable linebreak-style */
/**
 * GET /api/stripe/integrator/connect-status
 * Get current Stripe Connect status for the authenticated integrator
 * 
 * Returns account status, capabilities, and requirements
 */

import { NextResponse } from 'next/server';
import Integrator from '../../../models/integrator';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { logger } from '../../../utils/logger';
import { getIntegratorConnectStatus, mapStripeConnectStatus } from '../../../services/stripeConnectService';
import { connectDb } from '../../../../../utils/connectDb';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      logger.warn('Unauthorized status check - no session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'integrator') {
      logger.warn('Unauthorized status check - invalid role', {
        userId: session.user.id,
        role: session.user.role
      });
      return NextResponse.json(
        { error: 'Only integrators can check Connect status' },
        { status: 403 }
      );
    }

    const integratorId = session.user.integrator_id;
    if (!integratorId) {
      logger.warn('Missing integrator ID for status check', {
        userId: session.user.id
      });
      return NextResponse.json(
        { error: 'Integrator ID is required' },
        { status: 400 }
      );
    }

    await connectDb();

    const integrator = await Integrator.findById(integratorId);
    if (!integrator) {
      logger.warn('Integrator not found for status check', {
        userId: session.user.id,
        integratorId
      });
      return NextResponse.json(
        { error: 'Integrator not found' },
        { status: 404 }
      );
    }

    // If no Connect account yet, return not started status
    if (!integrator.stripeConnectAccountId) {
      return NextResponse.json({
        status: 'not_started',
        accountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        bankAccountOnFile: false,
        requirementsStatus: null,
        onboardingStartedAt: null,
        onboardingCompletedAt: null
      });
    }

    // Fetch current status from Stripe
    const stripeAccount = await getIntegratorConnectStatus(integrator.stripeConnectAccountId);

    // Map Stripe status to our enum
    const mappedStatus = mapStripeConnectStatus(stripeAccount);

    // Update integrator with latest status
    integrator.connectAccountStatus = mappedStatus;
    integrator.chargesEnabled = stripeAccount.charges_enabled;
    integrator.payoutsEnabled = stripeAccount.payouts_enabled;
    integrator.bankAccountOnFile = stripeAccount.external_accounts?.data?.length > 0 || false;

    // Capture reject reason if present
    if (stripeAccount.requirements?.past_due?.length > 0) {
      integrator.connectRejectReason = stripeAccount.requirements.past_due.join(', ');
    }

    await integrator.save();

    logger.info('Connect status retrieved successfully', {
      integratorId,
      accountId: integrator.stripeConnectAccountId,
      status: mappedStatus
    });

    return NextResponse.json({
      status: mappedStatus,
      accountId: integrator.stripeConnectAccountId,
      chargesEnabled: stripeAccount.charges_enabled,
      payoutsEnabled: stripeAccount.payouts_enabled,
      bankAccountOnFile: integrator.bankAccountOnFile,
      requirementsStatus: {
        currentlyDue: stripeAccount.requirements?.currently_due || [],
        pastDue: stripeAccount.requirements?.past_due || [],
        pendingVerification: stripeAccount.requirements?.pending_verification || []
      },
      onboardingStartedAt: integrator.connectOnboardingStartedAt,
      onboardingCompletedAt: integrator.connectOnboardingCompletedAt,
      rejectReason: integrator.connectRejectReason || null
    });
  } catch (error) {
    logger.error('Connect status retrieval failed', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: 'Failed to retrieve Connect status' },
      { status: 500 }
    );
  }
}
