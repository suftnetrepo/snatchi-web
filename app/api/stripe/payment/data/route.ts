import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/utils/connectDb';
import User from '@/app/api/models/user';
import Integrator from '@/app/api/models/integrator';
import Scheduler from '@/app/api/models/scheduler';
import { logger } from '@/app/api/utils/logger';

/**
 * GET /api/stripe/payment/data
 * 
 * Fetch payment modal data (engineer, integrators, etc.)
 * 
 * Query params:
 * - schedulerId: Booking ID
 * - engineerId: Engineer ID
 * - receivingIntegratorId: Engineer's company ID
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const schedulerId = searchParams.get('schedulerId');
    const engineerId = searchParams.get('engineerId');
    const receivingIntegratorId = searchParams.get('receivingIntegratorId');

    if (!schedulerId || !engineerId || !receivingIntegratorId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch engineer
    const engineer = await User.findById(engineerId).select('first_name last_name');
    if (!engineer) {
      return NextResponse.json({ error: 'Engineer not found' }, { status: 404 });
    }

    // Fetch receiving integrator
    const receivingIntegrator = await Integrator.findById(receivingIntegratorId).select(
      'name stripeConnectAccountId'
    );
    if (!receivingIntegrator) {
      return NextResponse.json(
        { error: 'Receiving integrator not found' },
        { status: 404 }
      );
    }

    // Fetch paying integrator
    const payingIntegrator = await Integrator.findById(session.user.integrator_id).select(
      'name stripeCustomerId'
    );
    if (!payingIntegrator) {
      return NextResponse.json(
        { error: 'Paying integrator not found' },
        { status: 404 }
      );
    }

    // Fetch scheduler
    const scheduler = await Scheduler.findById(schedulerId);
    if (!scheduler) {
      return NextResponse.json({ error: 'Scheduler not found' }, { status: 404 });
    }

    logger.info('Payment data loaded for modal', {
      engineerId,
      receivingIntegratorId,
      payingIntegratorId: session.user.integrator_id,
    });

    return NextResponse.json({
      engineer: {
        _id: engineer._id,
        first_name: engineer.first_name,
        last_name: engineer.last_name,
      },
      receivingIntegrator: {
        _id: receivingIntegrator._id,
        name: receivingIntegrator.name,
      },
      payingIntegrator: {
        _id: payingIntegrator._id,
        name: payingIntegrator.name,
      },
      scheduler: {
        _id: scheduler._id,
        title: scheduler.title,
      },
    });
  } catch (error) {
    logger.error('Error loading payment data', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to load payment data' },
      { status: 500 }
    );
  }
}
