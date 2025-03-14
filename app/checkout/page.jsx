'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './checkoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = ({ handleError, subscription, handleSuccess, fields }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        handleError={handleError}
        subscription={subscription}
        handleSuccess={handleSuccess}
        fields={fields}
      />
    </Elements>
  );
};

export default CheckoutPage;
