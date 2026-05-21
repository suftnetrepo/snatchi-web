import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDb } from '@/utils/connectDb';
import { logger } from '../../../utils/logger';

/**
 * GET /api/admin/payments/failures
 * 
 * Admin-only endpoint to fetch failed payments
 * Returns orphaned, pending retry, and webhook-failed payments
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDb();

    const Payment = require('../../../models/payment');

    // Query for failed payments
    const failures = await Payment.find({
      $or: [
        // Orphaned: payment succeeded but no transfer
        {
          paymentStatus: 'succeeded',
          transferId: { $exists: false }
        },
        // Pending retry: transfer failed
        {
          transferStatus: 'pending_retry'
        },
        // Webhook failed
        {
          transferStatus: 'webhook_failed'
        },
        // Failed payment intent
        {
          paymentStatus: 'failed'
        }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('receivingIntegrator', 'name platformFeePercentage');

    // Format response
    const failuresList = failures.map(payment => ({
      _id: payment._id,
      paymentIntentId: payment.paymentIntentId,
      chargeId: payment.chargeId,
      transferId: payment.transferId,
      paymentStatus: payment.paymentStatus,
      transferStatus: payment.transferStatus,
      grossAmount: payment.grossAmount,
      netAmount: payment.netAmount,
      platformFeeAmount: payment.platformFeeAmount,
      currency: payment.currency,
      createdAt: payment.createdAt,
      error: determineErrorMessage(payment),
      reconciliationErrors: []
    }));

    logger.info('Failures list retrieved', {
      count: failuresList.length,
      requestedBy: session.user?.id
    });

    return NextResponse.json({
      failures: failuresList,
      timestamp: new Date(),
      stats: {
        total: failuresList.length,
        orphaned: failuresList.filter(p => p.paymentStatus === 'succeeded' && !p.transferId).length,
        pendingRetry: failuresList.filter(p => p.transferStatus === 'pending_retry').length,
        webhookFailed: failuresList.filter(p => p.transferStatus === 'webhook_failed').length
      }
    });
  } catch (error) {
    logger.error('Failures endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Determine human-readable error message based on payment state
 */
function determineErrorMessage(payment) {
  if (payment.paymentStatus === 'succeeded' && !payment.transferId) {
    return 'ORPHANED: Transfer not created';
  }

  if (payment.transferStatus === 'pending_retry') {
    return 'Pending retry - transfer failed';
  }

  if (payment.transferStatus === 'webhook_failed') {
    return 'Webhook processing failed';
  }

  if (payment.paymentStatus === 'failed') {
    return 'Payment intent failed';
  }

  return 'Unknown error';
}
