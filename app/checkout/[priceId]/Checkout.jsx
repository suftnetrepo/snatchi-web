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
import styles from './checkout.module.scss';

const CHAT_USER_PASSWORD = '12345!';
const CheckOut = () => {
  const router = useRouter();
  const params = useParams();
  const stripe = useStripe();
  const elements = useElements();
  const [csrfToken, setCsrfToken] = useState('');
  const { handleSignUp } = useUserChat();
  const [enrichedFields, setEnrichedFields] = useState(null);
  const userCreatedRef = useRef(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [validationError, setValidationError] = useState({});
  const [cardError, setCardError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fields, setFields] = useState(checkoutValidator.fields);
  const { priceId } = params;
  const { handleNewSubscriber, handleErrorReset, loading, handleError, error, handleSuccess, pricing } =
    useSubscriber(priceId);

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
      return userCreatedRef.current;
    }

    const userData = await handleSuccess(userPayload);

    if (!userData) {
      return false;
    }

    userCreatedRef.current = userData;
    return userData;
  };

  const handleCheckout = async (clientSecret, userPayload) => {
    if (!stripe || !elements || !clientSecret) return false;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)
      }
    });

    if (error) {
      handleError(error.message);
      setCardError(error.message || 'Please check your card details.');
      const cardElement = elements.getElement(CardElement);
      cardElement?.clear();
      setIsProcessing(false);
      return false;
    }

    if (paymentIntent?.status === 'requires_payment_method') {
      setIsProcessing(false);
      return false;
    }

    if (paymentIntent?.status === 'succeeded') {
      
      handleSignUp(fields.email, CHAT_USER_PASSWORD).catch((error) => {
        console.error('Error signing up user:', error);
      });

      router.replace(`/checkout/success?token=${encodeURIComponent(userPayload?.checkoutToken || '')}`);
      return true;
    }

    setIsProcessing(false);
    return false;
  };

  const handleSubmit = async () => {
    if (loading || isProcessing) return;

    setValidationError({});
    setCardError('');
    const validationResult = validate(fields, checkoutValidator.rules);

    if (validationResult.hasError) {
      setValidationError(validationResult.errors);
      return;
    }

    if (clientSecret) {
      await handleCheckout(clientSecret, enrichedFields);
      return;
    }

    const pendingAccount = await ensureSubscriberRecord({ ...fields, priceId });
    if (!pendingAccount) return;

    handleNewSubscriber({
      priceId,
      contact: `${fields.first_name} ${fields.last_name}`,
      email: fields.email,
      integratorId: pendingAccount.integrator_id,
      onboardingToken: pendingAccount.onboardingToken
    }).then(async (subscriptionResult) => {
      if (subscriptionResult) {
        const fullFields = {
          ...fields,
          priceId,
          stripeCustomerId: subscriptionResult.customerId,
          subscriptionId: subscriptionResult.subscriptionId,
          checkoutToken: subscriptionResult.checkoutToken
        };

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
    <section className={styles.page}>
      <div className="container py-14 py-md-16">
        <div className={styles.checkoutCard}>
          <div className="row g-0">
            <div className="col-lg-6">
              <div className={styles.benefits}>
                <p className={styles.eyebrow}>Snatchi subscription</p>
                <h1 className={styles.title}>Start with {pricing?.planName || 'your selected plan'}</h1>
                <p className="mb-0 text-dark">Everything you need to organise projects and engineering teams.</p>

                <div className={styles.featureCard}>
                  <h6>{`Included with your ${pricing?.planName || ''} subscription:`}</h6>
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
            </div>

            <div className="col-lg-6">
              <div className={styles.formPanel}>
                <div className={styles.summary} aria-label="Order summary">
                  <div>
                    <p className={styles.summaryLabel}>{pricing?.planName || 'Subscription plan'}</p>
                    <p className={styles.summaryMeta}>{pricing?.billingCycle || pricing?.duration}</p>
                  </div>
                  <div className={styles.summaryPrice}>
                    {pricing?.currency}
                    {pricing?.raw_price}
                  </div>
                </div>
                <form className="contact-form needs-validation" onSubmit={(event) => event.preventDefault()}>
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
                          type="text"
                          name="first_name"
                          id="first_name"
                          value={fields.first_name}
                          className="form-control border-0"
                          placeholder=""
                          maxLength={50}
                          onChange={handleChange}
                        />
                        <label htmlFor="first_name" className="text-dark">
                          First name *
                        </label>
                      </div>
                      {validationError.first_name?.message && (
                        <span className="text-danger ps-2 fs-12">First name is required.</span>
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
                          Last name *
                        </label>
                      </div>
                      {validationError.last_name?.message && (
                        <span className="text-danger ps-2 fs-12">Last name is required.</span>
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
                  <label className={styles.fieldLabel}>Card details *</label>
                  <div className={`${styles.cardField} ${cardError ? styles.cardFieldError : ''}`}>
                    <CheckoutForm onChange={(event) => setCardError(event.error?.message || '')} />
                  </div>
                  {cardError && <span className="text-danger fs-12">{cardError}</span>}
                  <div className={styles.terms}>
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
                  <p className="text-muted fs-13 mb-3">
                    You will be charged {pricing?.currency}{pricing?.raw_price} today and again {pricing?.billingCycle === 'Monthly' ? 'monthly' : pricing?.billingCycle === 'Every 6 months' ? 'every six months' : 'yearly'} until cancelled. Manage or cancel your subscription through Stripe billing settings.
                  </p>
                  <div className={styles.actions}>
                    <Button
                      className={styles.payButton}
                      variant="primary"
                      type="button"
                      disabled={!fields.terms || loading || isProcessing || !stripe}
                      onClick={() => handleSubmit()}
                    >
                      {(loading || isProcessing) && (
                        <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />
                      )}
                      {loading || isProcessing
                        ? 'Processing secure payment…'
                        : `Pay securely ${pricing?.currency || ''}${pricing?.raw_price || ''}`}
                    </Button>
                    <Button className={styles.closeButton} type="button" onClick={() => router.push('/pricing')}>
                      Back to pricing
                    </Button>
                  </div>
                  <p className={styles.security}>
                    <span className={styles.securityIcon} aria-hidden="true">
                      ●
                    </span>
                    Secure, encrypted payment powered by Stripe
                  </p>
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
