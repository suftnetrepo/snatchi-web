'use client';

import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentModal from './PaymentModal';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentButtonProps {
  schedulerId: string;
  amount: number; // in pence/cents
  engineer: {
    id: string;
    name: string;
  };
  receivingIntegrator: {
    id: string;
    name: string;
  };
  payingIntegrator: {
    id: string;
    name: string;
    email: string;
  };
  platformFeePercentage: number;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  label?: string;
}

export default function PaymentButton({
  schedulerId,
  amount,
  engineer,
  receivingIntegrator,
  payingIntegrator,
  platformFeePercentage,
  onSuccess,
  onError,
  className = '',
  label = 'Pay for Service'
}: PaymentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePaymentSuccess = (paymentId: string) => {
    setSuccessMessage('Payment completed successfully!');
    setIsModalOpen(false);
    onSuccess?.(paymentId);
    
    // Clear message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  const handlePaymentError = (error: string) => {
    setErrorMessage(error);
    onError?.(error);
    
    // Clear message after 5 seconds
    setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

  return (
    <>
      <button
        data-testid="payment-trigger-button"
        onClick={() => {
          setErrorMessage(null);
          setIsModalOpen(true);
        }}
        className={`btn btn-primary ${className}`}
        disabled={amount <= 0}
      >
        {label}
      </button>

      {successMessage && (
        <div 
          data-testid="payment-success" 
          className="alert alert-success alert-dismissible fade show mt-2"
          role="alert"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
            onClick={() => setSuccessMessage(null)}
          ></button>
        </div>
      )}

      {errorMessage && (
        <div 
          data-testid="payment-error" 
          className="alert alert-danger alert-dismissible fade show mt-2"
          role="alert"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
            onClick={() => setErrorMessage(null)}
          ></button>
        </div>
      )}

      <Elements stripe={stripePromise}>
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          schedulerId={schedulerId}
          amount={amount}
          engineer={engineer}
          receivingIntegrator={receivingIntegrator}
          payingIntegrator={payingIntegrator}
          platformFeePercentage={platformFeePercentage}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      </Elements>
    </>
  );
}
