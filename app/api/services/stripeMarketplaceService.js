/* eslint-disable linebreak-style */
/**
 * Stripe Marketplace Service
 * Handles cross-integrator engineer service payments
 * 
 * Flow:
 * 1. Determine receiving integrator (engineer's owner)
 * 2. Validate receiving integrator is ready (Connect verified)
 * 3. Create payment intent on Stripe
 * 4. Charge paying integrator
 * 5. Deduct platform fee
 * 6. Transfer remaining amount to receiving integrator
 */

import Stripe from 'stripe';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

/**
 * Determine which integrator should receive the payment
 * = The engineer's owning integrator
 * @param {Object} engineer - Engineer user document
 * @returns {Object} Receiving integrator ID and reference
 */
export const determineReceivingIntegrator = (engineer) => {
  try {
    if (!engineer || !engineer.integrator) {
      throw new Error('Engineer has no associated integrator');
    }

    return {
      integratorId: engineer.integrator,
      engineerName: `${engineer.first_name} ${engineer.last_name}`
    };
  } catch (error) {
    logger.error('Error determining receiving integrator', {
      error: error.message,
      engineerId: engineer?._id
    });
    throw error;
  }
};

/**
 * Validate that receiving integrator is ready to receive payments
 * Must have verified Stripe Connect account
 * @param {Object} receivingIntegrator - Integrator document
 * @returns {boolean} True if ready
 * @throws {Error} If not ready
 */
export const validateReceivingIntegrator = (receivingIntegrator) => {
  try {
    if (!receivingIntegrator) {
      throw new Error('Receiving integrator not found');
    }

    if (!receivingIntegrator.stripeConnectAccountId) {
      throw new Error(
        `${receivingIntegrator.name} has not set up Stripe Connect. They cannot receive payments yet.`
      );
    }

    if (receivingIntegrator.connectAccountStatus !== 'verified') {
      throw new Error(
        `${receivingIntegrator.name}'s Stripe Connect account is not verified (${receivingIntegrator.connectAccountStatus})`
      );
    }

    if (!receivingIntegrator.chargesEnabled) {
      throw new Error(`${receivingIntegrator.name}'s account cannot process payments`);
    }

    if (!receivingIntegrator.payoutsEnabled) {
      throw new Error(`${receivingIntegrator.name}'s account cannot receive payouts`);
    }

    logger.info('Receiving integrator validation passed', {
      integratorId: receivingIntegrator._id,
      name: receivingIntegrator.name
    });

    return true;
  } catch (error) {
    logger.error('Receiving integrator validation failed', {
      error: error.message,
      integratorId: receivingIntegrator?._id
    });
    throw error;
  }
};

/**
 * Calculate platform fee
 * @param {number} grossAmount - Total amount charged
 * @param {number} feePercentage - Platform fee percentage (e.g., 10)
 * @returns {Object} { platformFeeAmount, netAmount }
 */
export const calculatePlatformFee = (grossAmount, feePercentage = 10) => {
  try {
    if (grossAmount < 0) {
      throw new Error('Gross amount cannot be negative');
    }

    if (feePercentage < 0 || feePercentage > 100) {
      throw new Error('Fee percentage must be between 0 and 100');
    }

    const platformFeeAmount = Math.round((grossAmount * feePercentage) / 100);
    const netAmount = grossAmount - platformFeeAmount;

    logger.debug('Platform fee calculated', {
      grossAmount,
      feePercentage,
      platformFeeAmount,
      netAmount
    });

    return {
      platformFeeAmount,
      netAmount,
      feePercentage
    };
  } catch (error) {
    logger.error('Error calculating platform fee', {
      error: error.message,
      grossAmount,
      feePercentage
    });
    throw error;
  }
};

/**
 * Create a payment intent for cross-integrator engineer payment
 * @param {Object} params
 *   - payingIntegrator: Integrator paying for engineer
 *   - receivingIntegrator: Integrator receiving payment
 *   - engineer: Engineer being paid for
 *   - grossAmount: Total amount in pence/cents
 *   - scheduler: Scheduler reference
 * @returns {Object} Stripe PaymentIntent
 */
export const createCrossIntegratorPaymentIntent = async (params) => {
  try {
    const {
      payingIntegrator,
      receivingIntegrator,
      engineer,
      grossAmount,
      scheduler
    } = params;

    if (!payingIntegrator?.stripeCustomerId) {
      throw new Error('Paying integrator has no Stripe customer ID');
    }

    const { platformFeeAmount, netAmount } = calculatePlatformFee(
      grossAmount,
      receivingIntegrator.platformFeePercentage || 10
    );

    logger.info('Creating cross-integrator payment intent', {
      payingIntegratorId: payingIntegrator._id,
      receivingIntegratorId: receivingIntegrator._id,
      engineerId: engineer._id,
      grossAmount,
      platformFeeAmount,
      netAmount
    });

    const CURRENCY_SYMBOL_MAP = { '£': 'gbp', '$': 'usd', '€': 'eur', '¥': 'jpy' };
    const rawCurrency = payingIntegrator.currency?.toLowerCase() || 'gbp';
    const currency = CURRENCY_SYMBOL_MAP[payingIntegrator.currency] || rawCurrency;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: grossAmount,
        currency,
        customer: payingIntegrator.stripeCustomerId,
        payment_method_types: ['card'],
        description: `Engineer service: ${engineer.first_name} ${engineer.last_name} for ${payingIntegrator.name}`,
        metadata: {
          payingIntegratorId: payingIntegrator._id.toString(),
          receivingIntegratorId: receivingIntegrator._id.toString(),
          engineerId: engineer._id.toString(),
          schedulerId: scheduler?._id?.toString(),
          platformFeeAmount: String(platformFeeAmount),
          netAmount: String(netAmount),
          receivingIntegratorConnectId: receivingIntegrator.stripeConnectAccountId,
          serviceType: 'engineer_booking'
        }
      },
      {
        idempotency_key: `payment_${payingIntegrator._id}_${scheduler._id}_${Date.now()}`
      }
    );

    logger.info('Payment intent created successfully', {
      paymentIntentId: paymentIntent.id,
      payingIntegratorId: payingIntegrator._id
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to create payment intent', {
      error: error.message,
      payingIntegratorId: params.payingIntegrator?._id,
      receivingIntegratorId: params.receivingIntegrator?._id
    });
    throw error;
  }
};

/**
 * Confirm and complete a cross-integrator payment
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Object} Confirmed PaymentIntent
 */
export const confirmCrossIntegratorPayment = async (paymentIntentId) => {
  try {
    logger.info('Confirming cross-integrator payment', {
      paymentIntentId
    });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      logger.info('Payment already succeeded', {
        paymentIntentId
      });
      return paymentIntent;
    }

    if (paymentIntent.status === 'requires_action') {
      throw new Error(
        'Payment requires additional action. Client secret needed for 3D Secure or other verification.'
      );
    }

    logger.info('Payment intent confirmed', {
      paymentIntentId,
      status: paymentIntent.status
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to confirm payment', {
      error: error.message,
      paymentIntentId
    });
    throw error;
  }
};

/**
 * Create a transfer to receiving integrator's Connect account
 * Part of Model 2: Separate Charges & Transfers architecture
 * 
 * Flow:
 * 1. Charge created on platform account for FULL amount (grossAmount)
 * 2. Platform receives payment and retains platform fee
 * 3. This function transfers NET amount to receiving integrator's Express account
 * 4. Receiving integrator can then withdraw to their bank account
 * 
 * Example (£100 charge, 10% platform fee):
 * - Charge: £100 on platform account
 * - Transfer: £90 to receiving integrator (this function)
 * - Platform retains: £10 (automatic, no transfer needed)
 * 
 * @param {Object} params
 *   - chargeId: Stripe Charge ID (the charge that was just created)
 *   - receivingIntegratorConnectId: Receiving integrator's Express Connect account ID
 *   - netAmount: Amount to transfer (after platform fee deduction)
 * @returns {Object} Stripe Transfer object with id, status, destination
 */
export const createTransferToReceivingIntegrator = async (params) => {
  try {
    const { chargeId, receivingIntegratorConnectId, netAmount } = params;

    if (!chargeId) {
      throw new Error('Charge ID is required');
    }

    if (!receivingIntegratorConnectId) {
      throw new Error('Receiving integrator Connect ID is required');
    }

    if (netAmount <= 0) {
      throw new Error('Transfer amount must be greater than 0');
    }

    logger.info('Creating transfer to receiving integrator', {
      chargeId,
      receivingIntegratorConnectId,
      netAmount
    });

    const transfer = await stripe.transfers.create({
      amount: netAmount,
      currency: 'gbp',
      destination: receivingIntegratorConnectId,
      source_transaction: chargeId,
      description: 'Snatchi marketplace engineer service payment transfer'
    });

    logger.info('Transfer created successfully', {
      transferId: transfer.id,
      chargeId,
      netAmount
    });

    return transfer;
  } catch (error) {
    logger.error('Failed to create transfer', {
      error: error.message,
      chargeId: params.chargeId,
      receivingIntegratorConnectId: params.receivingIntegratorConnectId
    });
    throw error;
  }
};

/**
 * Handle transfer completion (for webhook processing)
 * Called when transfer.paid webhook received
 * @param {string} transferId - Stripe Transfer ID
 * @returns {Object} Transfer object
 */
export const handleTransferPaid = async (transferId) => {
  try {
    logger.info('Handling transfer paid event', {
      transferId
    });

    const transfer = await stripe.transfers.retrieve(transferId);

    if (transfer.status !== 'paid') {
      logger.warn('Transfer not in paid status', {
        transferId,
        status: transfer.status
      });
    }

    logger.info('Transfer paid successfully', {
      transferId,
      destination: transfer.destination,
      amount: transfer.amount
    });

    return transfer;
  } catch (error) {
    logger.error('Error handling transfer paid', {
      error: error.message,
      transferId
    });
    throw error;
  }
};

export default {
  determineReceivingIntegrator,
  validateReceivingIntegrator,
  calculatePlatformFee,
  createCrossIntegratorPaymentIntent,
  confirmCrossIntegratorPayment,
  createTransferToReceivingIntegrator,
  handleTransferPaid
};
