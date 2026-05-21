'use client';

import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styles from './PaymentModal.module.css';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedulerId: string;
  amount: number;
  engineer: {
    id: string;
    name: string;
  };
  receivingIntegrator: {
    id: string;
    name: string;
  };
  payingIntegrator: {
    name: string;
    email: string;
  };
  platformFeePercentage: number;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  schedulerId,
  amount,
  engineer,
  receivingIntegrator,
  payingIntegrator,
  platformFeePercentage,
  onPaymentSuccess,
  onPaymentError
}: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Calculate amounts
  const platformFeeAmount = Math.round((amount * platformFeePercentage) / 100);
  const netAmount = amount - platformFeeAmount;

  // Create payment intent
  useEffect(() => {
    if (!isOpen) return;

    const createPaymentIntent = async () => {
      try {
        setError(null);
        const response = await fetch('/api/stripe/payment/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            schedulerId,
            amount
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        setPaymentIntentId(data.paymentIntentId);
        setClientSecret(data.clientSecret);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize payment';
        setError(message);
        onPaymentError(message);
      }
    };

    createPaymentIntent();
  }, [isOpen, schedulerId, amount, onPaymentError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment form not ready');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: payingIntegrator.name,
              email: payingIntegrator.email
            }
          }
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm payment in backend
        const confirmResponse = await fetch('/api/stripe/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id
          })
        });

        if (!confirmResponse.ok) {
          throw new Error('Failed to confirm payment');
        }

        onPaymentSuccess(paymentIntent.id);
        onClose();
      } else {
        throw new Error(`Payment status: ${paymentIntent?.status}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment processing failed';
      setError(message);
      onPaymentError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} data-testid="payment-modal-backdrop">
      <div className={styles.modal} data-testid="payment-modal">
        <button
          className={styles.closeButton}
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
        >
          ✕
        </button>

        <div className={styles.header}>
          <h2>Complete Payment</h2>
          <p className={styles.subtitle}>Pay for engineer services</p>
        </div>

        <div className={styles.content}>
          {/* Summary */}
          <div data-testid="payment-summary" className={styles.summary}>
            <div className={styles.summarySection}>
              <h3>Payment Details</h3>
              <div className={styles.details}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Engineer:</span>
                  <span data-testid="payment-engineer-name" className={styles.value}>
                    {engineer.name}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Company:</span>
                  <span data-testid="payment-receiving-integrator" className={styles.value}>
                    {receivingIntegrator.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className={styles.summarySection}>
              <h3>Amount Breakdown</h3>
              <div className={styles.breakdown}>
                <div className={styles.breakdownRow}>
                  <span className={styles.label}>Gross Amount:</span>
                  <span data-testid="payment-gross-amount" className={styles.amount}>
                    £{(amount / 100).toFixed(2)}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.label}>Platform Fee ({platformFeePercentage}%):</span>
                  <span data-testid="payment-platform-fee" className={`${styles.amount} ${styles.fee}`}>
                    -£{(platformFeeAmount / 100).toFixed(2)}
                  </span>
                </div>
                <div className={`${styles.breakdownRow} ${styles.total}`}>
                  <span className={styles.label}>Amount to Company:</span>
                  <span data-testid="payment-net-amount" className={styles.amount}>
                    £{(netAmount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className={styles.form} data-testid="payment-form">
            <div className={styles.formSection}>
              <label htmlFor="card-element" className={styles.label}>
                Card Details
              </label>
              <div data-testid="card-element-container" className={styles.cardContainer}>
                <CardElement
                  id="card-element"
                  options={{
                    style: {
                      base: {
                        color: '#32325d',
                        fontFamily: 'Arial, sans-serif',
                        fontSmoothing: 'antialiased',
                        fontSize: '16px',
                        '::placeholder': {
                          color: '#aab7c4'
                        }
                      },
                      invalid: {
                        color: '#fa755a',
                        iconColor: '#fa755a'
                      }
                    },
                    hidePostalCode: true
                  }}
                />
              </div>
            </div>

            {error && (
              <div data-testid="payment-error" className={styles.error}>
                {error}
              </div>
            )}

            <div className={styles.footer}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !stripe || !clientSecret}
                data-testid="payment-submit"
              >
                {loading ? 'Processing...' : `Pay £${(amount / 100).toFixed(2)}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
