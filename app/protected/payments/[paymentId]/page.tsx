'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './detail.module.css';
import { usePaymentDetail, type PaymentDetail } from '@/hooks/usePaymentDetail';

export default function PaymentDetailPage() {
  const params = useParams();
  const paymentId = typeof params.paymentId === 'string' ? params.paymentId : '';

  const { payment, loading, error } = usePaymentDetail(paymentId);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading payment details...</div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Payment not found'}</div>
        <Link href="/protected/integrator/payments/made" className={styles.backLink}>
          ← Back to Payments
        </Link>
      </div>
    );
  }

  const statusColor = {
    succeeded: '#059669',
    pending: '#f59e0b',
    failed: '#dc2626',
    cancelled: '#6b7280',
  };

  const paymentDetail: PaymentDetail = payment;
  const scheduler = paymentDetail.scheduler;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerSection}>
        <div>
          <h1 data-testid="payment-detail-header">
            Payment #{paymentDetail.paymentIntentId.slice(-8).toUpperCase()}
          </h1>
          <Link href="/protected/integrator/payments/made" className={styles.backLink}>
            ← Back to Payments
          </Link>
        </div>
        <span
          data-testid={`payment-status-${paymentDetail.paymentStatus}`}
          className={`${styles.statusBadge} ${styles[`status-${paymentDetail.paymentStatus}`]}`}
          style={{ color: statusColor[paymentDetail.paymentStatus as keyof typeof statusColor] }}
        >
          {paymentDetail.paymentStatus.toUpperCase()}
        </span>
      </div>

      {/* Amount Summary */}
      <div data-testid="payment-summary" className={styles.card}>
        <h2>Amount Breakdown</h2>
        <div className={styles.amountGrid}>
          <div className={styles.amountItem}>
            <span>Gross Amount</span>
            <strong data-testid="payment-gross-total">£{(paymentDetail.grossAmount / 100).toFixed(2)}</strong>
          </div>
          <div className={styles.amountItem}>
            <span>Platform Fee (10%)</span>
            <strong data-testid="payment-fee-deducted">-£{(paymentDetail.platformFeeAmount / 100).toFixed(2)}</strong>
          </div>
          <div className={styles.amountItemHighlight}>
            <span>Net Received</span>
            <strong data-testid="payment-net-received">£{(paymentDetail.netAmount / 100).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Party Information */}
      <div data-testid="payment-parties" className={styles.card}>
        <h2>Parties Involved</h2>
        <div className={styles.partyGrid}>
          <div className={styles.partyItem}>
            <span className={styles.partyLabel}>Paid By</span>
            <strong data-testid="payment-party-paying">
              {paymentDetail.payingIntegrator.name}
            </strong>
          </div>
          <div className={styles.partyItem}>
            <span className={styles.partyLabel}>Received By</span>
            <strong data-testid="payment-party-receiving">
              {paymentDetail.receivingIntegrator.name}
            </strong>
          </div>
          <div className={styles.partyItem}>
            <span className={styles.partyLabel}>For Engineer</span>
            <strong data-testid="payment-party-engineer">
              {paymentDetail.engineer.first_name} {paymentDetail.engineer.last_name}
            </strong>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div data-testid="payment-timeline" className={styles.card}>
        <h2>Payment Timeline</h2>
        <div className={styles.timeline}>
          <div
            className={`${styles.timelineItem} ${paymentDetail.paymentInitiatedAt ? styles.completed : ''}`}
            data-testid="payment-timeline-initiated"
          >
            <div className={styles.timelineDot}>
              {paymentDetail.paymentInitiatedAt ? '✓' : '⏳'}
            </div>
            <div className={styles.timelineContent}>
              <strong>Payment Initiated</strong>
              <p>{new Date(paymentDetail.paymentInitiatedAt).toLocaleString()}</p>
            </div>
          </div>

          <div
            className={`${styles.timelineItem} ${paymentDetail.chargeSucceededAt ? styles.completed : ''}`}
            data-testid="payment-timeline-charged"
          >
            <div className={styles.timelineDot}>
              {paymentDetail.chargeSucceededAt ? '✓' : '⏳'}
            </div>
            <div className={styles.timelineContent}>
              <strong>Payment Charged</strong>
              <p>
                {paymentDetail.chargeSucceededAt
                  ? new Date(paymentDetail.chargeSucceededAt).toLocaleString()
                  : 'Pending'}
              </p>
              {paymentDetail.chargeFailureMessage && (
                <p className={styles.errorText}>{paymentDetail.chargeFailureMessage}</p>
              )}
            </div>
          </div>

          <div
            className={`${styles.timelineItem} ${paymentDetail.transferInitiatedAt ? styles.completed : ''}`}
            data-testid="payment-timeline-transfer-created"
          >
            <div className={styles.timelineDot}>
              {paymentDetail.transferInitiatedAt ? '✓' : '⏳'}
            </div>
            <div className={styles.timelineContent}>
              <strong>Transfer Created</strong>
              <p>
                {paymentDetail.transferInitiatedAt
                  ? new Date(paymentDetail.transferInitiatedAt).toLocaleString()
                  : 'Pending'}
              </p>
            </div>
          </div>

          <div
            className={`${styles.timelineItem} ${paymentDetail.transferPaidAt ? styles.completed : ''}`}
            data-testid="payment-timeline-transfer-paid"
          >
            <div className={styles.timelineDot}>
              {paymentDetail.transferPaidAt ? '✓' : '⏳'}
            </div>
            <div className={styles.timelineContent}>
              <strong>Transfer Paid</strong>
              <p>
                {paymentDetail.transferPaidAt
                  ? new Date(paymentDetail.transferPaidAt).toLocaleString()
                  : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Booking */}
      {scheduler && (
        <div data-testid="payment-booking" className={styles.card}>
          <h2>Associated Service</h2>
          <div className={styles.bookingInfo}>
            <div>
              <strong>{scheduler!.title}</strong>
              <p>
                {new Date(scheduler!.startDate).toLocaleDateString()} -{' '}
                {new Date(scheduler!.endDate).toLocaleDateString()}
              </p>
            </div>
            <Link
              href={`/protected/integrator/scheduler/${scheduler!._id}`}
              className={styles.detailsButton}
            >
              View Booking
            </Link>
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className={styles.card}>
        <h2>Technical Details</h2>
        <div className={styles.technicalGrid}>
          <div>
            <span>Payment Intent ID</span>
            <code>{paymentDetail.paymentIntentId}</code>
          </div>
          {payment.transferId && (
            <div>
              <span>Transfer ID</span>
              <code>{paymentDetail.transferId}</code>
            </div>
          )}
          {payment.chargeId && (
            <div>
              <span>Charge ID</span>
              <code>{paymentDetail.chargeId}</code>
            </div>
          )}
          <div>
            <span>Payment Status</span>
            <code>{paymentDetail.paymentStatus}</code>
          </div>
          <div>
            <span>Transfer Status</span>
            <code>{paymentDetail.transferStatus}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
