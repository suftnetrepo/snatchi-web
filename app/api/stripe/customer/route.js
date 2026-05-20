import Stripe from 'stripe';
import { logger } from '../../utils/logger';
const { NextResponse } = require('next/server');

// POST handler
export async function POST(req) {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-04-10',
        });

        // Parse the request body
        const body = await req.json();
        const { email, name, contact } = body;

        // Check if customer already exists for this email
        const existingCustomers = await stripe.customers.search({
            query: `email:"${email}"`
        });

        if (existingCustomers.data.length > 0) {
            logger.warn(`Customer already exists for email: ${email}`);
            return NextResponse.json(
                { data: existingCustomers.data[0] },
                { status: 200 }
            );
        }

        // Create a new Stripe customer with metadata
        const customer = await stripe.customers.create({
            email,
            name: name || contact || '',
            metadata: {
                createdAt: new Date().toISOString()
            }
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
