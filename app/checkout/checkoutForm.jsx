import React, { useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function CheckoutForm({ subscription, handleError, handleSuccess, fields }) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    async function handleCheckout() {
      if (!stripe || !elements || !subscription.clientSecret) {
        return;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(subscription.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)
        }
      });

      if (error) {
        handleError(error?.message);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
          handleSuccess(fields);
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
