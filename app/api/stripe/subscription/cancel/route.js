import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '../../../utils/logger';

export async function POST(req) {
  try {
    const body = await req.json();
    const { subscriptionId } = body;

    // Validate input
    if (!subscriptionId) {
      logger.warn('Missing subscriptionId for cancellation');
      return NextResponse.json(
        { error: 'Missing subscription ID' },
        { status: 400 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10'
    });

    // Cancel subscription
    const cancelledSubscription = await stripe.subscriptions.del(subscriptionId);

    if (!cancelledSubscription) {
      throw new Error('Failed to cancel subscription with Stripe');
    }

    logger.info(`Successfully cancelled subscription ${subscriptionId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription cancelled successfully',
        subscriptionId: cancelledSubscription.id,
        status: cancelledSubscription.status
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    
    // Check if subscription not found
    if (error.code === 'resource_missing') {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 400 }
    );
  }
}
