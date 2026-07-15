'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './success.module.css';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const amount = searchParams.get('amount');
  const receivingIntegrator = searchParams.get('receivingIntegrator');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a brief loading to show success animation
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div data-testid="payment-success-icon" className={styles.icon}>
          ✓
        </div>
        <h1>Payment Successful!</h1>
        <p data-testid="payment-success-message" className={styles.message}>
          £{amount ? (parseInt(amount) / 100).toFixed(2) : '0.00'} has been sent to{' '}
          {receivingIntegrator || 'the receiving integrator'}
        </p>

        {paymentId && (
          <div className={styles.details}>
            <p>Payment ID: {paymentId}</p>
          </div>
        )}

        <div className={styles.actions}>
          {paymentId && (
            <Link
              href={`/protected/payments/${paymentId}`}
              data-testid="payment-success-details"
              className={styles.primaryBtn}
            >
              View Payment Details
            </Link>
          )}
          <Link
            href="/protected/integrator/payments/made"
            className={styles.secondaryBtn}
          >
            Back to Payments
          </Link>
        </div>

        <p className={styles.note}>
          The payment may take a few minutes to process. You can view the status in your payment details.
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
