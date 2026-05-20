'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStripe } from '@stripe/react-stripe-js';

export default function CheckoutSuccessPage() {
  const stripe = useStripe();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handlePaymentConfirmation = async () => {
      if (!stripe) return;

      const clientSecret = searchParams.get('payment_intent_client_secret');

      if (!clientSecret) {
        setStatus('error');
        setError('Invalid return from payment processor');
        return;
      }

      try {
        // Retrieve the payment intent to check status
        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        if (!paymentIntent) {
          setStatus('error');
          setError('Payment intent not found');
          return;
        }

        switch (paymentIntent.status) {
          case 'succeeded':
            setStatus('success');
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              router.push('/protected/dashboard');
            }, 2000);
            break;

          case 'processing':
            setStatus('processing');
            // Redirect to dashboard (payment is processing)
            setTimeout(() => {
              router.push('/protected/dashboard');
            }, 2000);
            break;

          case 'requires_payment_method':
            setStatus('error');
            setError('Payment failed. Please try again with a different payment method.');
            // Redirect to checkout after 5 seconds
            setTimeout(() => {
              router.push('/checkout');
            }, 5000);
            break;

          default:
            setStatus('error');
            setError('Unexpected payment status. Please contact support.');
            break;
        }
      } catch (err) {
        setStatus('error');
        setError(err?.message || 'An error occurred during payment confirmation');
      }
    };

    handlePaymentConfirmation();
  }, [stripe, searchParams, router]);

  return (
    <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '500px', width: '100%' }}>
        {status === 'processing' && (
          <div>
            <h2>Processing Your Payment</h2>
            <p>Please wait while we confirm your payment...</p>
            <div style={{ marginTop: '20px', fontSize: '48px' }}>⏳</div>
          </div>
        )}

        {status === 'success' && (
          <div>
            <h2>Payment Successful!</h2>
            <p>Thank you for your subscription. Redirecting to your dashboard...</p>
            <div style={{ marginTop: '20px', fontSize: '48px' }}>✅</div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ color: 'red' }}>
            <h2>Payment Failed</h2>
            <p>{error}</p>
            <div style={{ marginTop: '20px', fontSize: '48px' }}>❌</div>
            <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
              Redirecting back to checkout...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
