import Stripe from 'stripe';
import { logger } from '../../utils/logger';
const { NextResponse } = require('next/server');

// POST handler to create a customer portal session
export async function POST(req) {
    try {
        // Initialize Stripe
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2020-08-27',
        });

        // Parse the request body
        const body = await req.json();
        const { stripeCustomerId } = body;

        // Create a Stripe Billing Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: process.env.NEXT_FRONTEND_URL,
        });

        // Return the session URL
        return NextResponse.json({ url: session.url }, { status: 200 });
    } catch (error) {
        // Log the error
        logger.error(error);

        // Return the error response
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
