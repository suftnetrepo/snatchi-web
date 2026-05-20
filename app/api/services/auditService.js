/* eslint-disable linebreak-style */
/**
 * Audit Service
 * Logs all payment-related operations for audit trail and debugging
 */

import { logger } from '../utils/logger';

/**
 * Log payment creation
 */
export const logPaymentCreated = (payment, user) => {
  try {
    logger.info('Payment created', {
      paymentId: payment._id,
      paymentIntentId: payment.paymentIntentId,
      payingIntegratorId: payment.payingIntegrator,
      receivingIntegratorId: payment.receivingIntegrator,
      engineerId: payment.engineer,
      grossAmount: payment.grossAmount,
      netAmount: payment.netAmount,
      platformFeeAmount: payment.platformFeeAmount,
      userId: user.id,
      userRole: user.role,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error logging payment created', {
      error: error.message,
      paymentId: payment?._id
    });
  }
};

/**
 * Log successful payment
 */
export const logPaymentSucceeded = (payment) => {
  try {
    logger.info('Payment succeeded', {
      paymentId: payment._id,
      paymentIntentId: payment.paymentIntentId,
      chargeId: payment.chargeId,
      payingIntegratorId: payment.payingIntegrator,
      receivingIntegratorId: payment.receivingIntegrator,
      grossAmount: payment.grossAmount,
      netAmount: payment.netAmount,
      timestamp: payment.paymentSucceededAt
    });
  } catch (error) {
    logger.error('Error logging payment succeeded', {
      error: error.message,
      paymentId: payment?._id
    });
  }
};

/**
 * Log failed payment
 */
export const logPaymentFailed = (payment, error) => {
  try {
    logger.warn('Payment failed', {
      paymentId: payment._id,
      paymentIntentId: payment.paymentIntentId,
      failureCode: payment.chargeFailureCode,
      failureMessage: payment.chargeFailureMessage,
      failureAttempts: payment.chargeFailureAttempts,
      grossAmount: payment.grossAmount,
      error: error?.message,
      timestamp: new Date()
    });
  } catch (logError) {
    logger.error('Error logging payment failed', {
      error: logError.message,
      paymentId: payment?._id
    });
  }
};

/**
 * Log transfer creation
 */
export const logTransferCreated = (payment, transfer) => {
  try {
    logger.info('Transfer created for payment', {
      paymentId: payment._id,
      transferId: transfer.id,
      chargeId: transfer.source_transaction,
      receivingIntegratorId: payment.receivingIntegrator,
      netAmount: transfer.amount,
      destination: transfer.destination,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error logging transfer created', {
      error: error.message,
      paymentId: payment?._id
    });
  }
};

/**
 * Log transfer completion
 */
export const logTransferPaid = (payment, transfer) => {
  try {
    logger.info('Transfer paid to receiving integrator', {
      paymentId: payment._id,
      transferId: transfer.id,
      destination: transfer.destination,
      amount: transfer.amount,
      status: transfer.status,
      paidAt: payment.transferPaidAt,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error logging transfer paid', {
      error: error.message,
      paymentId: payment?._id
    });
  }
};

/**
 * Log payment validation
 */
export const logValidationError = (field, reason, context) => {
  try {
    logger.warn('Payment validation error', {
      field,
      reason,
      context,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error logging validation error', {
      error: error.message
    });
  }
};

/**
 * Log payment status change
 */
export const logStatusChange = (paymentId, previousStatus, newStatus, reason) => {
  try {
    logger.info('Payment status changed', {
      paymentId,
      previousStatus,
      newStatus,
      reason,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error logging status change', {
      error: error.message,
      paymentId
    });
  }
};

/**
 * Log platform fee calculation
 */
export const logFeeCalculation = (grossAmount, feePercentage, platformFeeAmount, netAmount) => {
  try {
    logger.debug('Platform fee calculated', {
      grossAmount,
      feePercentage,
      platformFeeAmount,
      netAmount,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error logging fee calculation', {
      error: error.message
    });
  }
};

/**
 * Log integrator validation
 */
export const logIntegratorValidation = (integratorId, validationResult, reason) => {
  try {
    logger.info('Integrator validation', {
      integratorId,
      valid: validationResult,
      reason,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error logging integrator validation', {
      error: error.message,
      integratorId
    });
  }
};

/**
 * Log engineer validation
 */
export const logEngineerValidation = (engineerId, validationResult, reason) => {
  try {
    logger.info('Engineer validation', {
      engineerId,
      valid: validationResult,
      reason,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error logging engineer validation', {
      error: error.message,
      engineerId
    });
  }
};

export default {
  logPaymentCreated,
  logPaymentSucceeded,
  logPaymentFailed,
  logTransferCreated,
  logTransferPaid,
  logValidationError,
  logStatusChange,
  logFeeCalculation,
  logIntegratorValidation,
  logEngineerValidation
};
