'use client';

import { CardElement } from '@stripe/react-stripe-js';

export default function CheckoutForm({ onChange }) {
  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '16px',
        '::placeholder': { color: '#aab7c4' }
      },
      invalid: {
        color: '#fa755a'
      }
    },
    hidePostalCode: true
  };

  return <CardElement options={CARD_ELEMENT_OPTIONS} onChange={onChange} />;
}
