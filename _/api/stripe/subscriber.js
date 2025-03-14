import nc from 'next-connect';
import Stripe from 'stripe';
import { logger } from '../utils/logger';

const createSubscription = async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });
    const { customerId, priceId, contact, email } = req.body;

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

    res.status(200).json({
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret
      }
    });
  } catch (e) {
    logger.error(e);
    res.status(400).json(e.message);
  }
};

const handler = nc().post(createSubscription);

export default handler;
