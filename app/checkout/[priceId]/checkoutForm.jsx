'use client';

import React from 'react';
import { CardElement } from '@stripe/react-stripe-js';

export default function CheckoutForm() {
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

  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#ffffff',
        borderRadius: '8px'
      }}
    >
      <CardElement options={CARD_ELEMENT_OPTIONS} />
    </div>
  );
}