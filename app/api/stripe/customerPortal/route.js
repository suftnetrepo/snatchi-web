import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { mongoConnect } from '@/utils/connectDb';
import Integrator from '../../models/integrator';
import { logger } from '../../utils/logger';

export async function POST(req) {
  try {
    const user = await getUserSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['integrator', 'manager'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await mongoConnect();
    const integrator = await Integrator.findById(user.integrator).select('stripeCustomerId').lean();
    if (!integrator?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe billing account is connected to this organisation' }, { status: 409 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
    const session = await stripe.billingPortal.sessions.create({
      customer: integrator.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/protected/integrator/settings`
    });
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ error: 'Unable to open the Stripe billing portal' }, { status: 500 });
  }
}
