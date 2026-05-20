'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './received.module.css';

interface Payment {
  _id: string;
  paymentIntentId: string;
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  paymentStatus: string;
  transferStatus: string;
  engineer: {
    first_name: string;
    last_name: string;
  };
  payingIntegrator: {
    name: string;
  };
  createdAt: string;
}

interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
}

const LIMIT = 20;

export default function PaymentsReceivedPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    limit: LIMIT,
    offset: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalReceived, setTotalReceived] = useState(0);

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          limit: LIMIT.toString(),
          offset: pagination.offset.toString(),
        });

        if (statusFilter) {
          params.append('status', statusFilter);
        }

        const response = await fetch(`/api/stripe/integrator/payments-received?${params}`);

        if (!response.ok) {
          throw new Error('Failed to load payments');
        }

        const data = await response.json();
        setPayments(data.payments || []);
        setPagination(data.pagination || {});
        setTotalReceived(data.summary?.totalAmount || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [pagination.offset, statusFilter]);

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + LIMIT,
      }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination((prev) => ({
        ...prev,
        offset: Math.max(0, prev.offset - LIMIT),
      }));
    }
  };

  return (
    <div className={styles.container}>
      <div data-testid="payments-received-header" className={styles.header}>
        <h1>Payments Received</h1>
        <div data-testid="payments-received-total" className={styles.total}>
          Total Received: <strong>£{(totalReceived / 100).toFixed(2)}</strong>
        </div>
      </div>

      {/* Filters */}
      <div data-testid="payment-filters-received" className={styles.filters}>
        <select
          data-testid="payment-filter-status-received"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, offset: 0 }));
          }}
          className={styles.filterSelect}
        >
          <option value="">All Statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div data-testid="payments-received-loading" className={styles.loading}>
          Loading payments...
        </div>
      )}

      {/* Error */}
      {error && (
        <div data-testid="payments-received-error" className={styles.error}>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && payments.length === 0 && (
        <div data-testid="payments-received-empty" className={styles.empty}>
          <p>No payments received yet.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && payments.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table data-testid="payment-received-table" className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Engineer</th>
                  <th>From</th>
                  <th>Gross</th>
                  <th>Fee</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment._id}
                    data-testid={`payment-received-row-${payment._id}`}
                    className={styles.row}
                  >
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td>
                      {payment.engineer.first_name} {payment.engineer.last_name}
                    </td>
                    <td>{payment.payingIntegrator.name}</td>
                    <td>£{(payment.grossAmount / 100).toFixed(2)}</td>
                    <td>£{(payment.platformFeeAmount / 100).toFixed(2)}</td>
                    <td className={styles.netAmount}>
                      £{(payment.netAmount / 100).toFixed(2)}
                    </td>
                    <td>
                      <span
                        data-testid={`payment-received-status-${payment._id}`}
                        className={`${styles.badge} ${styles[`badge-${payment.paymentStatus}`]}`}
                      >
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/protected/payments/${payment._id}`}
                        className={styles.detailsLink}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div data-testid="payment-received-pagination" className={styles.pagination}>
            <button
              data-testid="payment-received-prev-page"
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
              className={styles.paginationBtn}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              data-testid="payment-received-next-page"
              onClick={handleNextPage}
              disabled={currentPage >= pagination.totalPages}
              className={styles.paginationBtn}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
