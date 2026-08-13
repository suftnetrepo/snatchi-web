'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Form, Spinner } from 'react-bootstrap';
import {
  FaBuilding,
  FaCheckCircle,
  FaCreditCard,
  FaExternalLinkAlt,
  FaLock,
  FaMoneyCheckAlt,
  FaSyncAlt,
  FaUserCog
} from 'react-icons/fa';
import { useSettings } from '../../../../hooks/useSettings';
import { useSubscriber } from '../../../../hooks/useSubscriber';
import { useStripeConnectStatus } from '../../../../hooks/useStripeConnectStatus';
import { validate } from '../../../../validator/validator';
import ErrorDialogue, { OkDialogue } from '../../../../src/components/elements/errorDialogue';
import styles from './settings.module.scss';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const humanise = (value) => {
  if (!value) return 'Not available';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const SettingsPage = () => {
  const { handleSave, handleSaveChangePassword, handleChange, rules, loading, error, fields, success, handleReset } = useSettings();
  const {
    handleCustomerPortalSession,
    loading: portalLoading,
    error: portalError,
    handleErrorReset
  } = useSubscriber();
  const {
    connectStatus,
    connectLoading,
    connectError,
    fetchConnectStatus,
    handleCreateOnboarding,
    handleRefreshOnboarding
  } = useStripeConnectStatus();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState('profile');
  const [errorMessages, setErrorMessages] = useState({});
  const [file, setFile] = useState(null);
  const [passwords, setPasswords] = useState({ password: '', confirmation: '' });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchConnectStatus();
    const requestedSection = new URLSearchParams(window.location.search).get('section');
    if (['profile', 'subscription', 'payments', 'security'].includes(requestedSection)) {
      setSelectedMenu(requestedSection);
    }
    // The status only needs to be loaded once when Settings opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectMenu = (menu) => {
    setSelectedMenu(menu);
    handleErrorReset();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
      setErrorMessages((current) => ({ ...current, file: 'Use a JPG, PNG or WebP image.' }));
      event.target.value = '';
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE) {
      setErrorMessages((current) => ({ ...current, file: 'The profile image must be 5 MB or smaller.' }));
      event.target.value = '';
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setErrorMessages((current) => ({ ...current, file: null }));
  };

  const onSubmit = async () => {
    setErrorMessages({});
    const validationResult = validate(fields, rules);
    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    const formData = new FormData();
    ['description', 'name', 'email', 'mobile'].forEach((key) => formData.append(key, fields?.[key] || ''));
    if (file) formData.append('file', file);
    await handleSave(formData);
  };

  const openBillingPortal = async () => {
    const result = await handleCustomerPortalSession({});
    if (result?.url) window.location.assign(result.url);
  };

  const statusLabel = (status) => ({
    not_started: 'Not started',
    onboarding_started: 'Onboarding in progress',
    verified: 'Verified',
    restricted: 'Restricted',
    requirements_pending: 'Information required',
    verification_failed: 'Verification failed'
  }[status] || humanise(status));

  const renderProfile = () => (
    <div>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Organisation</span>
          <h2>Profile settings</h2>
          <p>Keep your company details accurate for projects, engineers and billing records.</p>
        </div>
      </header>

      <Form className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            <img
              src={previewUrl || fields?.secure_url || '/img/blank.png'}
              alt={`${fields?.name || 'Organisation'} profile`}
              onError={(event) => { event.currentTarget.src = '/img/blank.png'; }}
            />
          </div>
          <div>
            <h3>Company logo</h3>
            <p>JPG, PNG or WebP. Maximum file size 5 MB.</p>
            <button type="button" className={styles.secondaryButton} onClick={() => document.getElementById('file-input')?.click()}>
              Change picture
            </button>
            {errorMessages.file && <div className="text-danger mt-2 fs-13">{errorMessages.file}</div>}
          </div>
        </div>

        <div className={styles.formGrid}>
          <Form.Group>
            <Form.Label>Company name</Form.Label>
            <Form.Control value={fields?.name || ''} onChange={(event) => handleChange('name', event.target.value)} />
            {errorMessages?.name?.message && <span className="text-danger fs-13">{errorMessages.name.message}</span>}
          </Form.Group>
          <Form.Group>
            <Form.Label>Account email</Form.Label>
            <Form.Control value={fields?.email || ''} readOnly aria-describedby="email-help" />
            <Form.Text id="email-help">Contact support to change the account email.</Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Mobile number</Form.Label>
            <Form.Control value={fields?.mobile || ''} onChange={(event) => handleChange('mobile', event.target.value)} />
            {errorMessages?.mobile?.message && <span className="text-danger fs-13">{errorMessages.mobile.message}</span>}
          </Form.Group>
          <Form.Group className={styles.full}>
            <Form.Label>Company description</Form.Label>
            <Form.Control as="textarea" rows={4} maxLength={500} value={fields?.description || ''} onChange={(event) => handleChange('description', event.target.value)} />
            <Form.Text>{fields?.description?.length || 0}/500 characters</Form.Text>
          </Form.Group>
        </div>

        <div className={styles.cardFooter}>
          <span>Changes are reflected across your organisation.</span>
          <button type="button" className={styles.primaryButton} disabled={loading} onClick={onSubmit}>
            {loading && <Spinner animation="border" size="sm" />} {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </Form>
    </div>
  );

  const renderSubscription = () => {
    const isTrial = fields?.status === 'trialing';
    return (
      <div>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Billing</span>
            <h2>Subscription</h2>
            <p>Review your current plan and manage payment details securely through Stripe.</p>
          </div>
        </header>

        {portalError && <Alert variant="danger" dismissible onClose={handleErrorReset}>{portalError}</Alert>}
        <section className={styles.billingCard}>
          <div className={styles.subscriptionHero}>
            <div>
              <span>Current plan</span>
              <h3>{humanise(fields?.plan || 'Standard')}</h3>
              <p>Your organisation subscription is managed securely by Stripe.</p>
            </div>
            <span className={styles.status}><FaCheckCircle /> {humanise(fields?.status)}</span>
          </div>
          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <span>{isTrial ? 'Trial started' : 'Started'}</span>
              <strong>{formatDate(isTrial ? fields?.trial_start : fields?.startDate)}</strong>
            </div>
            <div className={styles.metaCard}>
              <span>{isTrial ? 'Trial ends' : 'Current period ends'}</span>
              <strong>{formatDate(isTrial ? fields?.trial_end : fields?.endDate)}</strong>
            </div>
            <div className={styles.metaCard}>
              <span>Billing provider</span>
              <strong>Stripe</strong>
            </div>
          </div>
          <div className={styles.billingAction}>
            <div>
              <strong>Manage your subscription</strong>
              <p>Update payment methods, view invoices or change your subscription in the secure customer portal.</p>
            </div>
            <button type="button" className={styles.primaryButton} disabled={portalLoading} onClick={openBillingPortal}>
              {portalLoading ? <Spinner animation="border" size="sm" /> : <FaExternalLinkAlt />}
              {portalLoading ? 'Opening…' : 'Open billing portal'}
            </button>
          </div>
        </section>
      </div>
    );
  };

  const renderPayments = () => {
    const status = connectStatus?.status || 'not_started';
    const needsOnboarding = ['onboarding_started', 'requirements_pending', 'verification_failed', 'restricted'].includes(status);
    return (
      <div>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Payouts</span>
            <h2>Receive payments</h2>
            <p>Connect Stripe to receive payouts when another integrator books your engineers.</p>
          </div>
        </header>
        {connectError && <Alert variant="danger">{connectError}</Alert>}
        <section className={styles.connectCard}>
          {connectLoading && !connectStatus ? (
            <div className={styles.loadingState}><Spinner animation="border" size="sm" /> Checking your Stripe connection…</div>
          ) : (
            <>
              <div className={styles.connectStatus}>
                <div className={styles.connectIcon}><FaMoneyCheckAlt /></div>
                <div>
                  <span>Stripe Connect</span>
                  <h3>{statusLabel(status)}</h3>
                  {connectStatus?.accountId && <p>Account ending {connectStatus.accountId.slice(-8)}</p>}
                </div>
                <span className={`${styles.status} ${status === 'verified' ? styles.verified : styles.pending}`}>{statusLabel(status)}</span>
              </div>

              {status === 'verified' && (
                <div className={styles.metaGrid}>
                  <div className={styles.metaCard}><span>Charges</span><strong>{connectStatus?.chargesEnabled ? 'Enabled' : 'Pending'}</strong></div>
                  <div className={styles.metaCard}><span>Payouts</span><strong>{connectStatus?.payoutsEnabled ? 'Enabled' : 'Pending'}</strong></div>
                  <div className={styles.metaCard}><span>Bank account</span><strong>{connectStatus?.bankAccountOnFile ? 'On file' : 'Required'}</strong></div>
                </div>
              )}

              {status === 'requirements_pending' && connectStatus?.requirementsStatus?.currentlyDue?.length > 0 && (
                <Alert variant="warning"><strong>Information required:</strong> {connectStatus.requirementsStatus.currentlyDue.join(', ')}</Alert>
              )}
              {status === 'verification_failed' && connectStatus?.rejectReason && <Alert variant="danger">{connectStatus.rejectReason}</Alert>}

              <div className={styles.cardFooter}>
                <span>{status === 'verified' ? 'Your account is ready to receive payouts.' : 'Stripe will guide you through the remaining verification steps.'}</span>
                <div className={styles.buttonGroup}>
                  {status === 'not_started' && <button type="button" className={styles.primaryButton} disabled={connectLoading} onClick={handleCreateOnboarding}>Set up Stripe</button>}
                  {needsOnboarding && <button type="button" className={styles.primaryButton} disabled={connectLoading} onClick={handleRefreshOnboarding}>Resume setup</button>}
                  <button type="button" className={styles.secondaryButton} disabled={connectLoading} onClick={fetchConnectStatus}><FaSyncAlt /> Refresh status</button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    );
  };

  const savePassword = async () => {
    if (passwords.password.length < 8) {
      setPasswordError('Use at least 8 characters.');
      return;
    }
    if (passwords.password !== passwords.confirmation) {
      setPasswordError('The passwords do not match.');
      return;
    }
    setPasswordError('');
    const saved = await handleSaveChangePassword({ password: passwords.password });
    if (saved) setPasswords({ password: '', confirmation: '' });
  };

  const renderSecurity = () => (
    <div>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Security</span>
          <h2>Change password</h2>
          <p>Choose a strong, unique password for your Snatchi account.</p>
        </div>
      </header>
      <section className={styles.profileCard}>
        <div className={styles.formGrid}>
          <Form.Group>
            <Form.Label>New password</Form.Label>
            <Form.Control type="password" autoComplete="new-password" value={passwords.password} onChange={(event) => setPasswords((current) => ({ ...current, password: event.target.value }))} />
            <Form.Text>Minimum 8 characters.</Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Confirm new password</Form.Label>
            <Form.Control type="password" autoComplete="new-password" value={passwords.confirmation} onChange={(event) => setPasswords((current) => ({ ...current, confirmation: event.target.value }))} />
          </Form.Group>
        </div>
        {passwordError && <Alert variant="danger" className="mt-3 mb-0">{passwordError}</Alert>}
        <div className={styles.cardFooter}>
          <span>You will use the new password the next time you sign in.</span>
          <button type="button" className={styles.primaryButton} disabled={loading || !passwords.password || !passwords.confirmation} onClick={savePassword}>
            {loading && <Spinner animation="border" size="sm" />} {loading ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </section>
    </div>
  );

  const content = {
    profile: renderProfile,
    subscription: renderSubscription,
    payments: renderPayments,
    security: renderSecurity
  }[selectedMenu]?.();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Account administration</span>
          <h1>Settings</h1>
          <p>Manage your organisation profile, subscription and payout preferences.</p>
        </div>
        <div className={styles.heroIcon}><FaUserCog /></div>
      </section>

      <section className={styles.shell}>
        <nav className={styles.nav} aria-label="Settings sections">
          <span className={styles.navTitle}>Settings</span>
          <button type="button" className={selectedMenu === 'profile' ? styles.active : ''} onClick={() => selectMenu('profile')}><FaBuilding /> <span><strong>Profile</strong><small>Company details</small></span></button>
          <button type="button" className={selectedMenu === 'subscription' ? styles.active : ''} onClick={() => selectMenu('subscription')}><FaCreditCard /> <span><strong>Subscription</strong><small>Plan and billing</small></span></button>
          <button type="button" className={selectedMenu === 'payments' ? styles.active : ''} onClick={() => selectMenu('payments')}><FaMoneyCheckAlt /> <span><strong>Receive payments</strong><small>Stripe payouts</small></span></button>
          <button type="button" className={selectedMenu === 'security' ? styles.active : ''} onClick={() => selectMenu('security')}><FaLock /> <span><strong>Password</strong><small>Account security</small></span></button>
        </nav>
        <div className={styles.content}>{content}</div>
      </section>

      <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} hidden />
      {success && <OkDialogue showSuccess={success} onClose={handleReset} />}
      {error && <ErrorDialogue showError={error} onClose={handleReset} />}
    </main>
  );
};

export default SettingsPage;
