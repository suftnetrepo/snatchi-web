import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '../../../utils/logger';
import { pricingList } from '../../../../../src/data/pricing';

// Validate price ID
function isValidPriceId(priceId) {
  return pricingList.some(plan => plan.priceId === priceId || plan.live_priceId === priceId);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { customerId, subscriptionId, newPriceId, newPlanName } = body;

    // Validate inputs
    if (!customerId || !subscriptionId || !newPriceId) {
      logger.warn('Missing required fields for subscription upgrade');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate price ID
    if (!isValidPriceId(newPriceId)) {
      logger.warn(`Invalid price ID in upgrade: ${newPriceId}`);
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10'
    });

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
            price: newPriceId
          }
        ],
        proration_behavior: 'create_prorations',
        metadata: {
          ...((await stripe.subscriptions.retrieve(subscriptionId)).metadata || {}),
          newPlanName: newPlanName
        }
      }
    );

    if (!updatedSubscription) {
      throw new Error('Failed to update subscription with Stripe');
    }

    logger.info(`Successfully upgraded subscription ${subscriptionId} to price ${newPriceId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription upgraded successfully',
        subscriptionId: updatedSubscription.id
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error upgrading subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upgrade subscription' },
      { status: 400 }
    );
  }
}
