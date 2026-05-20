/* eslint-disable linebreak-style */
/**
 * GET /api/stripe/payment/status
 * Get current payment status
 * 
 * Query params:
 * ?paymentIntentId=... OR ?paymentId=...
 * 
 * Returns:
 * {
 *   paymentId: string,
 *   paymentIntentId: string,
 *   paymentStatus: string,
 *   transferStatus: string,
 *   amounts: { grossAmount, platformFeeAmount, netAmount },
 *   timeline: { paymentInitiatedAt, paymentSucceededAt, ... }
 * }
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { logger } from '../../../utils/logger';
import { connectDb } from '../../../../utils/connectDb';
import Payment from '../../../models/payment';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      logger.warn('Unauthorized status check - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paymentIntentId = searchParams.get('paymentIntentId');
    const paymentId = searchParams.get('paymentId');

    if (!paymentIntentId && !paymentId) {
      return NextResponse.json(
        { error: 'paymentIntentId or paymentId required' },
        { status: 400 }
      );
    }

    await connectDb();

    let payment;
    if (paymentIntentId) {
      payment = await Payment.findOne({ paymentIntentId }).populate([
        'payingIntegrator',
        'receivingIntegrator',
        'engineer',
        'scheduler'
      ]);
    } else {
      payment = await Payment.findById(paymentId).populate([
        'payingIntegrator',
        'receivingIntegrator',
        'engineer',
        'scheduler'
      ]);
    }

    if (!payment) {
      logger.warn('Payment not found', { paymentIntentId, paymentId });
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify user is authorized (paying or receiving integrator)
    const isAuthorized =
      payment.payingIntegrator._id.toString() === session.user.integrator_id ||
      payment.receivingIntegrator._id.toString() === session.user.integrator_id;

    if (!isAuthorized) {
      logger.warn('User not authorized to view payment', {
        paymentId: payment._id,
        userId: session.user.id
      });
      return NextResponse.json(
        { error: 'Unauthorized to view this payment' },
        { status: 403 }
      );
    }

    logger.info('Payment status retrieved', {
      paymentId: payment._id,
      paymentStatus: payment.paymentStatus
    });

    return NextResponse.json({
      paymentId: payment._id,
      paymentIntentId: payment.paymentIntentId,
      paymentStatus: payment.paymentStatus,
      transferStatus: payment.transferStatus,
      amounts: {
        grossAmount: payment.grossAmount,
        platformFeeAmount: payment.platformFeeAmount,
        netAmount: payment.netAmount
      },
      parties: {
        payingIntegrator: {
          name: payment.payingIntegrator.name,
          email: payment.payingIntegrator.email
        },
        receivingIntegrator: {
          name: payment.receivingIntegrator.name,
          email: payment.receivingIntegrator.email
        },
        engineer: {
          name: `${payment.engineer.first_name} ${payment.engineer.last_name}`,
          email: payment.engineer.email
        }
      },
      timeline: {
        paymentInitiatedAt: payment.paymentInitiatedAt,
        paymentSucceededAt: payment.paymentSucceededAt,
        transferInitiatedAt: payment.transferInitiatedAt,
        transferPaidAt: payment.transferPaidAt
      },
      scheduler: payment.scheduler && {
        id: payment.scheduler._id,
        title: payment.scheduler.title,
        startDate: payment.scheduler.startDate,
        endDate: payment.scheduler.endDate
      }
    });
  } catch (error) {
    logger.error('Payment status retrieval failed', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: 'Failed to retrieve payment status' },
      { status: 500 }
    );
  }
}
