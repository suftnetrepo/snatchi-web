'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useIntegratorPaymentDetail,
  type IntegratorPaymentDetail
} from '@/hooks/useIntegratorPaymentDetail';

export default function PaymentDetailPage() {
  const params = useParams();
  const paymentId = typeof params.paymentId === 'string' ? params.paymentId : '';

  const { payment, loading, error } = useIntegratorPaymentDetail(paymentId);

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info">Loading payment details...</div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error || 'Payment not found'}</div>
        <Link href="/protected/integrator/payments/made" className="btn btn-secondary">
          Back to Payments
        </Link>
      </div>
    );
  }

  const paymentDetail: IntegratorPaymentDetail = payment;
  const scheduler = paymentDetail.scheduler;

  const formatCurrency = (amount: number) => {
    const symbol = paymentDetail.currency.toUpperCase() === 'USD' ? '$' : '£';
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    const baseClass = 'badge ';
    switch (status) {
      case 'succeeded':
        return baseClass + 'bg-success';
      case 'pending':
        return baseClass + 'bg-warning';
      case 'failed':
        return baseClass + 'bg-danger';
      case 'cancelled':
        return baseClass + 'bg-secondary';
      default:
        return baseClass + 'bg-info';
    }
  };

  return (
    <div className="container mt-5">
      <div className="mb-4">
        <Link href="/protected/integrator/payments/made" className="btn btn-outline-secondary">
          ← Back to Payments
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-light">
          <h2 className="card-title mb-0">Payment Details</h2>
        </div>

        <div className="card-body">
          {/* Status Section */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-bold">Payment Status</label>
                <div>
                  <span 
                    data-testid="payment-detail-payment-status"
                    className={getStatusBadgeClass(paymentDetail.paymentStatus)}
                  >
                    {paymentDetail.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-bold">Transfer Status</label>
                <div>
                  <span 
                    data-testid="payment-detail-transfer-status"
                    className={getStatusBadgeClass(paymentDetail.transferStatus)}
                  >
                    {paymentDetail.transferStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment IDs */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-bold">Payment Intent ID</label>
                <p data-testid="payment-detail-intent-id" className="font-monospace text-break">
                  {paymentDetail.paymentIntentId}
                </p>
              </div>
            </div>
            {paymentDetail.transferId && (
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Transfer ID</label>
                  <p data-testid="payment-detail-transfer-id" className="font-monospace text-break">
                    {paymentDetail.transferId}
                  </p>
                </div>
              </div>
            )}
            {paymentDetail.chargeId && (
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Charge ID</label>
                  <p data-testid="payment-detail-charge-id" className="font-monospace text-break">
                    {paymentDetail.chargeId}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Amount Breakdown */}
          <div className="row mb-4 p-3 bg-light rounded">
            <div className="col-md-4">
              <div className="text-center">
                <small className="text-muted d-block mb-2">Gross Amount</small>
                <h5 data-testid="payment-detail-gross-amount" className="mb-0">
                  {formatCurrency(paymentDetail.grossAmount)}
                </h5>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <small className="text-muted d-block mb-2">Platform Fee ({paymentDetail.platformFeePercentage}%)</small>
                <h5 data-testid="payment-detail-platform-fee" className="text-danger mb-0">
                  -{formatCurrency(paymentDetail.platformFeeAmount)}
                </h5>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <small className="text-muted d-block mb-2">Net Amount (to Company)</small>
                <h5 data-testid="payment-detail-net-amount" className="text-success mb-0">
                  {formatCurrency(paymentDetail.netAmount)}
                </h5>
              </div>
            </div>
          </div>

          {/* Parties Section */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-bold">Paying Company</label>
                <p data-testid="payment-detail-paying-integrator" className="mb-1">
                  <strong>{paymentDetail.payingIntegrator.name}</strong>
                </p>
                <small className="text-muted">{paymentDetail.payingIntegrator.email}</small>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-bold">Receiving Company</label>
                <p data-testid="payment-detail-receiving-integrator" className="mb-1">
                  <strong>{paymentDetail.receivingIntegrator.name}</strong>
                </p>
                <small className="text-muted">{paymentDetail.receivingIntegrator.email}</small>
              </div>
            </div>
          </div>

          {/* Engineer Section */}
          <div className="mb-4">
            <label className="form-label fw-bold">Engineer</label>
            <p data-testid="payment-detail-engineer-name" className="mb-1">
              <strong>
                {paymentDetail.engineer.first_name} {paymentDetail.engineer.last_name}
              </strong>
            </p>
            <small className="text-muted">{paymentDetail.engineer.email}</small>
          </div>

          {/* Booking Information */}
          {scheduler && (
            <div className="mb-4">
              <label className="form-label fw-bold">Booking</label>
              <p data-testid="payment-detail-booking-title" className="mb-1">
                <strong>{scheduler.title}</strong>
              </p>
              <small className="text-muted">
                {formatDate(scheduler.startDate)} to{' '}
                {formatDate(scheduler.endDate)}
              </small>
            </div>
          )}

          {/* Timeline Section */}
          <div className="mb-4">
            <label className="form-label fw-bold">Timeline</label>
            <div className="timeline">
              {paymentDetail.paymentInitiatedAt && (
                <div className="timeline-item">
                  <small className="text-muted d-block">Payment Initiated</small>
                  <span>{formatDate(paymentDetail.paymentInitiatedAt)}</span>
                </div>
              )}
              {paymentDetail.paymentAttemptedAt && (
                <div className="timeline-item">
                  <small className="text-muted d-block">Payment Attempted</small>
                  <span>{formatDate(paymentDetail.paymentAttemptedAt)}</span>
                </div>
              )}
              {paymentDetail.paymentSucceededAt && (
                <div className="timeline-item">
                  <small className="text-muted d-block">Payment Succeeded</small>
                  <span className="text-success fw-bold">{formatDate(paymentDetail.paymentSucceededAt)}</span>
                </div>
              )}
              {paymentDetail.transferInitiatedAt && (
                <div className="timeline-item">
                  <small className="text-muted d-block">Transfer Initiated</small>
                  <span>{formatDate(paymentDetail.transferInitiatedAt)}</span>
                </div>
              )}
              {paymentDetail.transferPaidAt && (
                <div className="timeline-item">
                  <small className="text-muted d-block">Transfer Paid</small>
                  <span className="text-success fw-bold">{formatDate(paymentDetail.transferPaidAt)}</span>
                </div>
              )}
              {paymentDetail.failedAt && (
                <div className="timeline-item">
                  <small className="text-muted d-block">Failed</small>
                  <span className="text-danger fw-bold">{formatDate(paymentDetail.failedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Information */}
          {paymentDetail.chargeFailureMessage && (
            <div className="alert alert-danger" data-testid="payment-detail-error-message">
              <strong>Payment Error:</strong>
              <p className="mb-0">{paymentDetail.chargeFailureMessage}</p>
            </div>
          )}

          {/* Notes */}
          {paymentDetail.notes && (
            <div className="mb-4">
              <label className="form-label fw-bold">Notes</label>
              <p data-testid="payment-detail-notes">{paymentDetail.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="row mt-4 pt-4 border-top text-muted">
            <div className="col-md-6">
              <small>
                Created: <span className="d-block">{formatDate(paymentDetail.createdAt)}</span>
              </small>
            </div>
            <div className="col-md-6">
              <small>
                Last Updated: <span className="d-block">{formatDate(paymentDetail.updatedAt)}</span>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  padding: 12px;
  border-left: 3px solid #007bff;
  background: #f8f9fa;
  border-radius: 4px;
}
`;
