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
import Stripe from 'stripe';
import { logger } from '../../../utils/logger';
import { mongoConnect } from '../../../../../utils/connectDb';
import Scheduler from '../../../models/scheduler';
import Integrator from '@/_/api/models/integrator';
import User from '../../../models/user';
import Payment from '../../../models/payment';
import {
  determineReceivingIntegrator,
  validateReceivingIntegrator,
  createCrossIntegratorPaymentIntent
} from '../../../services/stripeMarketplaceService';
import {
  getScheduleReceivingIntegratorId,
  getSchedulePayingIntegratorId,
  buildPaymentPendingUpdate
} from '../../../services/scheduler';
import { SCHEDULER_STATUS, normalizeSchedulerStatus } from '../../../constants/statuses';
import { getUserSession } from '@/utils/generateToken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

export async function POST(req) {
  try {
    const session = await getUserSession(req);

    if (!session) {
      logger.warn('Unauthorized payment intent creation - no session');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const actor = {
      userId: session.id,
      role: session.role,
      integratorId: session.integrator,
    };

    // Security: Only integrators can create payments
    if (actor.role !== 'integrator') {
      logger.warn('Non-integrator attempted to create payment', {
        userId: actor.userId,
        role: actor.role
      });
      return NextResponse.json(
        { success: false, error: 'Only integrators can make payments' },
        { status: 403 }
      );
    }

    const { schedulerId, amount } = await req.json();

    if (!schedulerId || !amount) {
      return NextResponse.json(
        { success: false, error: 'schedulerId and amount are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    await mongoConnect();

    // Fetch scheduler
    const scheduler = await Scheduler.findById(schedulerId);
    if (!scheduler) {
      logger.warn('Scheduler not found', { schedulerId });
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const normalizedStatus = normalizeSchedulerStatus(scheduler.status);

    if (normalizedStatus === SCHEDULER_STATUS.ACCEPTED) {
      return NextResponse.json(
        {
          success: false,
          error: "Schedule must be approved by the engineer's integrator before payment."
        },
        { status: 400 }
      );
    }

    if (![SCHEDULER_STATUS.APPROVED, SCHEDULER_STATUS.AWAITING_PAYMENT].includes(normalizedStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Schedule cannot be paid while in status ${scheduler.status}.`
        },
        { status: 400 }
      );
    }

    // Paying integrator (who is making this payment request)
    const payingIntegratorId = actor.integratorId;
    const expectedPayingIntegratorId = getSchedulePayingIntegratorId(scheduler);

    if (!payingIntegratorId || expectedPayingIntegratorId !== payingIntegratorId.toString()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only the booking integrator can pay for this schedule.'
        },
        { status: 403 }
      );
    }

    const payingIntegrator = await Integrator.findById(payingIntegratorId);
    if (!payingIntegrator) {
      logger.warn('Paying integrator not found', { payingIntegratorId });
      return NextResponse.json(
        { success: false, error: 'Your integrator account not found' },
        { status: 404 }
      );
    }

    if (!payingIntegrator.stripeCustomerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Your Stripe payment setup is incomplete. Please check subscription settings.'
        },
        { status: 400 }
      );
    }

    // Engineer (service provider)
    const engineer = await User.findById(scheduler.engineer);
    if (!engineer) {
      logger.warn('Engineer not found', { engineerId: scheduler.engineer });
      return NextResponse.json({ success: false, error: 'Engineer not found' }, { status: 404 });
    }

    // Receiving integrator (engineer's owner - who receives payment)
    let receivingIntegratorId;
    try {
      const receivingIntegratorInfo = determineReceivingIntegrator(engineer);
      receivingIntegratorId = receivingIntegratorInfo.integratorId;
    } catch (error) {
      logger.error('Cannot determine receiving integrator', { error: error.message });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const scheduledReceivingIntegratorId = getScheduleReceivingIntegratorId(scheduler);
    if (
      scheduledReceivingIntegratorId &&
      scheduledReceivingIntegratorId !== receivingIntegratorId.toString()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Receiving integrator does not match the engineer owner for this schedule.'
        },
        { status: 400 }
      );
    }

    const receivingIntegrator = await Integrator.findById(receivingIntegratorId);
    if (!receivingIntegrator) {
      logger.warn('Receiving integrator not found', { receivingIntegratorId });
      return NextResponse.json(
        { success: false, error: 'Engineer integrator not found' },
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
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Security: Prevent self-payment
    if (payingIntegratorId === receivingIntegratorId.toString()) {
      logger.warn('Attempted self-payment', { integratorId: payingIntegratorId });
      return NextResponse.json(
        { success: false, error: 'Cannot pay yourself. Book engineers from other companies.' },
        { status: 400 }
      );
    }

    const existingPayment = await Payment.findOne({ scheduler: schedulerId });

    if (existingPayment?.paymentStatus === 'succeeded') {
      return NextResponse.json(
        { success: false, error: 'A successful payment already exists for this schedule.' },
        { status: 400 }
      );
    }

    // If a pending payment exists, verify the PI is still usable on Stripe's side
    if (existingPayment?.paymentStatus === 'pending' && existingPayment?.clientSecret) {
      try {
        const existingPI = await stripe.paymentIntents.retrieve(existingPayment.paymentIntentId);
        if (existingPI.status === 'requires_payment_method') {
          logger.info('Reusing existing valid pending payment intent', {
            paymentIntentId: existingPayment.paymentIntentId, schedulerId
          });
          return NextResponse.json({
            success: true,
            paymentIntentId: existingPayment.paymentIntentId,
            clientSecret: existingPayment.clientSecret,
            payingIntegrator: { name: payingIntegrator.name, email: payingIntegrator.email },
            receivingIntegrator: { name: receivingIntegrator.name },
            engineer: { name: `${engineer.first_name} ${engineer.last_name}` },
            grossAmount: amount,
            platformFeeAmount: existingPayment.platformFeeAmount,
            netAmount: existingPayment.netAmount,
            paymentStatus: 'pending'
          });
        }
        // PI is in an unusable state — fall through to create a new one
        logger.info('Existing PI not reusable, creating fresh one', {
          paymentIntentId: existingPayment.paymentIntentId,
          piStatus: existingPI.status
        });
      } catch (retrieveErr) {
        logger.warn('Could not retrieve existing PI, creating fresh one', { error: retrieveErr.message });
      }
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
        { success: false, error: 'Failed to create payment. ' + error.message },
        { status: 500 }
      );
    }

    // Calculate fees
    const feePercentage = receivingIntegrator.platformFeePercentage || 10;
    const platformFeeAmount = Math.round((amount * feePercentage) / 100);
    const netAmount = amount - platformFeeAmount;

    // Create Payment document
    const paymentPayload = {
      payingIntegrator: payingIntegratorId,
      receivingIntegrator: receivingIntegratorId,
      engineer: scheduler.engineer,
      scheduler: schedulerId,
      project: scheduler.project,
      grossAmount: amount,
      platformFeePercentage: feePercentage,
      platformFeeAmount,
      netAmount,
      currency: (['£','$','€','¥'].includes(payingIntegrator.currency)
        ? { '£': 'gbp', '$': 'usd', '€': 'eur', '¥': 'jpy' }[payingIntegrator.currency]
        : payingIntegrator.currency?.toLowerCase()) || 'gbp',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      paymentStatus: 'pending',
      paymentInitiatedAt: new Date(),
      notes: `Engineer: ${engineer.first_name} ${engineer.last_name}`
    };

    const payment = existingPayment
      ? await Payment.findByIdAndUpdate(existingPayment._id, paymentPayload, { new: true, runValidators: true })
      : await Payment.create(paymentPayload);

    // Update scheduler with payment tracking
    const updatedScheduler = await Scheduler.findByIdAndUpdate(
      schedulerId,
      buildPaymentPendingUpdate({
        schedule: scheduler,
        payingIntegratorId,
        receivingIntegratorId,
        estimatedAmount: amount,
        platformFeeAmount,
        receiverAmount: netAmount,
        paymentIntentId: paymentIntent.id
      }),
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
      { success: false, error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
