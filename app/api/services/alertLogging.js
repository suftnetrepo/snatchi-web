import { logger } from '../utils/logger';

/**
 * Alert Logging Service
 * Provides structured logging for operational alerts
 * 
 * Alert levels:
 * - CRITICAL: System requires immediate attention (e.g., orphaned payments)
 * - ERROR: Operation failed and requires investigation
 * - WARNING: Unusual condition that may indicate issue
 * - INFO: Informational event for audit trail
 */

export const alertLog = {
  /**
   * Failed Transfer - transfer.create failed
   */
  failedTransfer: (paymentId, error, context = {}) => {
    logger.error('ALERT: Transfer creation failed', {
      alert: 'failed_transfer',
      severity: 'ERROR',
      paymentId,
      error: error.message,
      errorCode: error.code,
      ...context
    });
  },

  /**
   * Duplicate Transfer Attempt - webhook triggered twice
   */
  duplicateTransferAttempt: (paymentId, transferId, context = {}) => {
    logger.warn('ALERT: Duplicate transfer attempt detected', {
      alert: 'duplicate_transfer_attempt',
      severity: 'WARNING',
      paymentId,
      existingTransferId: transferId,
      ...context
    });
  },

  /**
   * Orphaned Payment - succeeded but no transfer
   */
  orphanedPayment: (paymentId, chargeId, context = {}) => {
    logger.error('ALERT: CRITICAL - Orphaned payment detected', {
      alert: 'orphaned_payment',
      severity: 'CRITICAL',
      paymentId,
      chargeId,
      message: 'Payment succeeded but transfer was never created',
      ...context
    });
  },

  /**
   * Missing Transfer - payment shows transfer ID but it does not exist in Stripe
   */
  missingTransfer: (paymentId, transferId, context = {}) => {
    logger.error('ALERT: Missing transfer in Stripe', {
      alert: 'missing_transfer',
      severity: 'ERROR',
      paymentId,
      transferId,
      message: 'Transfer recorded in database but not found in Stripe',
      ...context
    });
  },

  /**
   * Webhook Processing Failure
   */
  webhookProcessingFailed: (eventType, paymentId, error, context = {}) => {
    logger.error('ALERT: Webhook processing failed', {
      alert: 'webhook_processing_failed',
      severity: 'ERROR',
      eventType,
      paymentId,
      error: error.message,
      ...context
    });
  },

  /**
   * Reconciliation Mismatch - charge/transfer/fee amounts don't match
   */
  reconciliationMismatch: (paymentId, details, context = {}) => {
    logger.error('ALERT: Reconciliation mismatch detected', {
      alert: 'reconciliation_mismatch',
      severity: 'ERROR',
      paymentId,
      details,
      ...context
    });
  },

  /**
   * Transfer Amount Mismatch - transfer amount != expected net amount
   */
  transferAmountMismatch: (paymentId, transferId, expected, actual, context = {}) => {
    logger.warn('ALERT: Transfer amount mismatch', {
      alert: 'transfer_amount_mismatch',
      severity: 'WARNING',
      paymentId,
      transferId,
      expectedAmount: expected,
      actualAmount: actual,
      discrepancy: actual - expected,
      ...context
    });
  },

  /**
   * Platform Fee Issue - fee not retained correctly
   */
  platformFeeLoss: (paymentId, expectedFee, actualFee, context = {}) => {
    logger.error('ALERT: Platform fee loss detected', {
      alert: 'platform_fee_loss',
      severity: 'CRITICAL',
      paymentId,
      expectedFee,
      actualFee,
      feeLoss: expectedFee - actualFee,
      message: 'Platform did not retain expected fees',
      ...context
    });
  },

  /**
   * Payout Disabled - integrator account has payouts disabled
   */
  payoutsDisabled: (integratorId, accountId, context = {}) => {
    logger.error('ALERT: Payouts disabled on Connect account', {
      alert: 'payouts_disabled',
      severity: 'ERROR',
      integratorId,
      accountId,
      message: 'Cannot transfer to this integrator until payouts are enabled',
      ...context
    });
  },

  /**
   * Account Verification Required - integrator has pending requirements
   */
  verificationPending: (integratorId, accountId, requirements, context = {}) => {
    logger.warn('ALERT: Account verification pending', {
      alert: 'verification_pending',
      severity: 'WARNING',
      integratorId,
      accountId,
      requirements,
      message: 'Integrator account has pending verification requirements',
      ...context
    });
  },

  /**
   * Insufficient Funds - platform account insufficient balance for transfer
   */
  insufficientFunds: (paymentId, amount, context = {}) => {
    logger.error('ALERT: Insufficient funds for transfer', {
      alert: 'insufficient_funds',
      severity: 'CRITICAL',
      paymentId,
      requiredAmount: amount,
      message: 'Platform account insufficient balance to complete transfer',
      action: 'URGENT: Check platform account balance',
      ...context
    });
  },

  /**
   * Webhook Retry Exhausted - webhook failed after retries
   */
  webhookRetryExhausted: (eventId, eventType, attempts, context = {}) => {
    logger.error('ALERT: Webhook retry exhausted', {
      alert: 'webhook_retry_exhausted',
      severity: 'ERROR',
      eventId,
      eventType,
      retryAttempts: attempts,
      message: 'Webhook processing failed after multiple retry attempts',
      ...context
    });
  },

  /**
   * Duplicate Charge - payment resulted in multiple charges
   */
  duplicateCharge: (paymentId, chargeIds, context = {}) => {
    logger.error('ALERT: CRITICAL - Duplicate charge detected', {
      alert: 'duplicate_charge',
      severity: 'CRITICAL',
      paymentId,
      chargeIds,
      count: chargeIds.length,
      message: `Payment resulted in ${chargeIds.length} charges instead of 1`,
      ...context
    });
  },

  /**
   * Transfer Reversal - transfer was reversed
   */
  transferReversal: (paymentId, transferId, reason, context = {}) => {
    logger.error('ALERT: Transfer reversed', {
      alert: 'transfer_reversal',
      severity: 'ERROR',
      paymentId,
      transferId,
      reverseReason: reason,
      message: 'Transfer to integrator was reversed',
      action: 'Review integrator account and reason for reversal',
      ...context
    });
  },

  /**
   * Charge Failure - charge failed
   */
  chargeFailed: (paymentId, chargeId, failureMessage, context = {}) => {
    logger.error('ALERT: Charge failed', {
      alert: 'charge_failed',
      severity: 'ERROR',
      paymentId,
      chargeId,
      failureMessage,
      ...context
    });
  },

  /**
   * Transfer to Disabled Account - attempted transfer to restricted account
   */
  transferToDisabledAccount: (paymentId, accountId, restrictions, context = {}) => {
    logger.error('ALERT: Transfer to restricted account blocked', {
      alert: 'transfer_to_restricted_account',
      severity: 'ERROR',
      paymentId,
      destinationAccountId: accountId,
      restrictions,
      message: 'Cannot transfer to account with active restrictions',
      ...context
    });
  },

  /**
   * High Volume Failure - unusual number of failures detected
   */
  highVolumeFailure: (timeWindow, failureCount, failureRate, context = {}) => {
    logger.error('ALERT: High failure rate detected', {
      alert: 'high_volume_failure',
      severity: 'ERROR',
      timeWindow,
      failureCount,
      failureRate: `${failureRate.toFixed(2)}%`,
      message: `${failureCount} payment failures in ${timeWindow}`,
      action: 'Investigate payment processing pipeline',
      ...context
    });
  },

  /**
   * Reconciliation Complete - daily reconciliation results
   */
  reconciliationComplete: (stats, context = {}) => {
    const level = stats.errorRate > 5 ? 'error' : stats.warningCount > 0 ? 'warn' : 'info';
    const logFn = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';

    logger[logFn]('Reconciliation complete', {
      alert: 'reconciliation_complete',
      severity: level.toUpperCase(),
      timestamp: new Date(),
      ...stats,
      ...context
    });
  },

  /**
   * Manual Transfer Retry - admin initiated transfer retry
   */
  manualTransferRetry: (paymentId, admin, reason, context = {}) => {
    logger.info('Manual transfer retry initiated', {
      alert: 'manual_transfer_retry',
      severity: 'INFO',
      paymentId,
      initiatedBy: admin,
      reason,
      ...context
    });
  },

  /**
   * Webhook Replay - admin replayed webhook for testing/recovery
   */
  webhookReplay: (paymentId, eventTypes, admin, context = {}) => {
    logger.info('Webhook replay initiated', {
      alert: 'webhook_replay',
      severity: 'INFO',
      paymentId,
      eventTypes,
      initiatedBy: admin,
      ...context
    });
  }
};

/**
 * Export alert types for reference
 */
export const ALERT_TYPES = {
  FAILED_TRANSFER: 'failed_transfer',
  DUPLICATE_TRANSFER_ATTEMPT: 'duplicate_transfer_attempt',
  ORPHANED_PAYMENT: 'orphaned_payment',
  MISSING_TRANSFER: 'missing_transfer',
  WEBHOOK_PROCESSING_FAILED: 'webhook_processing_failed',
  RECONCILIATION_MISMATCH: 'reconciliation_mismatch',
  TRANSFER_AMOUNT_MISMATCH: 'transfer_amount_mismatch',
  PLATFORM_FEE_LOSS: 'platform_fee_loss',
  PAYOUTS_DISABLED: 'payouts_disabled',
  VERIFICATION_PENDING: 'verification_pending',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  WEBHOOK_RETRY_EXHAUSTED: 'webhook_retry_exhausted',
  DUPLICATE_CHARGE: 'duplicate_charge',
  TRANSFER_REVERSAL: 'transfer_reversal',
  CHARGE_FAILED: 'charge_failed',
  TRANSFER_TO_DISABLED_ACCOUNT: 'transfer_to_disabled_account',
  HIGH_VOLUME_FAILURE: 'high_volume_failure',
  RECONCILIATION_COMPLETE: 'reconciliation_complete',
  MANUAL_TRANSFER_RETRY: 'manual_transfer_retry',
  WEBHOOK_REPLAY: 'webhook_replay'
};
