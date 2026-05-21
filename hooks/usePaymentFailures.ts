'use client';

import { useEffect, useState } from 'react';

export interface FailedPayment {
  _id: string;
  paymentIntentId: string;
  chargeId: string;
  transferId?: string;
  paymentStatus: string;
  transferStatus: string;
  grossAmount: number;
  netAmount: number;
  platformFeeAmount: number;
  createdAt: string;
  error?: string;
  reconciliationErrors?: string[];
}

type UsePaymentFailuresResult = {
  failedPayments: FailedPayment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const usePaymentFailures = (): UsePaymentFailuresResult => {
  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchFailedPayments();
    const interval = setInterval(() => {
      void fetchFailedPayments();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchFailedPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/payments/failures');
      if (!res.ok) {
        throw new Error('Failed to load failures');
      }
      const data: { failures?: FailedPayment[] } = await res.json();
      setFailedPayments(data.failures || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    failedPayments,
    loading,
    error,
    refetch: fetchFailedPayments
  };
};