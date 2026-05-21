/* eslint-disable linebreak-style */
/**
 * POST /api/stripe/payment/confirm
 * Confirm a payment after Stripe processing
 * Called after Stripe Elements confirm payment
 * 
 * Request body:
 * {
 *   paymentIntentId: string
 * }
 * 
 * Returns:
 * {
 *   success: boolean,
 *   paymentIntentId: string,
 *   status: string,
 *   message: string
 * }
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { logger } from '../../../utils/logger';
import { mongoConnect } from '../../../../../utils/connectDb';
import Payment from '../../../models/payment';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      logger.warn('Unauthorized payment confirmation - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'paymentIntentId is required' },
        { status: 400 }
      );
    }

    await mongoConnect();

    // Retrieve payment from database
    const payment = await Payment.findOne({ paymentIntentId });
    if (!payment) {
      logger.warn('Payment not found', { paymentIntentId });
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify user is the paying integrator
    if (payment.payingIntegrator.toString() !== session.user.integrator_id) {
      logger.warn('User attempting to confirm payment they did not create', {
        paymentIntentId,
        userId: session.user.id
      });
      return NextResponse.json(
        { error: 'Unauthorized to confirm this payment' },
        { status: 403 }
      );
    }

    // Retrieve current status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    logger.info('Payment confirmation attempt', {
      paymentIntentId,
      status: paymentIntent.status
    });

    if (paymentIntent.status === 'succeeded') {
      // Payment already succeeded
      payment.paymentStatus = 'succeeded';
      payment.chargeId = paymentIntent.charges.data[0]?.id;
      payment.paymentSucceededAt = new Date();
      await payment.save();

      logger.info('Payment already succeeded', { paymentIntentId });

      return NextResponse.json({
        success: true,
        paymentIntentId,
        status: 'succeeded',
        message: 'Payment completed successfully'
      });
    }

    if (paymentIntent.status === 'processing') {
      logger.info('Payment still processing', { paymentIntentId });
      return NextResponse.json({
        success: false,
        paymentIntentId,
        status: 'processing',
        message: 'Payment is being processed. Please wait.'
      });
    }

    if (paymentIntent.status === 'requires_payment_method') {
      logger.warn('Payment requires payment method', { paymentIntentId });
      return NextResponse.json({
        success: false,
        paymentIntentId,
        status: 'requires_payment_method',
        message: 'Payment method is required'
      });
    }

    if (paymentIntent.status === 'requires_action') {
      logger.warn('Payment requires action (3D Secure)', { paymentIntentId });
      return NextResponse.json({
        success: false,
        paymentIntentId,
        status: 'requires_action',
        message: 'Additional verification required. Check your bank app.',
        clientSecret: paymentIntent.client_secret
      });
    }

    logger.warn('Unexpected payment intent status', {
      paymentIntentId,
      status: paymentIntent.status
    });

    return NextResponse.json({
      success: false,
      paymentIntentId,
      status: paymentIntent.status,
      message: 'Payment is pending. Please check back in a moment.'
    });
  } catch (error) {
    logger.error('Payment confirmation failed', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
