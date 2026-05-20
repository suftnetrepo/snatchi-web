'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { pricingList } from '@/src/data/pricing';
import { isInTrial, getDaysRemainingInTrial, formatTrialStatus } from '@/app/api/utils/trial-period';

/**
 * Subscription Management Page
 * 
 * This page displays subscription overview and trial status.
 * All subscription modifications (upgrade, downgrade, cancel) are now handled
 * exclusively through Stripe Billing Portal for a single source of truth.
 * 
 * Stripe Portal handles:
 * - Plan changes (upgrades/downgrades with proration)
 * - Subscription cancellation
 * - Payment method management
 * - Invoice history and downloads
 * - Billing address updates
 * - Tax ID management
 */

export default function SubscriptionManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch subscription details
  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/user/subscription', {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        setSubscription(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
        setError(err.response?.data?.error || 'Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [session, router]);

  // Open customer portal for subscription management
  const handleOpenBillingPortal = async () => {
    try {
      const response = await axios.post('/api/stripe/customerPortal', {
        customerId: subscription?.stripeCustomerId
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Failed to open billing portal:', err);
      setError('Could not open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Active Subscription</h2>
          <p className="text-gray-600 mb-6">You don't have an active subscription yet.</p>
          <button
            onClick={() => router.push('/pricing')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const currentPlan = pricingList.find(p => p.planName === subscription?.plan);
  const inTrial = isInTrial(subscription?.trial_start, subscription?.trial_end);
  const daysRemaining = getDaysRemainingInTrial(subscription?.trial_end);
  const trialStatus = formatTrialStatus(subscription?.status, subscription?.trial_start, subscription?.trial_end);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and billing information</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{subscription.plan}</h2>
                <p className="text-gray-600 mt-2">{currentPlan?.features[0] || 'Premium plan'}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{subscription.priceId?.includes('basic') ? '£50' : '£250'}</p>
                <p className="text-gray-600">{currentPlan?.billingCycle || 'Monthly'}</p>
              </div>
            </div>

            {/* Trial Status */}
            {inTrial && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-900 font-semibold mb-1">Trial Active</p>
                <p className="text-blue-800">
                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining in your trial
                </p>
                <div className="mt-2 bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, (daysRemaining / 30) * 100))}%`
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Status</p>
              <div className="flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                  subscription.status === 'active' || subscription.status === 'trialing' ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <span className="text-gray-900 capitalize">
                  {inTrial ? `Trialing - ${trialStatus}` : subscription.status}
                </span>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Billing Period Start</p>
                <p className="text-gray-900">{subscription.startDate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Billing Period End</p>
                <p className="text-gray-900">{subscription.endDate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Subscription ID</p>
                <p className="font-mono text-sm text-gray-900">{subscription.subscriptionId?.substring(0, 20)}...</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Plan Type</p>
                <p className="text-gray-900">{currentPlan?.billingCycle || 'Monthly'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleOpenBillingPortal}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
              >
                Manage Billing in Stripe Portal
              </button>
            </div>
          </div>
        </div>

        {/* Features List */}
        {currentPlan && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Included Features</h3>
              <ul className="space-y-3">
                {currentPlan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Note about subscription management */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-900">
            <strong>To upgrade, downgrade, cancel, or update your payment method,</strong> click the
            "Manage Billing in Stripe Portal" button above. The Stripe Billing Portal provides a 
            complete interface for all subscription management.
          </p>
        </div>
      </div>
    </div>
  );
}
