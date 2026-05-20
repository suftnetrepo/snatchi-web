'use client';

import React, { useState } from 'react';
import { PaymentModal } from './PaymentModal';
import styles from './PaymentButton.module.css';

interface PaymentButtonProps {
  schedulerId: string;
  engineerId: string;
  amount: number; // in pence/cents
  receivingIntegratorId: string;
  engineerIntegratorId?: string;
  payingIntegratorId?: string;
  disabled?: boolean;
  className?: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  schedulerId,
  engineerId,
  amount,
  receivingIntegratorId,
  engineerIntegratorId,
  payingIntegratorId,
  disabled = false,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if self-payment (same integrator)
  const isSelfPayment = engineerIntegratorId && payingIntegratorId && engineerIntegratorId === payingIntegratorId;

  if (isSelfPayment) {
    return null; // Don't show button for self-payment
  }

  const handleOpenModal = () => {
    setError(null);
    setSuccess(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = (paymentId: string) => {
    setSuccess(true);
    setError(null);
    // Redirect to success page
    window.location.href = `/protected/payments/success?paymentId=${paymentId}&amount=${amount}&receivingIntegrator=${encodeURIComponent(receivingIntegratorId)}`;
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(false);
  };

  return (
    <>
      <button
        data-testid="pay-for-service-btn"
        onClick={handleOpenModal}
        disabled={disabled || isSelfPayment}
        className={`${styles.button} ${className}`}
        title={disabled ? 'Payment not available for this booking' : 'Pay for engineer service'}
      >
        Pay for Service
      </button>

      {error && (
        <div data-testid="payment-button-error" className={styles.error}>
          {error}
        </div>
      )}

      <PaymentModal
        schedulerId={schedulerId}
        engineerId={engineerId}
        amount={amount}
        receivingIntegratorId={receivingIntegratorId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </>
  );
};
