'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from 'react-bootstrap';
import {
  BsArrowClockwise,
  BsArrowUpRight,
  BsCheckCircle,
  BsCreditCard2Front,
  BsLock,
  BsShieldCheck
} from 'react-icons/bs';
import styles from './recovery.module.scss';

const STATUS_COPY = {
  inactive: {
    title: 'Complete your subscription setup',
    message: 'Your Snatchi workspace is ready, but billing has not been completed. Choose a plan or contact support to activate it.'
  },
  suspended: {
    title: 'Your subscription needs attention',
    message: 'Your organisation is currently suspended. Review the details below or contact support to restore access.'
  },
  past_due: {
    title: 'Your payment is overdue',
    message: 'Update your payment method in Stripe to restore access to your Snatchi workspace.'
  },
  unpaid: {
    title: 'Payment is required',
    message: 'Your subscription has an unpaid balance. Open secure billing to resolve it.'
  },
  cancelled: {
    title: 'Your subscription has ended',
    message: 'Open secure billing to review your account, or choose a new plan to reactivate Snatchi.'
  },
  canceled: {
    title: 'Your subscription has ended',
    message: 'Open secure billing to review your account, or choose a new plan to reactivate Snatchi.'
  },
  incomplete: {
    title: 'Complete your subscription setup',
    message: 'Your payment setup was not completed. Open secure billing or choose a plan to continue.'
  },
  incomplete_expired: {
    title: 'Your subscription setup expired',
    message: 'Choose a plan to restart your subscription securely.'
  },
  expired: {
    title: 'Your subscription has expired',
    message: 'Renew your subscription to regain access to projects, bookings, invoices and your team workspace.'
  },
  paused: {
    title: 'Your subscription is paused',
    message: 'Open secure billing or contact support to resume your Snatchi workspace.'
  }
};

const formatStatus = (status) => String(status || 'inactive')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (character) => character.toUpperCase());

export default function BillingRecoveryPage() {
  const router = useRouter();
  const [entitlement, setEntitlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [error, setError] = useState('');

  const loadEntitlement = useCallback(async ({ redirectWhenActive = false } = {}) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/entitlement', {
        credentials: 'include',
        cache: 'no-store'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Unable to verify your subscription.');

      setEntitlement(result.data);
      if (result.data?.hasAccess && redirectWhenActive) {
        router.replace('/protected/integrator/dashboard');
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to verify your subscription.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadEntitlement();
  }, [loadEntitlement]);

  const openPortal = async () => {
    if (openingPortal) return;
    setOpeningPortal(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/customerPortal', {
        method: 'POST',
        credentials: 'include'
      });
      const result = await response.json();
      if (!response.ok || !result?.url) throw new Error(result?.error || 'Unable to open secure billing.');
      window.location.assign(result.url);
    } catch (requestError) {
      setError(requestError.message || 'Unable to open secure billing.');
      setOpeningPortal(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.replace('/login');
  };

  const status = entitlement?.status || 'inactive';
  const isBillingManager = ['integrator', 'manager'].includes(entitlement?.role);
  const copy = entitlement?.isAdminSuspended
    ? {
        title: 'Your organisation has been suspended',
        message: entitlement.suspensionReason || 'Contact Snatchi support for help restoring access.'
      }
    : STATUS_COPY[status] || {
        title: 'Your subscription needs attention',
        message: 'Review your billing details to restore access to your Snatchi workspace.'
      };

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="billing-recovery-heading">
        <div className={styles.brandRow}>
          <img src="/img/logo.png" alt="Snatchi" />
          <span className={styles.securePill}><BsShieldCheck /> Secure recovery</span>
        </div>

        <div className={styles.iconWrap}><BsCreditCard2Front /></div>
        <span className={styles.eyebrow}>Billing &amp; subscription</span>
        <h1 id="billing-recovery-heading">{loading ? 'Checking your subscription…' : copy.title}</h1>
        <p className={styles.intro}>{loading ? 'This will only take a moment.' : copy.message}</p>

        {loading ? (
          <div className={styles.loading}><Spinner animation="border" size="sm" /> Verifying account</div>
        ) : (
          <>
            <div className={styles.accountPanel}>
              <div><span>Organisation</span><strong>{entitlement?.organisationName || 'Your organisation'}</strong></div>
              <div><span>Current plan</span><strong>{entitlement?.plan || 'No active plan'}</strong></div>
              <div><span>Status</span><strong className={styles.status}>{formatStatus(status)}</strong></div>
            </div>

            {error && <div className={styles.error} role="alert">{error}</div>}

            <div className={styles.actions}>
              {isBillingManager && entitlement?.hasStripeCustomer && !entitlement?.isAdminSuspended ? (
                <Button type="button" className={styles.primaryButton} onClick={openPortal} disabled={openingPortal}>
                  {openingPortal ? <><Spinner size="sm" /> Opening secure billing…</> : <>Manage billing <BsArrowUpRight /></>}
                </Button>
              ) : isBillingManager && !entitlement?.isAdminSuspended ? (
                <Button as={Link} href="/pricing" className={styles.primaryButton}>
                  Choose a plan <BsArrowUpRight />
                </Button>
              ) : (
                <Button as={Link} href="/contact" className={styles.primaryButton}>
                  Contact your administrator <BsArrowUpRight />
                </Button>
              )}

              <Button
                type="button"
                variant="outline-secondary"
                className={styles.secondaryButton}
                onClick={() => loadEntitlement({ redirectWhenActive: true })}
                disabled={loading}
              >
                <BsArrowClockwise /> I’ve updated billing
              </Button>
            </div>

            <div className={styles.reassurance}>
              <span><BsLock /> Payments are handled securely by Stripe</span>
              <span><BsCheckCircle /> Your organisation’s data remains safe</span>
            </div>
          </>
        )}

        <div className={styles.footerRow}>
          <Link href="/contact">Contact support</Link>
          <button type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </section>
    </main>
  );
}
