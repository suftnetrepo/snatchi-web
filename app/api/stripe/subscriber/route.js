import Stripe from 'stripe';
import { logger } from '../../utils/logger';
const { NextResponse } = require('next/server');

// POST handler for creating a subscription
export async function POST(req) {
  try {
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2020-08-27'
    });

    // Parse the request body
    const body = await req.json();
    const { customerId, priceId, contact, email } = body;

    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      metadata: {
        stripeCustomerId: customerId,
        contact: contact,
        email: email
      },
      expand: ['latest_invoice.payment_intent']
    });

    // Return subscription details
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
    // Log the error
    logger.error(error);

    // Return the error response
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
