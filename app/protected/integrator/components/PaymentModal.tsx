'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styles from './PaymentModal.module.css';
import { dateFormatted } from '@/utils/helpers';

const parseResponseBody = async (response: Response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

interface Schedule {
  _id: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  estimatedAmount?: number;
  paymentStatus?: string;
  status?: string;
  paymentReference?: string;
  engineer?: { _id: string; first_name: string; last_name: string };
  project?: { _id: string; name: string } | string;
}

interface PaymentModalProps {
  schedulerId: string;
  engineerId: string;
  amount: number; // in pence/cents
  receivingIntegratorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  schedule?: Schedule;
}

interface ModalData {
  engineer?: { _id: string; first_name: string; last_name: string };
  receivingIntegrator?: { _id: string; name: string };
  payingIntegrator?: { _id: string; name: string };
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  schedulerId,
  engineerId,
  amount,
  receivingIntegratorId,
  isOpen,
  onClose,
  onSuccess,
  onError,
  schedule,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [modalData, setModalData] = useState<ModalData>({});
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');

  const platformFeePercentage = 10;
  const platformFeeAmount = Math.round(amount * (platformFeePercentage / 100));
  const netAmount = amount - platformFeeAmount;

  // Fetch modal data (engineer, integrators, etc.)
  useEffect(() => {
    if (!isOpen) return;
    setPaymentSuccess(false);
    setCardError(null);
    setClientSecret(null);
    setCardholderName('');

    const fetchModalData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/stripe/payment/data?schedulerId=${schedulerId}&engineerId=${engineerId}&receivingIntegratorId=${receivingIntegratorId}`);
        const data = await parseResponseBody(response);
        
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load payment data');
        }

        setModalData(data);
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };

    fetchModalData();
  }, [isOpen, schedulerId, engineerId, receivingIntegratorId, onError]);

  // Create payment intent
  const createPaymentIntent = async () => {
    const response = await fetch('/api/stripe/payment/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedulerId, amount }),
    });
    const data = await parseResponseBody(response);
    if (!response.ok) throw new Error(data?.error || data?.details || 'Failed to create payment intent');
    setClientSecret(data.clientSecret);
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setCardError('Payment system not initialized');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      const paymentData = clientSecret ? null : await createPaymentIntent();
      const secret = clientSecret || paymentData?.clientSecret;

      if (!secret) throw new Error('Failed to get payment intent');

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const result = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName || modalData.payingIntegrator?.name || 'Unknown',
          },
        },
      });

      if (result.error) {
        setCardError(result.error.message || 'Payment failed');
        onError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        const confirmResponse = await fetch('/api/stripe/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: result.paymentIntent.id }),
        });

        const confirmData = await parseResponseBody(confirmResponse);
        if (!confirmResponse.ok) throw new Error(confirmData?.error || 'Failed to confirm payment');

        // Show success animation, then auto-close
        setPaymentSuccess(true);
        setTimeout(() => {
          onSuccess(result.paymentIntent!.id);
        }, 1500);
      } else if (result.paymentIntent?.status === 'requires_action') {
        setCardError('Additional verification required. Completing…');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setCardError(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    onClose();
  };

  if (!isOpen) return null;

  const engineerName = schedule?.engineer
    ? `${schedule.engineer.first_name} ${schedule.engineer.last_name}`
    : `${modalData.engineer?.first_name || ''} ${modalData.engineer?.last_name || ''}`.trim() || '—';

  const projectName =
    schedule?.project && typeof schedule.project === 'object'
      ? (schedule.project as { name: string }).name
      : '—';

  return (
    <div data-testid="payment-modal" className={styles.modalBackdrop} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div data-testid="payment-modal-header" className={styles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              Complete Payment
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Secure payment powered by Stripe
            </p>
          </div>
          <button
            data-testid="payment-close-btn"
            className={styles.closeBtn}
            onClick={handleClose}
            type="button"
            disabled={isProcessing}
          >
            ✕
          </button>
        </div>

        {/* Success state */}
        {paymentSuccess ? (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successTitle}>Payment Successful</div>
            <div className={styles.successSubtitle}>Closing automatically…</div>
          </div>
        ) : loading ? (
          <div className={styles.loading}>Loading payment details…</div>
        ) : (
          <div className={styles.drawerBody}>

            {/* Schedule Summary Card */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>Schedule Summary</div>
              <div className={styles.summaryGrid}>
                {projectName && projectName !== '—' && (
                  <div className={`${styles.summaryItem} ${styles.summaryFullRow}`}>
                    <span className={styles.summaryLabel}>Project</span>
                    <span className={styles.summaryValue}>{projectName}</span>
                  </div>
                )}
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Engineer</span>
                  <span className={styles.summaryValue}>{engineerName}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Status</span>
                  <span className={styles.summaryValue}>Awaiting Payment</span>
                </div>
                {schedule?.startDate && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Start Date</span>
                    <span className={styles.summaryValue}>{dateFormatted(schedule.startDate)}</span>
                  </div>
                )}
                {schedule?.endDate && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>End Date</span>
                    <span className={styles.summaryValue}>{dateFormatted(schedule.endDate)}</span>
                  </div>
                )}
                {schedule?.paymentReference && (
                  <div className={`${styles.summaryItem} ${styles.summaryFullRow}`}>
                    <span className={styles.summaryLabel}>Payment Reference</span>
                    <span className={styles.summaryValue} style={{ fontFamily: 'monospace', fontSize: 13 }}>
                      {schedule.paymentReference}
                    </span>
                  </div>
                )}
                <div className={`${styles.summaryItem} ${styles.summaryFullRow}`}>
                  <span className={styles.summaryLabel}>Amount</span>
                  <span className={styles.summaryAmountValue}>£{(amount / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} data-testid="payment-form">

              {/* Cardholder Name */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Cardholder Name</label>
                <input
                  type="text"
                  className={styles.nameInput}
                  placeholder="Name on card"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  disabled={isProcessing}
                  autoComplete="cc-name"
                />
              </div>

              {/* Card Element */}
              <div className={styles.formGroup}>
                <label htmlFor="card-element" className={styles.label}>
                  Card Details
                </label>
                <div
                  data-testid="stripe-card-element"
                  className={styles.cardElement}
                  id="card-element"
                >
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '15px',
                          color: '#1e293b',
                          '::placeholder': { color: '#94a3b8' },
                        },
                        invalid: { color: '#dc2626' },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Error Banner */}
              {cardError && (
                <div data-testid="payment-card-error" className={styles.error}>
                  <strong>Payment failed</strong><br />
                  {cardError}<br />
                  <small style={{ color: '#991b1b' }}>Please try another payment method.</small>
                </div>
              )}

              <div className={styles.divider} />

              {/* Total Row */}
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalAmount}>£{(amount / 100).toFixed(2)}</span>
              </div>

              {/* Submit */}
              <button
                data-testid="payment-submit"
                type="submit"
                disabled={isProcessing || !stripe || !elements}
                className={styles.submitBtn}
              >
                {isProcessing && <span className={styles.spinner} />}
                {isProcessing ? 'Processing Payment…' : `Pay £${(amount / 100).toFixed(2)}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
