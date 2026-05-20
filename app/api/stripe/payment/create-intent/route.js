/* eslint-disable linebreak-style */
/**
 * POST /api/stripe/payment/create-intent
 * Create a payment intent for cross-integrator engineer service payment
 * 
 * Request body:
 * {
 *   schedulerId: string,
 *   amount: number (in pence/cents)
 * }
 * 
 * Returns:
 * {
 *   paymentIntentId: string,
 *   clientSecret: string,
 *   payingIntegrator: { name, email },
 *   receivingIntegrator: { name },
 *   engineer: { name },
 *   grossAmount: number,
 *   platformFeeAmount: number,
 *   netAmount: number,
 *   paymentStatus: string
 * }
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { logger } from '../../../utils/logger';
import { connectDb } from '../../../../utils/connectDb';
import Scheduler from '../../../models/scheduler';
import Integrator from '../../../models/integrator';
import User from '../../../models/user';
import Payment from '../../../models/payment';
import {
  determineReceivingIntegrator,
  validateReceivingIntegrator,
  createCrossIntegratorPaymentIntent
} from '../../../services/stripeMarketplaceService';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      logger.warn('Unauthorized payment intent creation - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Security: Only integrators can create payments
    if (session.user.role !== 'integrator') {
      logger.warn('Non-integrator attempted to create payment', {
        userId: session.user.id,
        role: session.user.role
      });
      return NextResponse.json(
        { error: 'Only integrators can make payments' },
        { status: 403 }
      );
    }

    const { schedulerId, amount } = await req.json();

    if (!schedulerId || !amount) {
      return NextResponse.json(
        { error: 'schedulerId and amount are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    await connectDb();

    // Fetch scheduler
    const scheduler = await Scheduler.findById(schedulerId);
    if (!scheduler) {
      logger.warn('Scheduler not found', { schedulerId });
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Paying integrator (who is making this payment request)
    const payingIntegratorId = session.user.integrator_id;
    const payingIntegrator = await Integrator.findById(payingIntegratorId);
    if (!payingIntegrator) {
      logger.warn('Paying integrator not found', { payingIntegratorId });
      return NextResponse.json(
        { error: 'Your integrator account not found' },
        { status: 404 }
      );
    }

    if (!payingIntegrator.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Your Stripe payment setup is incomplete. Please check subscription settings.' },
        { status: 400 }
      );
    }

    // Engineer (service provider)
    const engineer = await User.findById(scheduler.engineer);
    if (!engineer) {
      logger.warn('Engineer not found', { engineerId: scheduler.engineer });
      return NextResponse.json({ error: 'Engineer not found' }, { status: 404 });
    }

    // Receiving integrator (engineer's owner - who receives payment)
    let receivingIntegratorId;
    try {
      const receivingIntegratorInfo = determineReceivingIntegrator(engineer);
      receivingIntegratorId = receivingIntegratorInfo.integratorId;
    } catch (error) {
      logger.error('Cannot determine receiving integrator', { error: error.message });
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const receivingIntegrator = await Integrator.findById(receivingIntegratorId);
    if (!receivingIntegrator) {
      logger.warn('Receiving integrator not found', { receivingIntegratorId });
      return NextResponse.json(
        { error: 'Engineer integrator not found' },
        { status: 404 }
      );
    }

    // Validate receiving integrator is ready
    try {
      validateReceivingIntegrator(receivingIntegrator);
    } catch (error) {
      logger.warn('Receiving integrator validation failed', {
        receivingIntegratorId,
        error: error.message
      });
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Security: Prevent self-payment
    if (payingIntegratorId === receivingIntegratorId.toString()) {
      logger.warn('Attempted self-payment', { integratorId: payingIntegratorId });
      return NextResponse.json(
        { error: 'Cannot pay yourself. Book engineers from other companies.' },
        { status: 400 }
      );
    }

    logger.info('Creating payment intent', {
      schedulerId,
      payingIntegratorId,
      receivingIntegratorId,
      engineerId: scheduler.engineer,
      amount
    });

    // Create Stripe PaymentIntent
    let paymentIntent;
    try {
      paymentIntent = await createCrossIntegratorPaymentIntent({
        payingIntegrator,
        receivingIntegrator,
        engineer,
        grossAmount: amount,
        scheduler
      });
    } catch (error) {
      logger.error('Failed to create Stripe payment intent', {
        error: error.message,
        schedulerId
      });
      return NextResponse.json(
        { error: 'Failed to create payment. ' + error.message },
        { status: 500 }
      );
    }

    // Calculate fees
    const feePercentage = receivingIntegrator.platformFeePercentage || 10;
    const platformFeeAmount = Math.round((amount * feePercentage) / 100);
    const netAmount = amount - platformFeeAmount;

    // Create Payment document
    const payment = await Payment.create({
      payingIntegrator: payingIntegratorId,
      receivingIntegrator: receivingIntegratorId,
      engineer: scheduler.engineer,
      scheduler: schedulerId,
      project: scheduler.project,
      grossAmount: amount,
      platformFeePercentage: feePercentage,
      platformFeeAmount,
      netAmount,
      currency: payingIntegrator.currency?.toLowerCase() || 'gbp',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      paymentStatus: 'pending',
      paymentInitiatedAt: new Date(),
      notes: `Engineer: ${engineer.first_name} ${engineer.last_name}`
    });

    // Update scheduler with payment tracking
    const updatedScheduler = await Scheduler.findByIdAndUpdate(
      schedulerId,
      {
        payingIntegrator: payingIntegratorId,
        receivingIntegratorId,
        estimatedAmount: amount,
        platformFeeAmount,
        receiverAmount: netAmount,
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'pending',
        paymentInitiatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedScheduler) {
      logger.error('Failed to update scheduler with payment info', {
        schedulerId,
        paymentIntentId: paymentIntent.id
      });
      // Note: Payment created on Stripe but scheduler not updated
      // This is rare but would require manual reconciliation
    }

    logger.info('Payment intent created and saved', {
      paymentIntentId: paymentIntent.id,
      schedulerId,
      amount,
      platformFeeAmount
    });

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      payingIntegrator: {
        name: payingIntegrator.name,
        email: payingIntegrator.email
      },
      receivingIntegrator: {
        name: receivingIntegrator.name
      },
      engineer: {
        name: `${engineer.first_name} ${engineer.last_name}`
      },
      grossAmount: amount,
      platformFeeAmount,
      netAmount,
      feePercentage,
      paymentStatus: 'pending'
    });
  } catch (error) {
    logger.error('Payment intent creation failed', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
