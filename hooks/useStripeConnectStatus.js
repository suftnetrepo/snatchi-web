'use client';

import { useState } from 'react';

const parseResponseBody = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Request failed with ${response.status}`);
  }
};

export const useStripeConnectStatus = () => {
  const [connectStatus, setConnectStatus] = useState(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState(null);

  const fetchConnectStatus = async () => {
    try {
      setConnectLoading(true);
      setConnectError(null);
      const response = await fetch('/api/stripe/integrator/connect-status');
      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data?.error || `Request failed with ${response.status}`);
      }

      setConnectStatus(data);
    } catch (err) {
      setConnectError(err.message);
    } finally {
      setConnectLoading(false);
    }
  };

  const handleCreateOnboarding = async () => {
    try {
      setConnectLoading(true);
      setConnectError(null);
      const response = await fetch('/api/stripe/integrator/create-onboarding-link', {
        method: 'POST'
      });
      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data?.error || `Request failed with ${response.status}`);
      }

      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    } catch (err) {
      setConnectError(err.message);
    } finally {
      setConnectLoading(false);
    }
  };

  const handleRefreshOnboarding = async () => {
    try {
      setConnectLoading(true);
      setConnectError(null);
      const response = await fetch('/api/stripe/integrator/refresh-onboarding', {
        method: 'POST'
      });
      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data?.error || `Request failed with ${response.status}`);
      }

      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    } catch (err) {
      setConnectError(err.message);
    } finally {
      setConnectLoading(false);
    }
  };

  return {
    connectStatus,
    connectLoading,
    connectError,
    fetchConnectStatus,
    handleCreateOnboarding,
    handleRefreshOnboarding
  };
};
