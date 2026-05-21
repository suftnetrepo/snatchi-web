'use client';

import { useState } from 'react';

export const useStripeConnectStatus = () => {
  const [connectStatus, setConnectStatus] = useState(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState(null);

  const fetchConnectStatus = async () => {
    try {
      setConnectLoading(true);
      setConnectError(null);
      const response = await fetch('/api/stripe/integrator/connect-status');
      if (!response.ok) {
        throw new Error('Failed to fetch Connect status');
      }
      const data = await response.json();
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create onboarding link');
      }
      const data = await response.json();
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh onboarding');
      }
      const data = await response.json();
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
