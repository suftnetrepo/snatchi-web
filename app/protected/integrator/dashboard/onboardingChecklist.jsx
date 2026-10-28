'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FaArrowRight,
  FaBuilding,
  FaCalendarCheck,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaCreditCard,
  FaFolderPlus,
  FaUserPlus
} from 'react-icons/fa';
import styles from './onboardingChecklist.module.scss';
import {
  HelpFab,
  SetupGuideDrawer,
  TOUR_STEPS,
  TOUR_STORAGE_KEY,
  TourTooltip,
  WelcomeOverlay
} from './onboardingSkeleton';

export const steps = [
  {
    key: 'profile',
    title: 'Complete your organisation profile',
    description: 'Confirm the company details used across projects and billing.',
    action: 'Complete profile',
    href: '/protected/integrator/settings?section=profile',
    icon: FaBuilding
  },
  {
    key: 'engineer',
    title: 'Add your first engineer',
    description: 'Build your internal team so engineers can be scheduled for work.',
    action: 'Add engineer',
    href: '/protected/integrator/user',
    icon: FaUserPlus
  },
  {
    key: 'project',
    title: 'Create your first project',
    description: 'Add the job scope, location and delivery dates.',
    action: 'Create project',
    href: '/protected/integrator/project/create',
    icon: FaFolderPlus
  },
  {
    key: 'booking',
    title: 'Schedule an engineer',
    description: 'Open a project and use Book engineer to create the first booking.',
    action: 'View projects',
    href: '/protected/integrator/project',
    icon: FaCalendarCheck
  },
  {
    key: 'payouts',
    title: 'Set up payouts',
    description: 'Connect Stripe if your engineers will be booked by other integrators.',
    action: 'Set up payouts',
    href: '/protected/integrator/settings?section=payments',
    optional: true,
    icon: FaCreditCard
  }
];

const OnboardingChecklist = ({ dashboardReady = true, onResolved }) => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [setup, setSetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [tourVisible, setTourVisible] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savingRef = useRef(false);
  const checklistRef = useRef(null);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus !== 'authenticated') {
      setLoading(false);
      onResolved?.();
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const response = await fetch('/api/integrator/onboarding', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) throw new Error(`Onboarding checks returned ${response.status}`);
        const payload = await response.json();
        if (active) {
          setSetup(payload.data);
          setWelcomeVisible(!payload.data.complete && !payload.data.dismissed);
        }
      } catch (error) {
        console.error('Unable to load onboarding checks:', error);
        if (active) setLoadError(true);
      } finally {
        if (active) {
          setLoading(false);
          onResolved?.();
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [sessionStatus, reloadKey, onResolved]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.localStorage.getItem(TOUR_STORAGE_KEY)) setTourVisible(true);
  }, []);

  const persistState = useCallback(async (partial) => {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    try {
      const response = await fetch('/api/integrator/onboarding', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to update onboarding state.');
      setSetup((current) => ({
        ...current,
        dismissed: payload.data.welcomeModalDismissed,
        setupChecklistDismissed: payload.data.setupChecklistDismissed,
        complete: payload.data.onboardingCompleted || current?.complete
      }));
      return true;
    } catch (error) {
      setSaveError(error.message || 'Unable to update onboarding state.');
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, []);

  const handleDismissWelcome = useCallback(async () => {
    if (await persistState({ welcomeModalDismissed: true })) setWelcomeVisible(false);
  }, [persistState]);

  const handleGetStarted = useCallback(async () => {
    const saved = await persistState({ welcomeModalDismissed: true, setupChecklistDismissed: false });
    if (saved) {
      setWelcomeVisible(false);
      checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [persistState]);

  const handleDismissChecklist = useCallback(() => {
    persistState({ welcomeModalDismissed: true, setupChecklistDismissed: true });
  }, [persistState]);

  const dismissTour = useCallback(() => {
    setTourVisible(false);
    if (typeof window !== 'undefined') window.localStorage.setItem(TOUR_STORAGE_KEY, '1');
  }, []);

  const nextTourStep = useCallback(() => {
    if (tourStep + 1 >= TOUR_STEPS.length) dismissTour();
    else setTourStep((current) => current + 1);
  }, [dismissTour, tourStep]);

  const openTour = useCallback(() => {
    setTourStep(0);
    setTourVisible(true);
  }, []);

  const nextStep = useMemo(() => steps.find((step) => !step.optional && !setup?.checks?.[step.key]), [setup]);

  if (loading || sessionStatus === 'loading' || !dashboardReady) return null;
  if (loadError) {
    return (
      <section className={styles.onboarding} aria-live="polite">
        <div className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.eyebrow}>Getting started</span>
            <h2>Finish setting up your workspace</h2>
            <p>Your setup checks could not be loaded. You can retry without leaving this page.</p>
          </div>
          <button type="button" className={styles.actionButton} onClick={() => setReloadKey((value) => value + 1)}>
            Retry checks <FaArrowRight />
          </button>
        </div>
      </section>
    );
  }
  if (!setup) return null;

  const activeTourStep = { ...TOUR_STEPS[tourStep], index: tourStep };
  const skeleton = (
    <>
      <SetupGuideDrawer show={guideVisible} steps={steps} checks={setup.checks} onClose={() => setGuideVisible(false)} onNavigate={(href) => router.push(href)} />
      <WelcomeOverlay show={welcomeVisible} busy={saving} onGetStarted={handleGetStarted} onDismiss={handleDismissWelcome} />
      {tourVisible && <TourTooltip step={activeTourStep} onNext={nextTourStep} onDismiss={dismissTour} />}
      <HelpFab onClick={openTour} />
    </>
  );

  if (setup.complete || setup.setupChecklistDismissed) {
    return <>{saveError && <div className="alert alert-danger" role="alert">{saveError}</div>}{skeleton}</>;
  }

  return (
    <>
    {skeleton}
    {saveError && <div className="alert alert-danger" role="alert">{saveError}</div>}
    <section ref={checklistRef} className={styles.onboarding} aria-labelledby="onboarding-title">
      <div className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Getting started</span>
          <h2 id="onboarding-title">Get your workspace ready</h2>
          <p>{nextStep ? `Next: ${nextStep.title}` : 'Your essential setup is complete.'}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.laterButton} onClick={() => setGuideVisible(true)}>View setup guide</button>
          <button type="button" className={styles.laterButton} disabled={saving} onClick={handleDismissChecklist}>Do this later</button>
          <div className={styles.progressText}>
            <strong>{setup.percent}%</strong>
            <span>
              {setup.completedRequired} of {setup.requiredTotal} essential steps
            </span>
          </div>
          <button
            type="button"
            className={styles.collapseButton}
            onClick={() => setCollapsed((value) => !value)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand setup guide' : 'Collapse setup guide'}
          >
            {collapsed ? <FaChevronDown /> : <FaChevronUp />}
          </button>
        </div>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <span style={{ width: `${setup.percent}%` }} />
      </div>

      {!collapsed && (
        <div className={styles.stepList}>
          {steps.map((step) => {
            const complete = Boolean(setup.checks?.[step.key]);
            const Icon = step.icon;
            return (
              <article key={step.key} className={`${styles.step} ${complete ? styles.completed : ''}`}>
                <div className={styles.stepIcon}>{complete ? <FaCheck /> : <Icon />}</div>
                <div className={styles.stepCopy}>
                  <div className={styles.stepTitle}>
                    <h3>{step.title}</h3>
                    {step.optional && <span>Recommended</span>}
                  </div>
                  <p>{complete ? 'Complete' : step.description}</p>
                </div>
                {complete ? (
                  <span className={styles.doneLabel}>
                    <FaCheck /> Done
                  </span>
                ) : (
                  <button type="button" className={styles.actionButton} onClick={() => router.push(step.href)}>
                    {step.action} <FaArrowRight />
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
    </>
  );
};

export default OnboardingChecklist;
