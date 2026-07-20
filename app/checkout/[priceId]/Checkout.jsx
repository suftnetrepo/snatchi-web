'use client';

import React, { useEffect, useState, useRef } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import CheckoutForm from './checkoutForm';
import { checkoutValidator } from '../../../validator/checkoutValidator';
import { validate } from '../../../validator/validator';
import { useSubscriber } from '../../../hooks/useSubscriber';
import { useRouter, useParams } from 'next/navigation';
import ErrorDialogue from '@/components/elements/errorDialogue';
import { useUserChat } from '../../../hooks/useUserChat';
import { signIn, getCsrfToken } from 'next-auth/react';

const CheckOut = () => {
  const router = useRouter();
  const params = useParams();
  const stripe = useStripe();
  const elements = useElements();
  const [csrfToken, setCsrfToken] = useState('');
  const { handleSignUp } = useUserChat();
    const [enrichedFields, setEnrichedFields] = useState(null);
      const userCreatedRef = useRef(false);
    const [clientSecret, setClientSecret] = useState(null);
  const [validationError, setValidationError] = useState({});
  const [fields, setFields] = useState(checkoutValidator.fields);
  const { priceId } = params;
  const {
    handleNewSubscriber,
    handleErrorReset,
    loading,
    handleError,
    error,
    handleSuccess,
    pricing,
   
  } = useSubscriber(priceId);

  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields({
      ...fields,
      [name]: type === 'checkbox' ? checked : value
    });
  };
 
 const ensureSubscriberRecord = async (userPayload) => {
    if (userCreatedRef.current) {
      return true;
    }

    const userData = await handleSuccess(userPayload);

    if (!userData) {
      return false;
    }

    userCreatedRef.current = true;
    return true;
  };

  const handleCheckout = async (clientSecret, userPayload) => {
    if (!stripe || !elements || !clientSecret) return false;

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)
      }
    });

    if (error) {
      handleError(error.message);
      const cardElement = elements.getElement(CardElement);
      cardElement?.clear();
      return false;
    }

    if (paymentIntent?.status === 'requires_payment_method') {
      return false;
    }

    if (paymentIntent?.status === 'succeeded') {
      router.replace(
        `/checkout/success?stripeCustomerId=${userPayload?.stripeCustomerId}&email=${fields.email}&plan=${pricing?.planName}&amount=${pricing?.currency}${pricing?.raw_price}`
      );
      return true;
    }

    return false;
  };

  const handleSubmit = async () => {
    setValidationError({});
    const validationResult = validate(fields, checkoutValidator.rules);

    if (validationResult.hasError) {
      setValidationError(validationResult.errors);
      return;
    }

    if (clientSecret) {
      await handleCheckout(clientSecret, enrichedFields);
      return;
    }

    handleNewSubscriber({
      priceId,
      contact: `${fields.first_name} ${fields.last_name}`,
      email: fields.email
    }).then(async (subscriptionResult) => {
      if (subscriptionResult) {
        const fullFields = {
          ...fields,
          priceId,
          stripeCustomerId: subscriptionResult.customerId,
          subscriptionId: subscriptionResult.subscriptionId
        };

        const subscriberCreated = await ensureSubscriberRecord(fullFields);

        if (!subscriberCreated) {
          return;
        }

        setClientSecret(subscriptionResult.clientSecret);
        setEnrichedFields(fullFields);
        handleCheckout(subscriptionResult.clientSecret, fullFields).catch(() => {});
      }
    });
  };

  const handleClose = () => {
    router.push('/');
  };

  return (
    <section className="wrapper bg-light">
      <div className="container py-14 py-md-16">
        <div className="card bg-soft-primary mb-8">
          <div className="card-body p-12">
            <div className="row gx-md-8 gx-xl-12 gy-10">
              <div className="col-lg-6 ">
                <h2 className="display-5 mb-3 pe-lg-10 ps-2">Achieve More, Faster, and Smarter.</h2>
                <p className="ps-2 fn-20">Sign up today and see the difference!</p>

                <div className="bg-white p-3 rounded shadow-sm mt-4">
                  <h6 className="ps-2">{`Included with your ${pricing?.planName} subscription`}:</h6>
                  <ul className="icon-list bullet-bg bullet-soft-primary  ps-2">
                    {pricing?.features?.map((feature, index) => {
                      return (
                        <li key={index}>
                          <i className="uil uil-check" />
                          <span className="text-dark">{feature}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="col-lg-6 d-flex align-items-center justify-content-center">
                <form className="contact-form needs-validation">
                  <div className="row gx-4 mb-3">
                    <div className="col-12 mb-2">
                      <div className="form-floating ">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={fields.name}
                          className="form-control border-0"
                          placeholder=""
                          maxLength={50}
                          onChange={handleChange}
                        />
                        <label htmlFor="name" className="text-dark">
                          Company *
                        </label>
                      </div>
                      {validationError.name?.message && (
                        <span className="text-danger ps-2 fs-12">Company is required.</span>
                      )}
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="first_name"
                          name="first_name"
                          id="first_name"
                          value={fields.first_name}
                          className="form-control border-0"
                          placeholder=""
                          maxLength={50}
                          onChange={handleChange}
                        />
                        <label htmlFor="first_name" className="text-dark">
                          FirstName *
                        </label>
                      </div>
                      {validationError.first_name?.message && (
                        <span className="text-danger ps-2 fs-12">FirstName is Required.</span>
                      )}
                    </div>

                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          name="last_name"
                          id="last_name"
                          value={fields.last_name}
                          placeholder=""
                          className="form-control border-0"
                          maxLength={20}
                          onChange={handleChange}
                        />
                        <label htmlFor="last_name" className="text-dark">
                          LastName *
                        </label>
                      </div>
                      {validationError.last_name?.message && (
                        <span className="text-danger ps-2 fs-12">LastName is Required.</span>
                      )}
                    </div>
                    <div className="col-md-6 mt-2">
                      <div className="form-floating">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={fields.email}
                          className="form-control border-0"
                          placeholder=""
                          maxLength={50}
                          onChange={handleChange}
                        />
                        <label htmlFor="email" className="text-dark">
                          Email *
                        </label>
                      </div>
                      {validationError.email?.message && (
                        <span className="text-danger ps-2 fs-12">{validationError.email?.message}</span>
                      )}
                    </div>

                    <div className="col-md-6 mt-2">
                      <div className="form-floating">
                        <input
                          type="text"
                          name="mobile"
                          id="mobile"
                          value={fields.mobile}
                          placeholder=""
                          className="form-control border-0"
                          maxLength={20}
                          onChange={handleChange}
                        />
                        <label htmlFor="mobile" className="text-dark">
                          Mobile *
                        </label>
                      </div>
                      {validationError.mobile?.message && (
                        <span className="text-danger ps-2 fs-12">Mobile is Required.</span>
                      )}
                    </div>
                  </div>
                  <CheckoutForm />
                  <div className="form-check mb-3 mt-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="terms"
                      id="terms"
                      checked={fields.terms}
                      onChange={handleChange}
                    />
                    <label className="form-check-label fs-14" htmlFor="terms">
                      By signing up, you acknowledge that you have read and understood, and agree to{' '}
                      <a href="/privacyPolicy">
                        <strong>Privacy Policy</strong>
                      </a>{' '}
                      and{' '}
                      <a href="/termsAndCondition">
                        <strong>Terms and Conditions</strong>
                      </a>
                      .
                    </label>
                  </div>
                  <div className="col-12 mt-3">
                    {loading ? (
                      <Button
                        variant="primary"
                        onClick={() => handleSubmit()}
                        value={`Pay Now ${pricing?.currency}${pricing?.raw_price}`}
                      >
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        <span className="visually-hidden">Loading...</span>
                      </Button>
                    ) : (
                      <div className="col-12 mt-3 ms-1">
                        <Button
                          className="text-white rounded-pill"
                          variant="primary"
                          size="sm"
                          disabled={!fields.terms}
                          onClick={() => handleSubmit()}
                        >
                          {`Pay Now ${pricing?.currency}${pricing?.raw_price}`}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="ms-2 text-white rounded-pill"
                          onClick={() => handleClose()}
                        >
                          Close
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {error && <ErrorDialogue showError={error} message={error} onClose={() => handleErrorReset()} />}
    </section>
  );
};

export default CheckOut;
