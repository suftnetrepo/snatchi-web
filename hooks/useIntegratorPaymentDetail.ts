'use client';

import { useEffect, useState } from 'react';

export interface IntegratorPaymentDetail {
  _id: string;
  paymentIntentId: string;
  payingIntegrator: {
    name: string;
    email: string;
  };
  receivingIntegrator: {
    name: string;
    email: string;
  };
  engineer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  scheduler?: {
    title: string;
    startDate: string;
    endDate: string;
  };
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  platformFeePercentage: number;
  currency: string;
  paymentStatus: string;
  transferStatus: string;
  transferId?: string;
  chargeId?: string;
  chargeFailureCode?: string;
  chargeFailureMessage?: string;
  paymentInitiatedAt: string;
  paymentAttemptedAt?: string;
  paymentSucceededAt?: string;
  transferInitiatedAt?: string;
  transferPaidAt?: string;
  failedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

type UseIntegratorPaymentDetailResult = {
  payment: IntegratorPaymentDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const useIntegratorPaymentDetail = (
  paymentId: string
): UseIntegratorPaymentDetailResult => {
  const [payment, setPayment] = useState<IntegratorPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentId) {
      void fetchPayment();
    }
  }, [paymentId]);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/stripe/payment/status?paymentId=${paymentId}`);

      if (!response.ok) {
        throw new Error('Failed to load payment details');
      }

      const data: IntegratorPaymentDetail = await response.json();
      setPayment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment');
    } finally {
      setLoading(false);
    }
  };

  return {
    payment,
    loading,
    error,
    refetch: fetchPayment
  };
};