import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDb } from '@/utils/connectDb';
import Stripe from 'stripe';
import { logger } from '../../../../utils/logger';
import { reconcilePayment } from '../../../../services/paymentReconciliationService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10'
});

/**
 * GET /api/admin/payments/investigate/[paymentId]
 * 
 * Admin-only endpoint to investigate a specific payment
 * Returns comprehensive payment investigation data
 */
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDb();

    const { paymentId } = params;
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    // 1. FETCH PAYMENT
    const Payment = require('../../../../models/payment');
    const WebhookAudit = require('../../../../models/webhookAudit');

    const payment = await Payment.findById(paymentId)
      .populate('payingIntegrator')
      .populate('receivingIntegrator')
      .populate('engineer');

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // 2. FETCH STRIPE RESOURCES
    let stripeCharge = null;
    let stripeTransfer = null;

    try {
      if (payment.chargeId) {
        stripeCharge = await stripe.charges.retrieve(payment.chargeId);
      }
    } catch (err) {
      logger.warn('Failed to retrieve charge', { chargeId: payment.chargeId, error: err.message });
    }

    try {
      if (payment.transferId) {
        stripeTransfer = await stripe.transfers.retrieve(payment.transferId);
      }
    } catch (err) {
      logger.warn('Failed to retrieve transfer', { transferId: payment.transferId, error: err.message });
    }

    // 3. RECONCILE PAYMENT
    const reconciliation = await reconcilePayment(payment, stripe);

    // 4. FETCH WEBHOOK HISTORY
    const webhookHistory = await WebhookAudit.find({
      paymentId: payment._id
    })
      .sort({ createdAt: -1 })
      .limit(50);

    // 5. CONSTRUCT RESPONSE
    return NextResponse.json({
      payment: {
        _id: payment._id,
        paymentIntentId: payment.paymentIntentId,
        payingIntegrator: payment.payingIntegrator,
        receivingIntegrator: {
          _id: payment.receivingIntegrator._id,
          name: payment.receivingIntegrator.name,
          stripeConnectAccountId: payment.receivingIntegrator.stripeConnectAccountId,
          platformFeePercentage: payment.receivingIntegrator.platformFeePercentage
        },
        engineer: payment.engineer ? {
          _id: payment.engineer._id,
          first_name: payment.engineer.first_name,
          last_name: payment.engineer.last_name
        } : null,
        grossAmount: payment.grossAmount,
        netAmount: payment.netAmount,
        platformFeeAmount: payment.platformFeeAmount,
        currency: payment.currency,
        paymentStatus: payment.paymentStatus,
        transferStatus: payment.transferStatus,
        chargeId: payment.chargeId,
        transferId: payment.transferId,
        paymentIntentId: payment.paymentIntentId,
        paymentSucceededAt: payment.paymentSucceededAt,
        transferInitiatedAt: payment.transferInitiatedAt,
        transferPaidAt: payment.transferPaidAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        transferRetryCount: payment.transferRetryCount || 0,
        lastTransferRetryAt: payment.lastTransferRetryAt
      },
      reconciliation,
      stripeCharge: stripeCharge ? {
        id: stripeCharge.id,
        amount: stripeCharge.amount,
        currency: stripeCharge.currency,
        status: stripeCharge.status,
        customer: stripeCharge.customer,
        created: stripeCharge.created,
        description: stripeCharge.description,
        failure_message: stripeCharge.failure_message,
        on_behalf_of: stripeCharge.on_behalf_of
      } : null,
      stripeTransfer: stripeTransfer ? {
        id: stripeTransfer.id,
        amount: stripeTransfer.amount,
        currency: stripeTransfer.currency,
        destination: stripeTransfer.destination,
        status: stripeTransfer.status,
        created: stripeTransfer.created,
        failure_reason: stripeTransfer.failure_reason,
        source_transaction: stripeTransfer.source_transaction
      } : null,
      webhookHistory: webhookHistory.map(h => ({
        _id: h._id,
        type: h.type,
        eventId: h.eventId,
        status: h.status,
        error: h.error,
        timestamp: h.createdAt
      }))
    });
  } catch (error) {
    logger.error('Investigation endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
