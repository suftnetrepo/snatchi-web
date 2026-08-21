'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { FiAlertTriangle, FiArrowUpRight, FiCheckCircle, FiClock, FiUsers } from 'react-icons/fi';
import { useDashboard } from '../../../../hooks/useDashboard';
import { getAdminAggregate } from '../../../../utils/helpers';
import RecentUsers from '../recentUsers';
import UserSignOnChart from '../userSignOnChart';
import UserPolarChart from '../userPolarChart';
import styles from './dashboard.module.css';

const statusCards = [
  { key: 'active', label: 'Active organisations', detail: 'Subscriptions in good standing', icon: FiCheckCircle, tone: 'green' },
  { key: 'inactive', label: 'Inactive organisations', detail: 'Accounts requiring review', icon: FiClock, tone: 'slate' },
  { key: 'unpaid', label: 'Payment attention', detail: 'Unpaid subscriptions', icon: FiAlertTriangle, tone: 'amber' },
  { key: 'canceled', label: 'Cancelled', detail: 'Ended subscriptions', icon: FiUsers, tone: 'red' }
];

export default function Dashboard() {
  const { handleAggregate, data, loading, error } = useDashboard();

  useEffect(() => {
    handleAggregate();
  }, []);

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Platform operations</p>
          <h1>Admin overview</h1>
          <p>Monitor organisations, subscriptions and operational health across Snatchi.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/protected/admin/payments/failures" className={styles.secondaryAction}>
            Review payment issues
          </Link>
          <Link href="/protected/admin/integrator" className={styles.primaryAction}>
            View organisations <FiArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </header>

      {error && <div className={styles.errorBanner} role="alert">Dashboard data could not be loaded. {error}</div>}

      <section className={styles.statsGrid} aria-label="Subscription status summary">
        {statusCards.map(({ key, label, detail, icon: Icon, tone }) => (
          <article className={styles.statCard} key={key}>
            <div className={`${styles.statIcon} ${styles[tone]}`}><Icon aria-hidden="true" /></div>
            <div>
              <span>{label}</span>
              <strong>{loading && !data ? '—' : getAdminAggregate(data, key)}</strong>
              <small>{detail}</small>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.analyticsGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelLabel}>Growth</span>
              <h2>Weekly organisation sign-ups</h2>
            </div>
          </div>
          <div className={styles.chart}><UserSignOnChart /></div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelLabel}>Portfolio</span>
              <h2>Status distribution</h2>
            </div>
          </div>
          <div className={styles.polarChart}>{data?.length > 0 ? <UserPolarChart data={data} /> : <p>No status data yet.</p>}</div>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelLabel}>Latest activity</span>
            <h2>Recent organisations</h2>
          </div>
          <Link href="/protected/admin/integrator">View all</Link>
        </div>
        <RecentUsers />
      </section>
    </div>
  );
}
