import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';

const {
  invoicePaymentSuccess,
  setDefaultPaymentMethod,
  invoicePaymentFailed,
  trialWillEnd,
  updateSubscription,
  createSubscription,
  cancelSubscription,
  updateStatus,
  handleConnectAccountUpdated,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleTransferCreated,
  handleTransferPaid
} = require('../services/webHooksService');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req.body) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req) {
  let event = null;
  let rawBody;

  try {
    // Log request headers for debugging
    console.info('Webhook Headers:', {
      'content-type': req.headers.get('content-type'),
      'stripe-signature': req.headers.get('stripe-signature') ? 'present' : 'missing'
    });

    try {
      // Try to get raw body using the stream method
      rawBody = await getRawBody(req);
      console.info('Raw body length:', rawBody.length);
    } catch (bodyError) {
      console.error('Body parsing error:', bodyError);
      return NextResponse.json(
        { error: 'Could not parse request body' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        req.headers.get('stripe-signature'),
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.info('Webhook event constructed successfully:', { type: event.type });
    } catch (signatureError) {
      console.error('Signature verification failed:', signatureError.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the verified event
    const handlers = {
      'customer.subscription.created': createSubscription,
      'customer.subscription.updated': updateSubscription,
      'customer.subscription.deleted': cancelSubscription,
      'invoice.payment_succeeded': async (event) => {
        await invoicePaymentSuccess(event);
        await setDefaultPaymentMethod(event);
      },
      'invoice.payment_failed': invoicePaymentFailed,
      'customer.source.updated': updateStatus,
      'customer.subscription.trial_will_end': trialWillEnd,
      'account.updated': handleConnectAccountUpdated,
      'payment_intent.succeeded': handlePaymentIntentSucceeded,
      'payment_intent.payment_failed': handlePaymentIntentFailed,
      'transfer.created': handleTransferCreated,
      'transfer.paid': handleTransferPaid
    };

    // Process the event
    try {
      if (handlers[event.type]) {
        await handlers[event.type](event);
        console.info(`Successfully processed ${event.type} event: ${event.id}`)
      } else {
        console.warn(`Unhandled event type: ${event.type}`);
      }
    } catch (handlerError) {
      console.error(`Error processing ${event.type} event:`, handlerError);
      // Return error to Stripe so it will retry
      return NextResponse.json(
        { error: 'Webhook processing failed', details: handlerError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', {
      message: error.message,
      stack: error.stack,
      eventType: event?.type,
      rawBodyLength: rawBody?.length
    });

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}