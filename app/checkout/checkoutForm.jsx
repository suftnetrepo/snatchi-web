import React, { useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

/**
 * TODO: PaymentElement Migration
 * 
 * Current: CardElement + confirmPayment() API (modern, secure, production-ready)
 * Future: PaymentElement + confirmPayment() API (enhanced UX, 200+ payment methods)
 * 
 * Status: Holding for Phase 2 stability (2-4 weeks)
 * Plan: See STRIPE_PAYMENTELEMENT_MIGRATION_PLAN.md for full details
 * 
 * Why not now:
 * - Current implementation is secure and modern
 * - Need to stabilize Phase 2 features first
 * - PaymentElement migration has UX/testing impact
 * - Better to rollout when production is stable
 * 
 * When migrating:
 * 1. Replace CardElement with PaymentElement
 * 2. Update confirmPayment parameters
 * 3. Remove CardElement styling (PaymentElement manages its own)
 * 4. Full QA testing (especially SCA/3DS and mobile)
 * 5. Monitor conversion metrics in production
 */

export default function CheckoutForm({ subscription, handleError, handleSuccess, fields }) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    async function handleCheckout() {
      if (!stripe || !elements || !subscription.clientSecret) {
        return;
      }

      try {
        // Use modern confirmPayment API instead of deprecated confirmCardPayment
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret: subscription.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/checkout/success`,
            payment_method_data: {
              billing_details: {
                // Billing details auto-collected from CardElement
              }
            }
          },
          redirect: 'if_required' // Only redirect if SCA/3DS required
        });

        if (error) {
          handleError(error?.message);
          return;
        }

        // If no redirect required, payment succeeded immediately
        if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
          handleSuccess(fields);
        }
      } catch (err) {
        handleError(err?.message || 'Payment processing failed');
      }
    }

    handleCheckout();
  }, [subscription]);

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        },
        border: '3px solid #32325d',
        backgroundColor: '#ffffff'
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    },
    hidePostalCode: true
  };

  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#ffffff',
        border: '0.5px solid #fbfbfc',
        borderRadius: '8px'
      }}
    >
      <CardElement options={CARD_ELEMENT_OPTIONS} />
    </div>
  );
}
