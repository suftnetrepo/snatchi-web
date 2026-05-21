'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './failures.module.css';
import { usePaymentFailures, type FailedPayment } from '@/hooks/usePaymentFailures';

export default function PaymentFailuresDashboard() {
  const { failedPayments, loading, error, refetch: fetchFailedPayments } = usePaymentFailures();
  const [filter, setFilter] = useState<'all' | 'orphaned' | 'pending_retry' | 'webhook_failed'>('all');
  const payments: FailedPayment[] = failedPayments;

  const filteredPayments = payments.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'orphaned') return p.paymentStatus === 'succeeded' && !p.transferId;
    if (filter === 'pending_retry') return p.transferStatus === 'pending_retry';
    if (filter === 'webhook_failed') return p.transferStatus === 'webhook_failed';
    return true;
  });

  const stats = {
    total: payments.length,
    orphaned: payments.filter(p => p.paymentStatus === 'succeeded' && !p.transferId).length,
    pendingRetry: payments.filter(p => p.transferStatus === 'pending_retry').length,
    webhookFailed: payments.filter(p => p.transferStatus === 'webhook_failed').length
  };

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Payment Failures Dashboard</h1>
        <button onClick={fetchFailedPayments} className={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* STATS */}
      <div className={styles.statsGrid} data-testid="admin-payment-failure">
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Failed</div>
          <div className={styles.statValue}>{stats.total}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Orphaned</div>
          <div className={styles.statValue}>{stats.orphaned}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pending Retry</div>
          <div className={styles.statValue}>{stats.pendingRetry}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Webhook Failed</div>
          <div className={styles.statValue}>{stats.webhookFailed}</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className={styles.filters}>
        <button
          onClick={() => setFilter('all')}
          className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('orphaned')}
          className={`${styles.filterButton} ${filter === 'orphaned' ? styles.active : ''}`}
        >
          Orphaned ({stats.orphaned})
        </button>
        <button
          onClick={() => setFilter('pending_retry')}
          className={`${styles.filterButton} ${filter === 'pending_retry' ? styles.active : ''}`}
        >
          Pending Retry ({stats.pendingRetry})
        </button>
        <button
          onClick={() => setFilter('webhook_failed')}
          className={`${styles.filterButton} ${filter === 'webhook_failed' ? styles.active : ''}`}
        >
          Webhook Failed ({stats.webhookFailed})
        </button>
      </div>

      {/* TABLE */}
      <div className={styles.section}>
        <h2>Failed Payments</h2>
        {filteredPayments.length === 0 ? (
          <p className={styles.noData}>No failures matching this filter</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Transfer Status</th>
                  <th>Error</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(payment => (
                  <tr key={payment._id} className={styles.failureRow}>
                    <td className={styles.paymentId}>
                      <code>{payment._id.substring(0, 8)}</code>
                    </td>
                    <td>£{(payment.grossAmount / 100).toFixed(2)}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          payment.paymentStatus === 'succeeded'
                            ? styles.success
                            : styles.danger
                        }`}
                      >
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          payment.transferStatus === 'pending_retry'
                            ? styles.warning
                            : styles.danger
                        }`}
                      >
                        {payment.transferStatus}
                      </span>
                    </td>
                    <td className={styles.errorCell}>
                      {payment.error || payment.reconciliationErrors?.[0] || '-'}
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        href={`/admin/payments/${payment._id}`}
                        className={styles.investigateLink}
                      >
                        Investigate →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECENT FAILURES BY TYPE */}
      <div className={styles.analysisSection}>
        <h2>Failure Analysis</h2>
        <div className={styles.failureTypeGrid}>
          <div className={styles.failureType}>
            <h3>🚨 Orphaned Payments</h3>
            <p>Payment succeeded but no transfer created</p>
            <ul>
              {payments
                .filter(p => p.paymentStatus === 'succeeded' && !p.transferId)
                .slice(0, 5)
                .map(p => (
                  <li key={p._id}>
                    <code>{p.chargeId}</code>
                    <Link href={`/admin/payments/${p._id}`} className={styles.miniLink}>
                      View
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div className={styles.failureType}>
            <h3>⚠️ Pending Retry</h3>
            <p>Transfer failed but not yet retried</p>
            <ul>
              {payments
                .filter(p => p.transferStatus === 'pending_retry')
                .slice(0, 5)
                .map(p => (
                  <li key={p._id}>
                    <code>{p.transferId}</code>
                    <Link href={`/admin/payments/${p._id}`} className={styles.miniLink}>
                      View
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div className={styles.failureType}>
            <h3>❌ Webhook Failed</h3>
            <p>Webhook processing encountered error</p>
            <ul>
              {payments
                .filter(p => p.transferStatus === 'webhook_failed')
                .slice(0, 5)
                .map(p => (
                  <li key={p._id}>
                    <code>{p.paymentIntentId?.substring(0, 12)}</code>
                    <Link href={`/admin/payments/${p._id}`} className={styles.miniLink}>
                      View
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {stats.orphaned > 0 && (
        <div className={styles.alertBox} data-testid="admin-reconciliation-error">
          <strong>🚨 CRITICAL:</strong> {stats.orphaned} orphaned payment(s) detected. These payments succeeded but transfers were not created.
        </div>
      )}

      {stats.pendingRetry > 0 && (
        <div className={styles.alertBox}>
          <strong>⚠️ ACTION NEEDED:</strong> {stats.pendingRetry} payment(s) awaiting retry.
        </div>
      )}

      {stats.webhookFailed > 0 && (
        <div className={styles.alertBox}>
          <strong>❌ ERROR:</strong> {stats.webhookFailed} webhook failure(s) detected.
        </div>
      )}
    </div>
  );
}
