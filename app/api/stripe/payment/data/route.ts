import { NextResponse } from 'next/server';
import { mongoConnect } from '@/utils/connectDb';
import User from '@/app/api/models/user';
import Integrator from '@/app/api/models/integrator';
import Scheduler from '@/app/api/models/scheduler';
import { logger } from '@/app/api/utils/logger';
import {
  getScheduleReceivingIntegratorId,
  getSchedulePayingIntegratorId
} from '@/app/api/services/scheduler';
import { getUserSession } from '@/utils/generateToken';
import { validateReceivingIntegrator } from '@/app/api/services/stripeMarketplaceService';
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
    const session = await getUserSession(req);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const actor = {
      userId: session.id,
      role: session.role,
      integratorId: session.integrator,
    };

    if (actor.role !== 'integrator') {
      return NextResponse.json({ success: false, error: 'Only integrators can access payment data' }, { status: 403 });
    }

    await mongoConnect();

    const { searchParams } = new URL(req.url);
    const schedulerId = searchParams.get('schedulerId');
    const engineerId = searchParams.get('engineerId');
    const receivingIntegratorId = searchParams.get('receivingIntegratorId');

    if (!schedulerId || !engineerId || !receivingIntegratorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch engineer
    const engineer = await User.findById(engineerId).select('first_name last_name');
    if (!engineer) {
      return NextResponse.json({ success: false, error: 'Engineer not found' }, { status: 404 });
    }

    // Fetch receiving integrator
    const receivingIntegrator = await Integrator.findById(receivingIntegratorId).select(
      'name stripeConnectAccountId'
    );
    if (!receivingIntegrator) {
      return NextResponse.json(
        { success: false, error: 'Receiving integrator not found' },
        { status: 404 }
      );
    }

    // Fetch paying integrator
    const payingIntegrator = await Integrator.findById(actor.integratorId).select(
      'name stripeCustomerId'
    );
    if (!payingIntegrator) {
      return NextResponse.json(
        { success: false, error: 'Paying integrator not found' },
        { status: 404 }
      );
    }

    // Fetch scheduler
    const scheduler = await Scheduler.findById(schedulerId);
    if (!scheduler) {
      return NextResponse.json({ success: false, error: 'Scheduler not found' }, { status: 404 });
    }

    const schedulePayingIntegratorId = getSchedulePayingIntegratorId(scheduler);
    const scheduleReceivingIntegratorId = getScheduleReceivingIntegratorId(scheduler);

    if (!actor.integratorId || actor.integratorId.toString() !== schedulePayingIntegratorId) {
      return NextResponse.json(
        { success: false, error: 'Only the paying integrator can access this payment data' },
        { status: 403 }
      );
    }

    if (scheduleReceivingIntegratorId !== receivingIntegratorId) {
      return NextResponse.json(
        { success: false, error: 'Receiving integrator does not match this schedule' },
        { status: 400 }
      );
    }

    if (scheduleReceivingIntegratorId === schedulePayingIntegratorId) {
      return NextResponse.json(
        { success: false, error: 'Cannot create self-payment for this schedule' },
        { status: 400 }
      );
    }

    try {
      validateReceivingIntegrator(receivingIntegrator);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Receiving integrator is not payment ready'
        },
        { status: 400 }
      );
    }

    logger.info('Payment data loaded for modal', {
      engineerId,
      receivingIntegratorId,
      payingIntegratorId: actor.integratorId,
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
      { success: false, error: 'Failed to load payment data' },
      { status: 500 }
    );
  }
}
