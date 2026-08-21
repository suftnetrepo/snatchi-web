import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '../../../utils/logger';
import { recordAdminAudit, requireAdmin, validateAdminReason } from '../../../utils/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10'
});

/**
 * POST /api/admin/payments/retry-transfer
 * 
 * Admin-only endpoint to retry failed payment transfers
 * 
 * Body:
 * - paymentId: Payment document ID
 * 
 * Returns:
 * - transferId: If retry successful
 * - error: If retry failed
 */
export async function POST(req) {
  try {
    // 1. AUTHENTICATION & AUTHORIZATION
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { session } = auth;

    const { paymentId, reason } = await req.json();
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      );
    }
    const safeReason = validateAdminReason(reason);
    if (!safeReason) return NextResponse.json({ error: 'A reason between 8 and 500 characters is required' }, { status: 400 });

    // 2. FETCH PAYMENT
    const Payment = require('../../../models/payment');
    const payment = await Payment.findById(paymentId).populate('receivingIntegrator');

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // 3. VALIDATION: Check if payment can be retried
    const validationErrors = [];

    // Check payment status
    if (payment.paymentStatus !== 'succeeded') {
      validationErrors.push(
        `Cannot retry: payment status is ${payment.paymentStatus}, not succeeded`
      );
    }

    // Check if transfer already exists
    if (payment.transferId) {
      try {
        const existingTransfer = await stripe.transfers.retrieve(payment.transferId);
        if (existingTransfer.status === 'paid' || existingTransfer.status === 'in_transit') {
          validationErrors.push(
            `Transfer already exists and is ${existingTransfer.status}: ${payment.transferId}`
          );
        }
      } catch (err) {
        // Transfer doesn't exist in Stripe, safe to retry
        logger.info('Transfer not found in Stripe, safe to retry', {
          paymentId,
          transferId: payment.transferId
        });
      }
    }

    // Check charge exists
    if (!payment.chargeId) {
      validationErrors.push('Charge ID missing - cannot retry transfer');
    }

    // Check receiving integrator
    if (!payment.receivingIntegrator?.stripeConnectAccountId) {
      validationErrors.push('Receiving integrator Connect account missing');
    }

    // Check if integrator can receive transfers
    if (payment.receivingIntegrator?.payoutsEnabled === false) {
      validationErrors.push('Receiving integrator has payouts disabled');
    }

    if (validationErrors.length > 0) {
      logger.warn('Payment retry validation failed', {
        paymentId,
        errors: validationErrors
      });
      return NextResponse.json(
        { error: 'Retry not possible', details: validationErrors },
        { status: 400 }
      );
    }

    const lockCutoff = new Date(Date.now() - 5 * 60 * 1000);
    const locked = await Payment.findOneAndUpdate(
      {
        _id: paymentId,
        transferId: { $in: [null, ''] },
        $or: [{ transferRetryLockedAt: { $exists: false } }, { transferRetryLockedAt: { $lt: lockCutoff } }]
      },
      { $set: { transferRetryLockedAt: new Date(), transferRetryReason: safeReason } },
      { new: true }
    );
    if (!locked) {
      return NextResponse.json({ error: 'A transfer exists or another retry is already in progress' }, { status: 409 });
    }

    // 4. ATTEMPT TRANSFER
    let transfer;
    try {
      logger.info('Retrying transfer for payment', {
        paymentId,
        chargeId: payment.chargeId,
        netAmount: payment.netAmount,
        destinationAccountId: payment.receivingIntegrator.stripeConnectAccountId
      });

      transfer = await stripe.transfers.create({
        amount: payment.netAmount,
        currency: payment.currency?.toLowerCase() || 'gbp',
        destination: payment.receivingIntegrator.stripeConnectAccountId,
        source_transaction: payment.chargeId,
        description: `RETRY: Transfer for engineer service payment`,
        metadata: {
          paymentId: payment._id.toString(),
          retryAttempt: true,
          originalTransferId: payment.transferId || 'none',
          retryInitiatedBy: session.user?.id,
          retryTimestamp: new Date().toISOString()
        }
      }, { idempotencyKey: `admin-transfer-retry-${payment._id}-${payment.transferRetryCount || 0}` });

      logger.info('Transfer retry succeeded', {
        paymentId,
        transferId: transfer.id,
        amount: transfer.amount
      });
    } catch (stripeError) {
      logger.error('Transfer retry failed', {
        paymentId,
        error: stripeError.message,
        stripeErrorCode: stripeError.code
      });

      // Log alert for certain error types
      if (stripeError.code === 'insufficient_funds') {
        logger.error('ALERT: Insufficient funds for transfer', {
          paymentId,
          amount: payment.netAmount,
          destinationAccountId: payment.receivingIntegrator.stripeConnectAccountId
        });
      }

      if (stripeError.code === 'account_closed') {
        logger.error('ALERT: Destination account closed', {
          paymentId,
          accountId: payment.receivingIntegrator.stripeConnectAccountId
        });
      }

      await Payment.updateOne({ _id: paymentId }, { $unset: { transferRetryLockedAt: 1 } });
      await recordAdminAudit({ req, session,
        action: 'payment.transfer_retry', targetType: 'payment', targetId: paymentId,
        reason: safeReason, result: 'failure', metadata: { error: stripeError.message, code: stripeError.code }
      });

      return NextResponse.json(
        {
          error: 'Transfer failed',
          details: stripeError.message,
          code: stripeError.code
        },
        { status: 400 }
      );
    }

    // 5. UPDATE PAYMENT RECORD
    payment.transferId = transfer.id;
    payment.transferStatus = 'created';
    payment.transferInitiatedAt = new Date();
    payment.transferRetryCount = (payment.transferRetryCount || 0) + 1;
    payment.lastTransferRetryAt = new Date();
    payment.lastRetryInitiatedBy = session.user?.id;
    payment.transferRetryLockedAt = undefined;
    payment.transferRetryReason = safeReason;

    await payment.save();
    await recordAdminAudit({ req, session,
      action: 'payment.transfer_retry', targetType: 'payment', targetId: paymentId,
      reason: safeReason, metadata: { transferId: transfer.id, amount: transfer.amount }
    });

    logger.info('Payment updated after successful transfer retry', {
      paymentId,
      transferId: transfer.id,
      retryCount: payment.transferRetryCount
    });

    // 6. RESPONSE
    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      transferStatus: transfer.status,
      amount: transfer.amount,
      retryCount: payment.transferRetryCount
    });
  } catch (error) {
    logger.error('Transfer retry endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
