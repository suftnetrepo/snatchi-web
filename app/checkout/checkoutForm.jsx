import React, { useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

/**
 * Stripe Payment Confirmation API
 * 
 * IMPORTANT: CardElement vs PaymentElement requires different APIs:
 * - CardElement (current) → Use confirmCardPayment()
 * - PaymentElement (future)  → Use confirmPayment()
 * 
 * DO NOT MIX: confirmPayment() requires PaymentElement and will fail with CardElement
 * 
 * TODO: PaymentElement Migration
 * Current: CardElement + confirmCardPayment() (secure, production-ready, single card only)
 * Future: PaymentElement + confirmPayment() (200+ payment methods, enhanced UX)
 * Status: Planned for Phase 2 (2-4 weeks)
 * 
 * When migrating to PaymentElement:
 * 1. Replace <CardElement /> with <PaymentElement />
 * 2. Update confirmCardPayment() → confirmPayment({ elements, ... })
 * 3. Remove CardElement styling (PaymentElement manages its own)
 * 4. Full QA testing (SCA/3DS, mobile, international cards)
 * 5. Monitor conversion metrics post-launch
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
        // Get CardElement for payment processing
        const cardElement = elements.getElement(CardElement);
        
        if (!cardElement) {
          handleError('Payment form not ready');
          return;
        }

        // Use confirmCardPayment() for CardElement
        // (confirmPayment() is only for PaymentElement)
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          subscription.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: `${fields.first_name} ${fields.last_name}`,
                email: fields.email,
                phone: fields.mobile,
              },
            },
          }
        );

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
