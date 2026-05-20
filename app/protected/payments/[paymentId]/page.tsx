'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './detail.module.css';

interface PaymentDetail {
  _id: string;
  paymentIntentId: string;
  transferId?: string;
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  paymentStatus: string;
  transferStatus: string;
  chargeId?: string;
  chargeFailureCode?: string;
  chargeFailureMessage?: string;
  engineer: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  payingIntegrator: {
    _id: string;
    name: string;
  };
  receivingIntegrator: {
    _id: string;
    name: string;
  };
  scheduler?: {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  paymentInitiatedAt: string;
  chargeSucceededAt?: string;
  transferInitiatedAt?: string;
  transferPaidAt?: string;
}

export default function PaymentDetailPage() {
  const params = useParams();
  const paymentId = params.paymentId as string;

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/stripe/payment/status?paymentId=${paymentId}`);

        if (!response.ok) {
          throw new Error('Failed to load payment details');
        }

        const data = await response.json();
        setPayment(data.payment);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      fetchPayment();
    }
  }, [paymentId]);

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

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerSection}>
        <div>
          <h1 data-testid="payment-detail-header">
            Payment #{payment.paymentIntentId.slice(-8).toUpperCase()}
          </h1>
          <Link href="/protected/integrator/payments/made" className={styles.backLink}>
            ← Back to Payments
          </Link>
        </div>
        <span
          data-testid={`payment-status-${payment.paymentStatus}`}
          className={`${styles.statusBadge} ${styles[`status-${payment.paymentStatus}`]}`}
          style={{ color: statusColor[payment.paymentStatus as keyof typeof statusColor] }}
        >
          {payment.paymentStatus.toUpperCase()}
        </span>
      </div>

      {/* Amount Summary */}
      <div data-testid="payment-summary" className={styles.card}>
        <h2>Amount Breakdown</h2>
        <div className={styles.amountGrid}>
          <div className={styles.amountItem}>
            <span>Gross Amount</span>
            <strong data-testid="payment-gross-total">£{(payment.grossAmount / 100).toFixed(2)}</strong>
          </div>
          <div className={styles.amountItem}>
            <span>Platform Fee (10%)</span>
            <strong data-testid="payment-fee-deducted">-£{(payment.platformFeeAmount / 100).toFixed(2)}</strong>
          </div>
          <div className={styles.amountItemHighlight}>
            <span>Net Received</span>
            <strong data-testid="payment-net-received">£{(payment.netAmount / 100).toFixed(2)}</strong>
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
              {payment.payingIntegrator.name}
            </strong>
          </div>
          <div className={styles.partyItem}>
            <span className={styles.partyLabel}>Received By</span>
            <strong data-testid="payment-party-receiving">
              {payment.receivingIntegrator.name}
            </strong>
          </div>
          <div className={styles.partyItem}>
            <span className={styles.partyLabel}>For Engineer</span>
            <strong data-testid="payment-party-engineer">
              {payment.engineer.first_name} {payment.engineer.last_name}
            </strong>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div data-testid="payment-timeline" className={styles.card}>
        <h2>Payment Timeline</h2>
        <div className={styles.timeline}>
          <div
            className={`${styles.timelineItem} ${payment.paymentInitiatedAt ? styles.completed : ''}`}
            data-testid="payment-timeline-initiated"
          >
            <div className={styles.timelineDot}>
              {payment.paymentInitiatedAt ? '✓' : '⏳'}
            </div>
            <div className={styles.timelineContent}>
              <strong>Payment Initiated</strong>
              <p>{new Date(payment.paymentInitiatedAt).toLocaleString()}</p>
            </div>
          </div>

          <div
            className={`${styles.timelineItem} ${payment.chargeSucceededAt ? styles.completed : ''}`}
            data-testid="payment-timeline-charged"
          >
            <div className={styles.timelineDot}>
              {payment.chargeSucceededAt ? '✓' : '⏳'}
            </div>
            <div className={styles.timelineContent}>
              <strong>Payment Charged</strong>
              <p>
                {payment.chargeSucceededAt
                  ? new Date(payment.chargeSucceededAt).toLocaleString()
                  : 'Pending'}
              </p>
              {payment.chargeFailureMessage && (
                <p className={styles.errorText}>{payment.chargeFailureMessage}</p>
              )}
            </div>
          </div>

          <div
            className={`${styles.timelineItem} ${payment.transferInitiatedAt ? styles.completed : ''}`}
            data-testid="payment-timeline-transfer-created"
          >
            <div className={styles.timelineDot}>
              {payment.transferInitiatedAt ? '✓' : '⏳'}
            </div>
            <div className={styles.timelineContent}>
              <strong>Transfer Created</strong>
              <p>
                {payment.transferInitiatedAt
                  ? new Date(payment.transferInitiatedAt).toLocaleString()
                  : 'Pending'}
              </p>
            </div>
          </div>

          <div
            className={`${styles.timelineItem} ${payment.transferPaidAt ? styles.completed : ''}`}
            data-testid="payment-timeline-transfer-paid"
          >
            <div className={styles.timelineDot}>
              {payment.transferPaidAt ? '✓' : '⏳'}
            </div>
            <div className={styles.timelineContent}>
              <strong>Transfer Paid</strong>
              <p>
                {payment.transferPaidAt
                  ? new Date(payment.transferPaidAt).toLocaleString()
                  : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Booking */}
      {payment.scheduler && (
        <div data-testid="payment-booking" className={styles.card}>
          <h2>Associated Service</h2>
          <div className={styles.bookingInfo}>
            <div>
              <strong>{payment.scheduler.title}</strong>
              <p>
                {new Date(payment.scheduler.startDate).toLocaleDateString()} -{' '}
                {new Date(payment.scheduler.endDate).toLocaleDateString()}
              </p>
            </div>
            <Link
              href={`/protected/integrator/scheduler/${payment.scheduler._id}`}
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
            <code>{payment.paymentIntentId}</code>
          </div>
          {payment.transferId && (
            <div>
              <span>Transfer ID</span>
              <code>{payment.transferId}</code>
            </div>
          )}
          {payment.chargeId && (
            <div>
              <span>Charge ID</span>
              <code>{payment.chargeId}</code>
            </div>
          )}
          <div>
            <span>Payment Status</span>
            <code>{payment.paymentStatus}</code>
          </div>
          <div>
            <span>Transfer Status</span>
            <code>{payment.transferStatus}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
