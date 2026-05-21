'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './investigation.module.css';
import {
  usePaymentInvestigation,
  type PaymentInvestigationData
} from '@/hooks/usePaymentInvestigation';

export default function PaymentInvestigationPage() {
  const params = useParams();
  const paymentId = typeof params.paymentId === 'string' ? params.paymentId : '';
  const [showRawData, setShowRawData] = useState(false);

  const { investigation, loading, error, retrying, handleRetryTransfer, fetchInvestigation } = usePaymentInvestigation(paymentId);

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;
  if (!investigation) return <div className={styles.container}>No data</div>;

  const investigationData: PaymentInvestigationData = investigation;
  const { payment, reconciliation, webhookHistory, stripeCharge, stripeTransfer } = investigationData;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Payment Investigation</h1>
        <div className={styles.headerButtons}>
          <button onClick={fetchInvestigation} className={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* RECONCILIATION RESULT */}
      <section className={styles.section}>
        <h2>Reconciliation Status</h2>
        <div
          className={`${styles.reconciliationBox} ${
            reconciliation.status === 'valid' ? styles.valid : styles.error
          }`}
          data-testid="admin-payment-reconciliation"
        >
          <div className={styles.statusBadge} data-testid={`reconciliation-${reconciliation.status}`}>
            {reconciliation.status === 'valid' ? '✅ Valid' : '❌ Error'}
          </div>

          {reconciliation.errors.length > 0 && (
            <div className={styles.errorsList} data-testid="admin-reconciliation-error">
              <h3>Errors:</h3>
              <ul>
                {reconciliation.errors.map((err, i) => (
                  <li key={i} className={styles.error}>
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reconciliation.warnings.length > 0 && (
            <div className={styles.warningsList}>
              <h3>Warnings:</h3>
              <ul>
                {reconciliation.warnings.map((warn, i) => (
                  <li key={i} className={styles.warning}>
                    {warn}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* PAYMENT STATUS */}
      <section className={styles.section}>
        <h2>Payment Status</h2>
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={styles.label}>Payment Status:</span>
            <span className={styles.value} data-testid="admin-payment-status">
              {payment.paymentStatus}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.label}>Transfer Status:</span>
            <span className={styles.value} data-testid="admin-transfer-status">
              {payment.transferStatus}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.label}>Created:</span>
            <span className={styles.value}>{new Date(payment.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* AMOUNTS */}
      <section className={styles.section}>
        <h2>Payment Breakdown</h2>
        <div className={styles.amountsGrid}>
          <div className={styles.amountItem}>
            <span className={styles.label}>Gross Amount:</span>
            <span className={styles.value} data-testid="admin-gross-amount">
              £{(payment.grossAmount / 100).toFixed(2)}
            </span>
          </div>
          <div className={styles.amountItem}>
            <span className={styles.label}>Platform Fee ({payment.receivingIntegrator?.platformFeePercentage}%):</span>
            <span className={styles.value} data-testid="admin-platform-fee">
              £{(payment.platformFeeAmount / 100).toFixed(2)}
            </span>
          </div>
          <div className={styles.amountItem}>
            <span className={styles.label}>Net Amount (to Integrator):</span>
            <span className={styles.value} data-testid="admin-net-amount">
              £{(payment.netAmount / 100).toFixed(2)}
            </span>
          </div>
          <div className={styles.amountItem}>
            <span className={styles.label}>Currency:</span>
            <span className={styles.value}>{payment.currency}</span>
          </div>
        </div>

        {/* Verify arithmetic */}
        {payment.grossAmount === payment.netAmount + payment.platformFeeAmount ? (
          <div className={styles.checkmark}>✅ Arithmetic verified: {payment.grossAmount} = {payment.netAmount} + {payment.platformFeeAmount}</div>
        ) : (
          <div className={styles.error}>
            ❌ Arithmetic error: {payment.grossAmount} ≠ {payment.netAmount} + {payment.platformFeeAmount}
          </div>
        )}
      </section>

      {/* STRIPE IDS */}
      <section className={styles.section}>
        <h2>Stripe References</h2>
        <div className={styles.idGrid}>
          <div className={styles.idItem}>
            <span className={styles.label}>Payment Intent ID:</span>
            <code className={styles.code} data-testid="admin-payment-intent-id">
              {payment.paymentIntentId}
            </code>
          </div>
          <div className={styles.idItem}>
            <span className={styles.label}>Charge ID:</span>
            <code className={styles.code} data-testid="admin-charge-id">
              {payment.chargeId || 'N/A'}
            </code>
          </div>
          <div className={styles.idItem}>
            <span className={styles.label}>Transfer ID:</span>
            <code className={styles.code} data-testid="admin-transfer-id">
              {payment.transferId || 'N/A'}
            </code>
          </div>
        </div>
      </section>

      {/* CHARGE DETAILS */}
      {stripeCharge && (
        <section className={styles.section}>
          <h2>Stripe Charge Details</h2>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Charge Amount:</span>
              <span className={styles.value}>
                £{(stripeCharge.amount / 100).toFixed(2)} {stripeCharge.currency?.toUpperCase()}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Status:</span>
              <span className={styles.value}>{stripeCharge.status}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Customer:</span>
              <code className={styles.code}>{stripeCharge.customer}</code>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Created:</span>
              <span className={styles.value}>{new Date(stripeCharge.created * 1000).toLocaleString()}</span>
            </div>
          </div>
        </section>
      )}

      {/* TRANSFER DETAILS */}
      {stripeTransfer && (
        <section className={styles.section}>
          <h2>Stripe Transfer Details</h2>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Transfer Amount:</span>
              <span className={styles.value}>
                £{(stripeTransfer.amount / 100).toFixed(2)} {stripeTransfer.currency?.toUpperCase()}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Status:</span>
              <span className={styles.value}>{stripeTransfer.status}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Destination:</span>
              <code className={styles.code}>{stripeTransfer.destination}</code>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Created:</span>
              <span className={styles.value}>{new Date(stripeTransfer.created * 1000).toLocaleString()}</span>
            </div>
          </div>

          {stripeTransfer.status === 'failed' && (
            <div className={styles.errorBox}>
              <strong>Transfer Failed:</strong>
              <p>{stripeTransfer.failure_reason}</p>
            </div>
          )}
        </section>
      )}

      {/* WEBHOOK HISTORY */}
      <section className={styles.section}>
        <h2>Webhook History</h2>
        <div className={styles.webhookHistory} data-testid="admin-webhook-history">
          {webhookHistory.length > 0 ? (
            <div className={styles.webhookList}>
              {webhookHistory.map((webhook, i) => (
                <div key={i} className={styles.webhookEvent}>
                  <div className={styles.webhookHeader}>
                    <span className={styles.webhookType}>{webhook.type}</span>
                    <span className={styles.webhookTime}>
                      {new Date(webhook.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.webhookStatus}>
                    Status: <strong>{webhook.status}</strong>
                  </div>
                  {webhook.error && (
                    <div className={styles.webhookError}>Error: {webhook.error}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No webhook history</p>
          )}
        </div>
      </section>

      {/* ACTIONS */}
      <section className={styles.section}>
        <h2>Admin Actions</h2>
        <div className={styles.actionsGrid}>
          {payment.paymentStatus === 'succeeded' && payment.transferStatus !== 'paid' && (
            <button
              onClick={handleRetryTransfer}
              disabled={retrying}
              className={styles.actionButton}
              data-testid="admin-transfer-retry"
            >
              {retrying ? '⏳ Retrying...' : '🔄 Retry Transfer'}
            </button>
          )}
          <button onClick={() => setShowRawData(!showRawData)} className={styles.actionButton}>
            {showRawData ? '🔒 Hide' : '🔓 Show'} Raw Data
          </button>
        </div>
      </section>

      {/* RAW DATA */}
      {showRawData && (
        <section className={styles.section}>
          <h2>Raw Payment Data</h2>
          <pre className={styles.rawData}>{JSON.stringify(payment, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
