import React, { useState, useEffect } from 'react';
import { VERBS } from '../config';
import { STRIPE, SUBSCRIBER } from '../utils/apiUrl';
import { zat } from '../utils/api';
import { pricingList } from '../src/data/pricing';

const useSubscriber = (priceId) => {
  const [state, setState] = useState({
    customer: {},
    subscription: {},
    portalSession:{},
    loading: false,
    error: null,
    success: false,
    pricing: {}
  });

  const handlePricing = (priceId) => {
    const plan = pricingList.find((j) => j.priceId === priceId);
    setState((pre) => {
      return { ...pre, pricing: plan };
    });
  };

  const handleErrorReset = () => {
    setState((pre) => {
      return { ...pre, error: null };
    });
  };

  const handleError = (error) => {
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleSpinner = () => {
    setState((pre) => {
      return { ...pre, loading: true };
    });
  };

  const handleSuccess = async (body) => {
    handleSpinner();
    const { success, errorMessage, data } = await zat(SUBSCRIBER.createIntegrator, body, VERBS.POST);

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: data,
        loading: false
      }));
      return data;
    } else {
      handleError(errorMessage || 'Failed to create user.');
      return false;
    }
  };

  async function handleNewCustomer(body) {
    handleSpinner();
    const { success, errorMessage, data } = await zat(STRIPE.createCustomer, body, VERBS.POST);

    if (success) {
      setState((prevState) => ({
        ...prevState,
        customer: data,
        loading: false
      }));
      return data;
    } else {
      handleError(errorMessage || 'Failed to update the user.');
      return false;
    }
  }

  async function handleNewSubscriber(body) {
    handleSpinner();
    const { success, errorMessage, data } = await zat(STRIPE.createSubscriber, body, VERBS.POST);

    if (success) {
      setState((prevState) => ({
        ...prevState,
        subscription: {
          ...data
        },
        loading: false
      }));
      return data;
    } else {
      handleError(errorMessage || 'Failed to update the user.');
      return false;
    }
  }

  async function handleCustomerPortalSession(body) {   
    const { success, errorMessage, data } = await zat(STRIPE.createCustomerPortalSession, body, VERBS.POST);

    if (success) {
      setState((prevState) => ({
        ...prevState,
        portalSession: data,
        loading: false
      }));
      return data;
    } else {
      handleError(errorMessage || 'Failed to update the user.');
      return false;
    }
  }

  useEffect(() => {
    handlePricing(priceId);
  }, [priceId]);

  return {
    ...state,
    handleNewCustomer,
    handleNewSubscriber,
    handleError,
    handleErrorReset,
    handleSuccess,
    handleCustomerPortalSession
   };
};

export { useSubscriber };
