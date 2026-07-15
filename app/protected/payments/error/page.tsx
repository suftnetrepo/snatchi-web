'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './error.module.css';

function PaymentErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  const handleRetry = () => {
    router.back();
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div data-testid="payment-error-icon" className={styles.icon}>
          ✕
        </div>
        <h1>Payment Failed</h1>
        <p data-testid="payment-error-message" className={styles.message}>
          {error || 'Your payment could not be processed. Your card was not charged.'}
        </p>

        <div className={styles.commonReasons}>
          <h3>Common reasons:</h3>
          <ul>
            <li>Insufficient funds</li>
            <li>Card declined by issuer</li>
            <li>Incorrect card details</li>
            <li>Card expired</li>
            <li>Transaction blocked by your bank</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <button onClick={handleRetry} className={styles.primaryBtn}>
            Try Again
          </button>
          <Link href="/protected/integrator/payments/made" className={styles.secondaryBtn}>
            Back to Payments
          </Link>
        </div>

        <p className={styles.support}>
          If the problem persists, please contact support at support@snatchi.io
        </p>
      </div>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentErrorContent />
    </Suspense>
  );
}
