// import Stripe from 'stripe';
import { logger } from '../../utils/logger';
import Stripe from 'stripe';
import { pricingList } from '../../../../src/data/pricing';
import { rateLimitMiddleware, recordFailedCheckout, clearRateLimit } from '../../middleware/rate-limiter';
import Integrator from '../../models/integrator';
import { mongoConnect } from '../../../../utils/connectDb';
import jwt from 'jsonwebtoken';
const { NextResponse } = require('next/server');

// Validate price ID against known pricing
function isValidPriceId(priceId) {
  return pricingList.some(plan => plan.priceId === priceId || plan.live_priceId === priceId);
}

const createCheckoutToken = ({ customerId, email, integratorId }) => jwt.sign(
  { purpose: 'checkout-status', customerId, email, integratorId: String(integratorId) },
  process.env.NEXTAUTH_SECRET,
  { expiresIn: '30m' }
);

// POST handler for creating a subscription
export async function POST(req) {
  try {
    // Parse the request body
    const body = await req.json();
    const { priceId, contact, integratorId } = body;
    const email = String(body.email || '').trim().toLowerCase();

    if (!isValidPriceId(priceId)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    await mongoConnect();
    const integrator = await Integrator.findOne({ _id: integratorId, email });
    if (!integrator) {
      return NextResponse.json({ error: 'Complete your account details before payment' }, { status: 409 });
    }

    // Initialize Stripe with modern API version
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10'
    });

    let customer;
    if (integrator.stripeCustomerId) {
      customer = await stripe.customers.retrieve(integrator.stripeCustomerId);
    } else {
      const matches = await stripe.customers.list({ email, limit: 1 });
      customer = matches.data[0] || await stripe.customers.create(
        { email, name: contact, metadata: { integratorId: String(integrator._id) } },
        { idempotencyKey: `customer-${integrator._id}` }
      );
      integrator.stripeCustomerId = customer.id;
      await integrator.save();
    }

    // Check rate limit (normal checkout attempts)
    const customerId = customer.id;
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

    // Check for existing active/incomplete subscription for this customer
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100
    });

    const activeSubscription = existingSubscriptions.data.find(sub => {
      const status = sub.status.toLowerCase();
      return ['active', 'trialing', 'incomplete'].includes(status) &&
        (sub.metadata?.integratorId === String(integrator._id) || sub.metadata?.email === email);
    });

    if (activeSubscription) {
      if (activeSubscription.status === 'incomplete') {
        const expanded = await stripe.subscriptions.retrieve(activeSubscription.id, {
          expand: ['latest_invoice.payment_intent']
        });
        return NextResponse.json({ data: {
          subscriptionId: expanded.id,
          customerId,
          clientSecret: expanded.latest_invoice?.payment_intent?.client_secret,
          checkoutToken: createCheckoutToken({ customerId, email, integratorId: integrator._id })
        } });
      }
      return NextResponse.json({ error: 'This account already has an active subscription' }, { status: 409 });
    }

    // Generate idempotency key from stable values
    const idempotencyKey = `subscription-${integrator._id}-${priceId}`;

    // Create a subscription with idempotency key
    const subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        metadata: {
          stripeCustomerId: customerId,
          integratorId: String(integrator._id),
          checkoutFlow: 'initial',
          contact: contact,
          email: email
        },
        expand: ['latest_invoice.payment_intent']
      },
      {
        idempotencyKey: idempotencyKey
      }
    );

    await Integrator.updateOne(
      { _id: integrator._id },
      { $set: { stripeCustomerId: customerId, subscriptionId: subscription.id, priceId, status: 'incomplete' } }
    );

    // Return subscription details
    clearRateLimit(customerId); // Clear rate limit on successful subscription creation
    return NextResponse.json(
      {
        data: {
          subscriptionId: subscription.id,
           customerId: customerId,
          clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret,
          checkoutToken: createCheckoutToken({ customerId, email, integratorId: integrator._id })
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
