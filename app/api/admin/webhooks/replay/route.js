import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDb } from '@/utils/connectDb';
import { logger } from '../../../utils/logger';

/**
 * POST /api/admin/webhooks/replay
 * 
 * Admin-only endpoint to replay webhook events
 * Useful for recovery and testing
 * 
 * Body:
 * - paymentId: Payment ID to replay webhooks for
 * - eventTypes: Array of event types to replay ('payment_intent_succeeded', 'transfer_created', 'transfer_paid')
 * 
 * Returns:
 * - results: Object with replay results for each event type
 */
export async function POST(req) {
  try {
    // 1. AUTHENTICATION & AUTHORIZATION
    const session = await getServerSession(authOptions);
    if (!session) {
      logger.warn('Unauthorized webhook replay attempt - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user?.role !== 'admin') {
      logger.warn('Unauthorized webhook replay attempt - not admin', {
        userId: session.user?.id
      });
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    await connectDb();

    const { paymentId, eventTypes = [] } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      );
    }

    if (eventTypes.length === 0) {
      return NextResponse.json(
        { error: 'Event types required' },
        { status: 400 }
      );
    }

    // 2. FETCH PAYMENT
    const Payment = require('../../../models/payment');
    const payment = await Payment.findById(paymentId).populate('receivingIntegrator');

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    logger.info('Admin webhook replay initiated', {
      paymentId,
      eventTypes,
      initiatedBy: session.user?.id
    });

    // 3. REPLAY EVENTS
    const results = {
      paymentId,
      timestamp: new Date(),
      initiatedBy: session.user?.id,
      eventResults: {}
    };

    const WebhookAudit = require('../../../models/webhookAudit');

    // Helper to simulate webhook event processing
    const {
      handlePaymentIntentSucceeded,
      handleTransferCreated,
      handleTransferPaid
    } = require('../../../services/webHooksService');

    for (const eventType of eventTypes) {
      try {
        let result;

        if (eventType === 'payment_intent_succeeded') {
          // Construct simulated event
          const event = {
            type: 'payment_intent.succeeded',
            data: {
              object: {
                id: payment.paymentIntentId,
                status: 'succeeded',
                charges: {
                  data: [
                    {
                      id: payment.chargeId,
                      amount: payment.grossAmount,
                      currency: payment.currency,
                      status: 'succeeded'
                    }
                  ]
                }
              }
            }
          };

          await handlePaymentIntentSucceeded(event);
          result = { status: 'success', message: 'Payment intent succeeded event replayed' };

          logger.info('Replayed payment_intent.succeeded event', { paymentId });
        } else if (eventType === 'transfer_created') {
          if (!payment.transferId) {
            result = { status: 'skipped', message: 'No transfer ID - transfer not created yet' };
          } else {
            const event = {
              type: 'transfer.created',
              data: {
                object: {
                  id: payment.transferId,
                  destination: payment.receivingIntegrator.stripeConnectAccountId,
                  amount: payment.netAmount,
                  currency: payment.currency,
                  status: 'in_transit'
                }
              }
            };

            await handleTransferCreated(event);
            result = { status: 'success', message: 'Transfer created event replayed' };

            logger.info('Replayed transfer.created event', { paymentId, transferId: payment.transferId });
          }
        } else if (eventType === 'transfer_paid') {
          if (!payment.transferId) {
            result = { status: 'skipped', message: 'No transfer ID - transfer not created yet' };
          } else {
            const event = {
              type: 'transfer.paid',
              data: {
                object: {
                  id: payment.transferId,
                  destination: payment.receivingIntegrator.stripeConnectAccountId,
                  amount: payment.netAmount,
                  currency: payment.currency,
                  status: 'paid'
                }
              }
            };

            await handleTransferPaid(event);
            result = { status: 'success', message: 'Transfer paid event replayed' };

            logger.info('Replayed transfer.paid event', { paymentId, transferId: payment.transferId });
          }
        } else {
          result = { status: 'error', message: `Unknown event type: ${eventType}` };
        }

        results.eventResults[eventType] = result;
      } catch (eventError) {
        logger.error('Webhook replay event error', {
          paymentId,
          eventType,
          error: eventError.message
        });

        results.eventResults[eventType] = {
          status: 'error',
          message: eventError.message
        };
      }
    }

    // 4. AUDIT LOG
    await WebhookAudit.create({
      type: 'admin_replay',
      paymentId,
      eventTypes,
      initiatedBy: session.user?.id,
      results,
      createdAt: new Date()
    });

    logger.info('Webhook replay completed', {
      paymentId,
      eventTypes,
      results
    });

    return NextResponse.json(results);
  } catch (error) {
    logger.error('Webhook replay endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
