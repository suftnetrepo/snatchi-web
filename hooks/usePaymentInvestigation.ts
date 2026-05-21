'use client';

import { useEffect, useState } from 'react';

type ReconciliationResult = {
  status: string;
  errors: string[];
  warnings: string[];
};

type InvestigationPayment = {
  paymentStatus: string;
  transferStatus: string;
  createdAt: string;
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  currency: string;
  paymentIntentId: string;
  chargeId?: string;
  transferId?: string;
  receivingIntegrator?: {
    platformFeePercentage?: number;
  };
};

type StripeCharge = {
  amount: number;
  currency?: string;
  status: string;
  customer: string;
  created: number;
};

type StripeTransfer = {
  amount: number;
  currency?: string;
  status: string;
  destination: string;
  created: number;
  failure_reason?: string;
};

type WebhookEvent = {
  type: string;
  timestamp: string;
  status: string;
  error?: string;
};

export interface PaymentInvestigationData {
  payment: InvestigationPayment;
  reconciliation: ReconciliationResult;
  webhookHistory: WebhookEvent[];
  stripeCharge: StripeCharge | null;
  stripeTransfer: StripeTransfer | null;
}

type UsePaymentInvestigationResult = {
  investigation: PaymentInvestigationData | null;
  loading: boolean;
  error: string | null;
  retrying: boolean;
  fetchInvestigation: () => Promise<void>;
  handleRetryTransfer: () => Promise<void>;
  refetch: () => Promise<void>;
};

export const usePaymentInvestigation = (
  paymentId: string
): UsePaymentInvestigationResult => {
  const [investigation, setInvestigation] = useState<PaymentInvestigationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (paymentId) {
      void fetchInvestigation();
    }
  }, [paymentId]);

  const fetchInvestigation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/payments/investigate/${paymentId}`);
      if (!res.ok) {
        throw new Error('Failed to load investigation');
      }
      const data: PaymentInvestigationData = await res.json();
      setInvestigation(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryTransfer = async () => {
    if (!confirm('Retry transfer for this payment?')) {
      return;
    }

    try {
      setRetrying(true);
      const res = await fetch('/api/admin/payments/retry-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });

      if (!res.ok) {
        throw new Error('Retry failed');
      }

      const data: { transferId?: string } = await res.json();
      alert(`Transfer retry initiated: ${data.transferId}`);
      await fetchInvestigation();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRetrying(false);
    }
  };

  return {
    investigation,
    loading,
    error,
    retrying,
    fetchInvestigation,
    handleRetryTransfer,
    refetch: fetchInvestigation
  };
};