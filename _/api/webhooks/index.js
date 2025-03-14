import nc from 'next-connect';
import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { buffer } from 'micro';
const {
  invoicePaymentSuccess,
  setDefaultPaymentMethod,
  invoicePaymentFailed,
  trialWillEnd,
  updateSubscription,
  createSubscription,
  cancelSubscription,
  updateStatus
} = require('../services/webHooksService');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

const handleStripeWebhook = async (req, res) => {
  let event = null;
  try {
    const body = await buffer(req);

    event = stripe.webhooks.constructEvent(
      body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET_LOCAL
    );
  } catch (e) {
    logger.error(e);

    return res.status(400).send('Webhook Error: Invalid Signature');
  }

  switch (event.type) {
    case 'customer.subscription.created':   
      await createSubscription(event);
      break;
    case 'customer.subscription.updated': 
      await updateSubscription(event);
      break;
    case 'customer.subscription.deleted':
      await cancelSubscription(event);
      break;
    case 'invoice.payment_succeeded':
      await invoicePaymentSuccess(event);
      await setDefaultPaymentMethod(event);
      break;
    case 'invoice.payment_failed':
      await invoicePaymentFailed(event);
      break;
    case 'customer.source.updated':
      await updateStatus(event);
      break;
    case 'customer.subscription.trial_will_end':
      trialWillEnd(event);
      break;
    default:
      break;
  }

  res.status(200).send('Webhook received');
};

const handler = nc().post(handleStripeWebhook);

export default handler;

export const config = {
  api: {
    bodyParser: false
  }
};
