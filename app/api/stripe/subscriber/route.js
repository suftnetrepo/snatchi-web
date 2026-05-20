import Stripe from 'stripe';
import { logger } from '../../utils/logger';
import { pricingList } from '../../../src/data/pricing';
import { rateLimitMiddleware, recordFailedCheckout, clearRateLimit } from '../../middleware/rate-limiter';
const { NextResponse } = require('next/server');

// Validate price ID against known pricing
function isValidPriceId(priceId) {
  return pricingList.some(plan => plan.priceId === priceId || plan.live_priceId === priceId);
}

// POST handler for creating a subscription
export async function POST(req) {
  try {
    // Parse the request body
    const body = await req.json();
    const { customerId, priceId, contact, email } = body;

    // Validate customer ID
    if (!customerId) {
      logger.warn('Missing customer ID in checkout request');
      return NextResponse.json(
        { error: 'Missing customer ID' },
        { status: 400 }
      );
    }

    // Check rate limit (normal checkout attempts)
    const rateLimit = rateLimitMiddleware(customerId, 'checkout', false);
    if (!rateLimit.allowed) {
      logger.warn(`Rate limit exceeded for customer ${customerId}`);
      return NextResponse.json(
        {
          error: rateLimit.error,
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
          }
        }
      );
    }

    // Initialize Stripe with modern API version
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10'
    });

    // Validate price ID
    if (!isValidPriceId(priceId)) {
      logger.warn(`Invalid price ID attempted: ${priceId}`);
      recordFailedCheckout(customerId, 'Invalid price ID');
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Check for existing active/incomplete subscription for this customer
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100
    });

    const activeSubscription = existingSubscriptions.data.find(sub => {
      const status = sub.status.toLowerCase();
      return ['active', 'trialing', 'incomplete', 'incomplete_expired'].includes(status);
    });

    if (activeSubscription) {
      logger.warn(`Duplicate subscription attempt for customer ${customerId}`);
      recordFailedCheckout(customerId, 'Customer already has an active subscription');
      return NextResponse.json(
        { error: 'Customer already has an active subscription' },
        { status: 400 }
      );
    }

    // Generate idempotency key from stable values
    const idempotencyKey = `${customerId}-${priceId}-${email}`;

    // Create a subscription with idempotency key
    const subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        metadata: {
          stripeCustomerId: customerId,
          contact: contact,
          email: email
        },
        expand: ['latest_invoice.payment_intent']
      },
      {
        idempotencyKey: idempotencyKey
      }
    );

    // Return subscription details
    clearRateLimit(customerId); // Clear rate limit on successful subscription creation
    return NextResponse.json(
      {
        data: {
          subscriptionId: subscription.id,
          clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret
        }
      },
      { status: 200 }
    );
  } catch (error) {
    // Parse customer ID from body if available for rate limit recording
    try {
      const body = await req.json().catch(() => ({}));
      const customerId = body.customerId;
      if (customerId) {
        recordFailedCheckout(customerId, error.message);
      }
    } catch (e) {
      // Body parsing failed, continue with error response
    }

    // Log the error
    logger.error(error);

    // Return the error response
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
