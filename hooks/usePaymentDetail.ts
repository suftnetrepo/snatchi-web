'use client';

import { useState, useEffect } from 'react';

export interface PaymentDetail {
  _id: string;
  paymentIntentId: string;
  transferId?: string;
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  paymentStatus: string;
  transferStatus: string;
  chargeId?: string;
  chargeFailureCode?: string;
  chargeFailureMessage?: string;
  engineer: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  payingIntegrator: {
    _id: string;
    name: string;
  };
  receivingIntegrator: {
    _id: string;
    name: string;
  };
  scheduler?: {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  paymentInitiatedAt: string;
  chargeSucceededAt?: string;
  transferInitiatedAt?: string;
  transferPaidAt?: string;
}

type UsePaymentDetailResult = {
  payment: PaymentDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const usePaymentDetail = (paymentId: string): UsePaymentDetailResult => {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentId) {
      fetchPayment();
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

      const data = await response.json();
      setPayment(data.payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment details');
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
