import nc from 'next-connect';
import Stripe from 'stripe';
import { logger } from '../utils/logger';

const createCustomer = async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });
    const { email } = req.body;

    const customer = await stripe.customers.create({
      email
    });

    res.status(200).json({data :customer});
  } catch (e) {
    logger.error(e);
    res.status(400).json(e.message);
  }
};

const handler = nc().post(createCustomer);

export default handler;
