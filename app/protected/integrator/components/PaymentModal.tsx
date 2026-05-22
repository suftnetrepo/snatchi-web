'use client';

import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styles from './PaymentModal.module.css';

const parseResponseBody = async (response: Response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

interface PaymentModalProps {
  schedulerId: string;
  engineerId: string;
  amount: number; // in pence/cents
  receivingIntegratorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
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
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [modalData, setModalData] = useState<ModalData>({});
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const platformFeePercentage = 10;
  const platformFeeAmount = Math.round(amount * (platformFeePercentage / 100));
  const netAmount = amount - platformFeeAmount;

  // Fetch modal data (engineer, integrators, etc.)
  useEffect(() => {
    const fetchModalData = async () => {
      if (!isOpen) return;
      
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
    try {
      setCardError(null);
      const response = await fetch('/api/stripe/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedulerId,
          amount,
        }),
      });

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data?.error || data?.details || 'Failed to create payment intent');
      }

      setPaymentIntentId(data.paymentIntentId);
      setClientSecret(data.clientSecret);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create payment intent';
      setCardError(message);
      onError(message);
      throw err;
    }
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
      // Create payment intent if not already created
      const paymentData = clientSecret ? null : await createPaymentIntent();
      const secret = clientSecret || paymentData?.clientSecret;

      if (!secret) {
        throw new Error('Failed to get payment intent');
      }

      // Confirm card payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const result = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: modalData.payingIntegrator?.name || 'Unknown',
          },
        },
      });

      if (result.error) {
        setCardError(result.error.message || 'Payment failed');
        onError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        const confirmResponse = await fetch('/api/stripe/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentIntentId: result.paymentIntent.id
          })
        });

        const confirmData = await parseResponseBody(confirmResponse);

        if (!confirmResponse.ok) {
          throw new Error(confirmData?.error || 'Failed to confirm payment');
        }

        onSuccess(paymentIntentId || result.paymentIntent.id);
        onClose();
      } else if (result.paymentIntent?.status === 'requires_action') {
        // 3D Secure or other authentication required
        setCardError('Additional verification required. Completing...');
        // The client_secret will handle the redirect
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setCardError(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div data-testid="payment-modal" className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div data-testid="payment-modal-header" className={styles.header}>
          <h2>Pay for Engineer Service</h2>
          <button
            data-testid="payment-close-btn"
            className={styles.closeBtn}
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading payment details...</div>
        ) : (
          <form onSubmit={handleSubmit} data-testid="payment-form" className={styles.form}>
            {/* Amount Breakdown */}
            <div data-testid="payment-breakdown" className={styles.breakdown}>
              <div className={styles.breakdownRow}>
                <span>Gross Amount:</span>
                <span data-testid="payment-gross-amount" className={styles.amount}>
                  £{(amount / 100).toFixed(2)}
                </span>
              </div>
              <div className={styles.breakdownRow}>
                <span>Platform Fee ({platformFeePercentage}%):</span>
                <span data-testid="payment-platform-fee" className={styles.amount}>
                  £{(platformFeeAmount / 100).toFixed(2)}
                </span>
              </div>
              <div className={styles.breakdownRowHighlight}>
                <span>
                  <strong>{modalData.receivingIntegrator?.name} receives:</strong>
                </span>
                <span data-testid="payment-net-amount" className={styles.amountHighlight}>
                  <strong>£{(netAmount / 100).toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Party Information */}
            <div data-testid="payment-parties" className={styles.parties}>
              <div data-testid="payment-paying-integrator" className={styles.party}>
                You ({modalData.payingIntegrator?.name}) will be charged
              </div>
              <div data-testid="payment-engineer-name" className={styles.party}>
                Engineer: {modalData.engineer?.first_name} {modalData.engineer?.last_name}
              </div>
              <div data-testid="payment-receiving-integrator" className={styles.partyWarning}>
                <strong>⚠️ {modalData.receivingIntegrator?.name} will receive £{(netAmount / 100).toFixed(2)}</strong>
              </div>
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
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#fa755a',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Error Display */}
            {cardError && (
              <div data-testid="payment-card-error" className={styles.error}>
                {cardError}
              </div>
            )}

            {/* Action Buttons */}
            <div data-testid="payment-actions" className={styles.actions}>
              <button
                data-testid="payment-cancel"
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                data-testid="payment-submit"
                type="submit"
                disabled={isProcessing || !stripe || !elements}
                className={styles.submitBtn}
              >
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
