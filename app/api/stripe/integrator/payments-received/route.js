/* eslint-disable linebreak-style */
/**
 * GET /api/stripe/integrator/payments-received
 * Get payments received by this integrator (as the receiving party)
 * when other integrators paid for this integrator's engineers
 * 
 * Query params:
 * ?status=succeeded&limit=20&offset=0
 * 
 * Returns:
 * {
 *   payments: [
 *     {
 *       paymentId,
 *       engineer,
 *       payingIntegrator,
 *       amount,
 *       status,
 *       date
 *     }
 *   ],
 *   total: number,
 *   totalAmount: number
 * }
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { logger } from '../../../utils/logger';
import { mongoConnect } from '../../../../../utils/connectDb';
import Payment from '../../../models/payment';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      logger.warn('Unauthorized payments-received check - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'integrator') {
      return NextResponse.json(
        { error: 'Only integrators can view payments received' },
        { status: 403 }
      );
    }

    const receivingIntegratorId = session.user.integrator_id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'succeeded';
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100);
    const offset = parseInt(searchParams.get('offset')) || 0;

    await mongoConnect();

    const query = {
      receivingIntegrator: receivingIntegratorId,
      paymentStatus: status
    };

    // Get total count
    const total = await Payment.countDocuments(query);

    // Get payments
    const payments = await Payment.find(query)
      .populate('payingIntegrator', 'name email')
      .populate('engineer', 'first_name last_name email')
      .populate('scheduler', 'title startDate endDate')
      .sort({ paymentSucceededAt: -1 })
      .limit(limit)
      .skip(offset);

    // Calculate total amount received
    const totalAmount = payments.reduce((sum, p) => sum + p.netAmount, 0);

    logger.info('Payments received fetched', {
      integratorId: receivingIntegratorId,
      status,
      count: payments.length,
      total
    });

    return NextResponse.json({
      payments: payments.map(p => ({
        paymentId: p._id,
        paymentIntentId: p.paymentIntentId,
        engineer: {
          id: p.engineer._id,
          name: `${p.engineer.first_name} ${p.engineer.last_name}`,
          email: p.engineer.email
        },
        payingIntegrator: {
          id: p.payingIntegrator._id,
          name: p.payingIntegrator.name,
          email: p.payingIntegrator.email
        },
        booking: p.scheduler && {
          id: p.scheduler._id,
          title: p.scheduler.title,
          startDate: p.scheduler.startDate,
          endDate: p.scheduler.endDate
        },
        amounts: {
          gross: p.grossAmount,
          fee: p.platformFeeAmount,
          net: p.netAmount
        },
        status: p.paymentStatus,
        transferStatus: p.transferStatus,
        date: p.paymentSucceededAt,
        createdAt: p.createdAt
      })),
      pagination: {
        total,
        count: payments.length,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      summary: {
        totalReceived: totalAmount,
        currency: 'gbp'
      }
    });
  } catch (error) {
    logger.error('Payments received retrieval failed', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: 'Failed to retrieve payments received' },
      { status: 500 }
    );
  }
}
