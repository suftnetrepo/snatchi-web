import nc from 'next-connect';
import Stripe from 'stripe';
import { logger } from '../utils/logger';

const createCustomerPortalSession = async (req, res) => {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });
        const { stripeCustomerId } = req.body;

        console.log("................................................stripeCustomerId", stripeCustomerId)
        console.log("................................................req.body", req.body)

        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: process.env.NEXT_FRONTEND_URL
        })

        res.status(200).json({ url: session.url });
    } catch (e) {
        console.error(e);
        res.status(500).json(e.message);
    }
};

const handler = nc().post(createCustomerPortalSession);

export default handler;
