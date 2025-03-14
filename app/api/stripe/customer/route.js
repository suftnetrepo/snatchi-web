import Stripe from 'stripe';
import { logger } from '../../utils/logger';
const { NextResponse } = require('next/server');

// POST handler
export async function POST(req) {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2020-08-27',
        });

        // Parse the request body
        const body = await req.json();
        const { email } = body;

        // Create a new Stripe customer
        const customer = await stripe.customers.create({
            email,
        });

        // Return the created customer
        return NextResponse.json({ data: customer }, { status: 200 });
    } catch (error) {
        // Log the error
        logger.error(error);

        // Return the error response
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
