import { logger } from '../utils/logger';
import {
  reconcileDateRange,
  detectDuplicateTransfers,
  detectFeeAnomalies,
  generateReconciliationReport
} from './paymentReconciliationService';

/**
 * Daily Reconciliation Job
 * 
 * Runs daily to:
 * - Reconcile payments from last 24 hours
 * - Detect missing transfers
 * - Detect duplicate transfers
 * - Detect fee anomalies
 * - Generate audit report
 * - Alert on critical issues
 */
export const runDailyReconciliation = async (stripe) => {
  const startTime = Date.now();

  try {
    logger.info('Starting daily reconciliation job');

    // 1. PREPARE DATE RANGE (last 24 hours)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

    // 2. RUN RECONCILIATION
    const reconciliation = await reconcileDateRange(startDate, endDate, stripe);

    // 3. DETECT ANOMALIES
    const duplicates = await detectDuplicateTransfers();
    const feeAnomalies = await detectFeeAnomalies();

    // 4. GENERATE REPORT
    const report = generateReconciliationReport(reconciliation);

    // 5. COMBINE RESULTS
    const jobResult = {
      timestamp: new Date(),
      duration: Date.now() - startTime,
      reconciliation,
      anomalies: {
        duplicateTransfers: duplicates,
        feeAnomalies: feeAnomalies
      },
      report
    };

    // 6. ALERT ON CRITICAL ISSUES
    await alertOnCriticalIssues(jobResult);

    // 7. SAVE AUDIT RECORD
    await saveReconciliationAudit(jobResult);

    logger.info('Daily reconciliation completed', {
      totalPayments: reconciliation.totalPayments,
      validPayments: reconciliation.validPayments,
      errorPayments: reconciliation.errorPayments,
      successRate: reconciliation.successRate,
      durationMs: jobResult.duration
    });

    return jobResult;
  } catch (error) {
    logger.error('Daily reconciliation job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    throw error;
  }
};

/**
 * Alert on critical issues found during reconciliation
 */
const alertOnCriticalIssues = async (jobResult) => {
  const { reconciliation, anomalies } = jobResult;

  // Alert: Orphaned payments
  if (reconciliation.orphanedPayments.length > 0) {
    logger.error('ALERT: CRITICAL - Orphaned payments detected', {
      count: reconciliation.orphanedPayments.length,
      payments: reconciliation.orphanedPayments.slice(0, 5)
    });
  }

  // Alert: Missing transfers
  if (reconciliation.missingTransfers.length > 0) {
    logger.error('ALERT: Missing transfers detected', {
      count: reconciliation.missingTransfers.length,
      payments: reconciliation.missingTransfers.slice(0, 5)
    });
  }

  // Alert: Duplicate transfers
  if (anomalies.duplicateTransfers.duplicates.length > 0) {
    logger.error('ALERT: Duplicate transfers detected', {
      count: anomalies.duplicateTransfers.duplicates.length,
      duplicates: anomalies.duplicateTransfers.duplicates.slice(0, 5)
    });
  }

  // Alert: Fee anomalies
  if (anomalies.feeAnomalies.anomalies.length > 0) {
    logger.warn('ALERT: Fee anomalies detected', {
      count: anomalies.feeAnomalies.anomalies.length,
      anomalies: anomalies.feeAnomalies.anomalies.slice(0, 5)
    });
  }

  // Alert: High error rate
  if (parseFloat(reconciliation.errorRate) > 5) {
    logger.error('ALERT: High payment error rate', {
      errorRate: reconciliation.errorRate,
      errorCount: reconciliation.errorPayments,
      totalCount: reconciliation.totalPayments
    });
  }
};

/**
 * Save reconciliation audit record
 */
const saveReconciliationAudit = async (jobResult) => {
  try {
    const ReconciliationAudit = require('../models/reconciliationAudit');

    const audit = new ReconciliationAudit({
      timestamp: jobResult.timestamp,
      duration: jobResult.duration,
      paymentStats: {
        totalPayments: jobResult.reconciliation.totalPayments,
        validPayments: jobResult.reconciliation.validPayments,
        warningPayments: jobResult.reconciliation.warningPayments,
        errorPayments: jobResult.reconciliation.errorPayments,
        successRate: jobResult.reconciliation.successRate,
        errorRate: jobResult.reconciliation.errorRate
      },
      issues: {
        orphanedCount: jobResult.reconciliation.orphanedPayments.length,
        missingTransfersCount: jobResult.reconciliation.missingTransfers.length,
        amountMismatchCount: jobResult.reconciliation.amountMismatches.length,
        destinationMismatchCount: jobResult.reconciliation.destinationMismatches.length,
        duplicateTransfersCount: jobResult.anomalies.duplicateTransfers.duplicates.length,
        feeAnomaliesCount: jobResult.anomalies.feeAnomalies.anomalies.length
      },
      detailedResults: jobResult.reconciliation.detailedResults,
      recommendations: jobResult.report.recommendation
    });

    await audit.save();
    logger.info('Reconciliation audit record saved');
  } catch (err) {
    logger.error('Failed to save reconciliation audit', {
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};

/**
 * Triggered Reconciliation
 * Manually run reconciliation for a specific payment
 */
export const reconcileSpecificPayment = async (paymentId, stripe) => {
  try {
    const Payment = require('../models/payment');
    const { reconcilePayment } = require('./paymentReconciliationService');

    const payment = await Payment.findById(paymentId).populate('receivingIntegrator');

    if (!payment) {
      throw new Error('Payment not found');
    }

    const result = await reconcilePayment(payment, stripe);

    logger.info('Manual payment reconciliation completed', {
      paymentId,
      status: result.status
    });

    return result;
  } catch (error) {
    logger.error('Manual reconciliation failed', {
      paymentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
};

/**
 * Export job for use in cron/scheduler
 * Example usage in cron job:
 * 
 * import cron from 'node-cron';
 * import { runDailyReconciliation } from './reconciliationJob';
 * 
 * // Run daily at 2 AM
 * cron.schedule('0 2 * * *', () => {
 *   runDailyReconciliation(stripe).catch(err => {
 *     console.error('Cron job failed:', err);
 *   });
 * });
 */
