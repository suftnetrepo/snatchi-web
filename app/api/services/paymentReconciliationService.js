import { logger } from '../utils/logger';

/**
 * Payment Reconciliation Service
 * 
 * Verifies payment integrity across Stripe and database:
 * - Charge amount = transfer amount + platform fee
 * - Transfer destination correctness
 * - Payment currency consistency
 * - Webhook lifecycle completion
 * - Orphaned/missing/duplicate payments
 */

/**
 * Reconcile a single payment
 * Verifies payment state against Stripe and database
 */
export const reconcilePayment = async (payment, stripe) => {
  const result = {
    paymentId: payment._id,
    paymentIntentId: payment.paymentIntentId,
    status: 'valid',
    errors: [],
    warnings: [],
    details: {
      chargeAmount: payment.grossAmount,
      transferAmount: payment.netAmount,
      platformFeeAmount: payment.platformFeeAmount,
      chargeId: payment.chargeId,
      transferId: payment.transferId,
      paymentStatus: payment.paymentStatus,
      transferStatus: payment.transferStatus
    }
  };

  try {
    // 1. VERIFY CHARGE EXISTS AND AMOUNT MATCHES
    if (payment.chargeId) {
      try {
        const charge = await stripe.charges.retrieve(payment.chargeId);

        // Check charge amount
        if (charge.amount !== payment.grossAmount) {
          result.errors.push(
            `Charge amount mismatch: expected ${payment.grossAmount}, got ${charge.amount}`
          );
          result.status = 'error';
        }

        // Check charge currency
        if (charge.currency !== payment.currency?.toLowerCase()) {
          result.errors.push(
            `Charge currency mismatch: expected ${payment.currency}, got ${charge.currency}`
          );
          result.status = 'error';
        }

        // Check charge status
        if (charge.status !== 'succeeded') {
          result.warnings.push(`Charge status is ${charge.status}, not succeeded`);
        }

        // Verify charge is on platform account (no account property = platform)
        if (charge.on_behalf_of) {
          result.errors.push(
            `Charge created on wrong account: ${charge.on_behalf_of}. Should be on platform.`
          );
          result.status = 'error';
        }

        result.details.chargeDetails = {
          id: charge.id,
          amount: charge.amount,
          currency: charge.currency,
          status: charge.status,
          customer: charge.customer,
          balance_transaction: charge.balance_transaction
        };
      } catch (err) {
        result.errors.push(`Failed to retrieve charge: ${err.message}`);
        result.status = 'error';
      }
    } else {
      result.errors.push('Charge ID missing from payment record');
      result.status = 'error';
    }

    // 2. VERIFY TRANSFER AND DESTINATION
    if (payment.transferId) {
      try {
        const transfer = await stripe.transfers.retrieve(payment.transferId);

        // Check transfer amount
        if (transfer.amount !== payment.netAmount) {
          result.errors.push(
            `Transfer amount mismatch: expected ${payment.netAmount}, got ${transfer.amount}`
          );
          result.status = 'error';
        }

        // Check transfer destination
        const receivingIntegrator = await payment
          .populate('receivingIntegrator')
          .then(p => p.receivingIntegrator);

        if (transfer.destination !== receivingIntegrator?.stripeConnectAccountId) {
          result.errors.push(
            `Transfer destination mismatch: expected ${receivingIntegrator?.stripeConnectAccountId}, got ${transfer.destination}`
          );
          result.status = 'error';
        }

        // Check transfer currency
        if (transfer.currency !== payment.currency?.toLowerCase()) {
          result.errors.push(
            `Transfer currency mismatch: expected ${payment.currency}, got ${transfer.currency}`
          );
          result.status = 'error';
        }

        // Check transfer status
        if (transfer.status !== 'in_transit' && transfer.status !== 'paid') {
          result.warnings.push(`Transfer status is ${transfer.status}, still pending`);
        }

        result.details.transferDetails = {
          id: transfer.id,
          amount: transfer.amount,
          currency: transfer.currency,
          destination: transfer.destination,
          status: transfer.status,
          created: transfer.created
        };
      } catch (err) {
        if (err.message.includes('No such transfer')) {
          result.errors.push('Transfer ID in database but not found in Stripe');
          result.status = 'error';
        } else {
          result.errors.push(`Failed to retrieve transfer: ${err.message}`);
          result.status = 'error';
        }
      }
    } else if (payment.paymentStatus === 'succeeded') {
      result.errors.push('Payment succeeded but transfer ID missing');
      result.status = 'error';
    }

    // 3. VERIFY FEE CALCULATION
    const expectedFee = Math.round(
      (payment.grossAmount * payment.receivingIntegrator?.platformFeePercentage) / 100
    );
    if (Math.abs(payment.platformFeeAmount - expectedFee) > 1) {
      // Allow 1 cent rounding difference
      result.warnings.push(
        `Platform fee mismatch: expected ~${expectedFee}, got ${payment.platformFeeAmount}`
      );
    }

    // 4. VERIFY ARITHMETIC: charge = transfer + fee
    const calculatedFee = payment.grossAmount - payment.netAmount;
    if (calculatedFee !== payment.platformFeeAmount) {
      result.errors.push(
        `Fee arithmetic mismatch: ${payment.grossAmount} - ${payment.netAmount} = ${calculatedFee}, but recorded as ${payment.platformFeeAmount}`
      );
      result.status = 'error';
    }

    // 5. CHECK FOR ORPHANED STATE
    if (payment.paymentStatus === 'succeeded' && !payment.transferId) {
      result.errors.push('ORPHANED: Payment succeeded but no transfer created');
      result.status = 'error';
    }

    // 6. CHECK WEBHOOK LIFECYCLE
    if (payment.paymentStatus === 'succeeded' && !payment.paymentSucceededAt) {
      result.warnings.push('Payment succeeded but paymentSucceededAt not set');
    }

    if (payment.transferStatus === 'created' && !payment.transferInitiatedAt) {
      result.warnings.push('Transfer created but transferInitiatedAt not set');
    }

    if (payment.transferStatus === 'paid' && !payment.transferPaidAt) {
      result.warnings.push('Transfer paid but transferPaidAt not set');
    }
  } catch (error) {
    result.errors.push(`Reconciliation error: ${error.message}`);
    result.status = 'error';
  }

  return result;
};

/**
 * Bulk reconciliation for date range
 * Used for daily/weekly verification
 */
export const reconcileDateRange = async (startDate, endDate, stripe) => {
  const Payment = require('../models/payment');

  const result = {
    startDate,
    endDate,
    timestamp: new Date(),
    totalPayments: 0,
    validPayments: 0,
    warningPayments: 0,
    errorPayments: 0,
    orphanedPayments: [],
    missingTransfers: [],
    duplicateTransfers: [],
    amountMismatches: [],
    destinationMismatches: [],
    detailedResults: []
  };

  try {
    // Find payments in date range
    const payments = await Payment.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('receivingIntegrator');

    result.totalPayments = payments.length;

    // Reconcile each payment
    for (const payment of payments) {
      const reconciliation = await reconcilePayment(payment, stripe);
      result.detailedResults.push(reconciliation);

      if (reconciliation.status === 'valid' && reconciliation.errors.length === 0) {
        result.validPayments++;
      } else if (reconciliation.status === 'valid') {
        result.warningPayments++;
      } else {
        result.errorPayments++;

        // Categorize errors
        if (reconciliation.errors.some(e => e.includes('ORPHANED'))) {
          result.orphanedPayments.push({
            paymentId: payment._id,
            chargeId: payment.chargeId,
            error: reconciliation.errors.find(e => e.includes('ORPHANED'))
          });
        }

        if (reconciliation.errors.some(e => e.includes('transfer ID missing'))) {
          result.missingTransfers.push({
            paymentId: payment._id,
            chargeId: payment.chargeId
          });
        }

        if (reconciliation.errors.some(e => e.includes('amount mismatch'))) {
          result.amountMismatches.push({
            paymentId: payment._id,
            error: reconciliation.errors.find(e => e.includes('amount mismatch'))
          });
        }

        if (reconciliation.errors.some(e => e.includes('destination mismatch'))) {
          result.destinationMismatches.push({
            paymentId: payment._id,
            error: reconciliation.errors.find(e => e.includes('destination mismatch'))
          });
        }
      }
    }

    // Calculate summary
    result.successRate = payments.length > 0 
      ? ((result.validPayments / result.totalPayments) * 100).toFixed(2)
      : 0;

    result.errorRate = payments.length > 0
      ? ((result.errorPayments / result.totalPayments) * 100).toFixed(2)
      : 0;

    logger.info('Payment reconciliation completed', {
      totalPayments: result.totalPayments,
      validPayments: result.validPayments,
      warningPayments: result.warningPayments,
      errorPayments: result.errorPayments,
      successRate: result.successRate,
      orphanedCount: result.orphanedPayments.length,
      missingTransfersCount: result.missingTransfers.length
    });
  } catch (error) {
    logger.error('Reconciliation error', {
      error: error.message,
      startDate,
      endDate
    });
    result.error = error.message;
  }

  return result;
};

/**
 * Detect duplicate transfers
 * Find payments with multiple transfer records
 */
export const detectDuplicateTransfers = async () => {
  const Payment = require('../models/payment');

  const result = {
    duplicates: [],
    timestamp: new Date()
  };

  try {
    // Look for duplicate transferIds
    const duplicateTransfers = await Payment.aggregate([
      {
        $match: {
          transferId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$transferId',
          count: { $sum: 1 },
          payments: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    for (const dup of duplicateTransfers) {
      result.duplicates.push({
        transferId: dup._id,
        occurrences: dup.count,
        paymentIds: dup.payments
      });

      logger.warn('ALERT: Duplicate transfer detected', {
        transferId: dup._id,
        occurrences: dup.count,
        paymentIds: dup.payments
      });
    }
  } catch (error) {
    logger.error('Error detecting duplicate transfers', {
      error: error.message
    });
    result.error = error.message;
  }

  return result;
};

/**
 * Detect payments with mismatched fees
 */
export const detectFeeAnomalies = async () => {
  const Payment = require('../models/payment');

  const result = {
    anomalies: [],
    timestamp: new Date()
  };

  try {
    const payments = await Payment.find({
      paymentStatus: 'succeeded'
    }).populate('receivingIntegrator');

    for (const payment of payments) {
      // Verify: charge = transfer + fee
      const calculatedFee = payment.grossAmount - payment.netAmount;
      if (calculatedFee !== payment.platformFeeAmount) {
        result.anomalies.push({
          paymentId: payment._id,
          chargeId: payment.chargeId,
          grossAmount: payment.grossAmount,
          netAmount: payment.netAmount,
          recordedFee: payment.platformFeeAmount,
          calculatedFee: calculatedFee,
          discrepancy: calculatedFee - payment.platformFeeAmount
        });

        logger.warn('ALERT: Fee anomaly detected', {
          paymentId: payment._id,
          discrepancy: calculatedFee - payment.platformFeeAmount
        });
      }

      // Verify fee percentage is reasonable (5-20%)
      const feePercentage = (payment.platformFeeAmount / payment.grossAmount) * 100;
      if (feePercentage < 5 || feePercentage > 20) {
        result.anomalies.push({
          paymentId: payment._id,
          type: 'unusual_fee_percentage',
          feePercentage: feePercentage.toFixed(2),
          expected: `5-20%`
        });
      }
    }
  } catch (error) {
    logger.error('Error detecting fee anomalies', {
      error: error.message
    });
    result.error = error.message;
  }

  return result;
};

/**
 * Verify integrator can receive transfers
 */
export const verifyIntegratorTransferCapability = async (integrator, stripe) => {
  const result = {
    integratorId: integrator._id,
    canReceiveTransfers: false,
    issues: [],
    details: {}
  };

  try {
    if (!integrator.stripeConnectAccountId) {
      result.issues.push('No Connect account linked');
      return result;
    }

    // Check account status
    const account = await stripe.accounts.retrieve(integrator.stripeConnectAccountId);

    result.details = {
      accountId: account.id,
      type: account.type,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirementsStatus: account.requirements?.status
    };

    // Check if can receive transfers
    if (!account.payouts_enabled) {
      result.issues.push('Payouts not enabled on Connect account');
    }

    if (!account.charges_enabled) {
      result.issues.push('Charges not enabled on Connect account');
    }

    if (account.requirements?.status === 'past_due') {
      result.issues.push('Account has past due requirements');
    }

    if (account.requirements?.status === 'pending') {
      result.issues.push('Account has pending requirements');
    }

    // Check for restricted accounts
    if (account.restrictions?.includes('transfers_out')) {
      result.issues.push('Transfers out restricted');
    }

    result.canReceiveTransfers = result.issues.length === 0;
  } catch (error) {
    result.issues.push(`Failed to verify account: ${error.message}`);
  }

  return result;
};

/**
 * Generate reconciliation report
 */
export const generateReconciliationReport = (reconciliation) => {
  const report = {
    timestamp: reconciliation.timestamp,
    dateRange: {
      start: reconciliation.startDate,
      end: reconciliation.endDate
    },
    summary: {
      totalPayments: reconciliation.totalPayments,
      validPayments: reconciliation.validPayments,
      warningPayments: reconciliation.warningPayments,
      errorPayments: reconciliation.errorPayments,
      successRate: `${reconciliation.successRate}%`,
      errorRate: `${reconciliation.errorRate}%`
    },
    issues: {
      orphanedPayments: reconciliation.orphanedPayments,
      missingTransfers: reconciliation.missingTransfers,
      amountMismatches: reconciliation.amountMismatches,
      destinationMismatches: reconciliation.destinationMismatches
    },
    recommendation: generateRecommendation(reconciliation)
  };

  return report;
};

/**
 * Generate recommendation based on reconciliation results
 */
const generateRecommendation = (reconciliation) => {
  const recommendations = [];

  if (reconciliation.errorPayments > 0) {
    recommendations.push('⚠️  ACTION REQUIRED: Review and fix error payments');
  }

  if (reconciliation.orphanedPayments.length > 0) {
    recommendations.push(`🚨 CRITICAL: ${reconciliation.orphanedPayments.length} orphaned payments detected`);
  }

  if (reconciliation.missingTransfers.length > 0) {
    recommendations.push(
      `⚠️  ${reconciliation.missingTransfers.length} payments missing transfers - may need manual retry`
    );
  }

  if (reconciliation.amountMismatches.length > 0) {
    recommendations.push(
      `⚠️  ${reconciliation.amountMismatches.length} amount mismatches - investigate fee calculation`
    );
  }

  if (reconciliation.errorRate > 5) {
    recommendations.push('⚠️  Error rate > 5% - investigate payment processing');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All payments reconciled successfully');
  }

  return recommendations;
};
