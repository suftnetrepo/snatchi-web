'use client';

import React from 'react';
import { Offcanvas } from 'react-bootstrap';
import { FaArrowRight, FaCheck, FaQuestion, FaTimes } from 'react-icons/fa';
import styles from './onboardingChecklist.module.scss';

export const TOUR_STEPS = [
  { title: 'This is your dashboard', body: 'See projects, engineers, bookings and activity at a glance.' },
  { title: 'Build your team', body: 'Add engineers and keep their availability and service details current.' },
  { title: 'Create projects', body: 'Capture the job scope, location, dates and documents in one workspace.' },
  { title: 'Schedule work', body: 'Book engineers against projects and follow every assignment through delivery.' },
  { title: 'Finish setup', body: 'Use the checklist whenever you need to continue configuring your organisation.' }
];

export const TOUR_STORAGE_KEY = 'snatchi.dashboardTour.dismissed';

export const WelcomeOverlay = ({ show, busy, onGetStarted, onDismiss }) => {
  if (!show) return null;
  return (
    <aside className={styles.welcomeOverlay} role="dialog" aria-label="Welcome to Snatchi">
      <button type="button" className={styles.iconButton} onClick={onDismiss} aria-label="Dismiss welcome message"><FaTimes /></button>
      <div className={styles.welcomeMark}>S</div>
      <h2>Welcome to Snatchi! 🎉</h2>
      <p>Your organisation workspace is ready. Complete a few essentials to start coordinating projects and engineers.</p>
      <ul>
        {['Complete your organisation profile', 'Add your first engineer', 'Create a project', 'Schedule your first booking'].map((item) => (
          <li key={item}><span><FaCheck /></span>{item}</li>
        ))}
      </ul>
      <div className={styles.welcomeActions}>
        <button type="button" disabled={busy} onClick={onGetStarted}>Get started</button>
        <button type="button" disabled={busy} onClick={onDismiss}>I&apos;ll do this later</button>
      </div>
    </aside>
  );
};

export const SetupGuideDrawer = ({ show, steps, checks, onClose, onNavigate }) => (
  <Offcanvas show={show} onHide={onClose} placement="end" className={styles.guideDrawer}>
    <Offcanvas.Header closeButton>
      <Offcanvas.Title>
        <strong>Getting Started with Snatchi</strong>
        <span>Prepare your organisation for day-to-day project delivery.</span>
      </Offcanvas.Title>
    </Offcanvas.Header>
    <Offcanvas.Body>
      <div className={styles.guideIntro}>
        <strong>Setup checklist</strong>
        <p>Complete the essential steps below. Payout setup is recommended when working across organisations.</p>
      </div>
      <div className={styles.guideSteps}>
        {steps.map((step) => {
          const Icon = step.icon;
          const complete = Boolean(checks?.[step.key]);
          return (
            <article key={step.key}>
              <div className={styles.guideIcon}>{complete ? <FaCheck /> : <Icon />}</div>
              <div><h3>{step.title}</h3><p>{step.description}</p></div>
              <button type="button" onClick={() => onNavigate(step.href)}>{complete ? 'Review' : step.action} <FaArrowRight /></button>
            </article>
          );
        })}
      </div>
    </Offcanvas.Body>
  </Offcanvas>
);

export const TourTooltip = ({ step, onNext, onDismiss }) => (
  <aside className={styles.tourTooltip} role="dialog" aria-label="Dashboard tour">
    <div><span>{step.index + 1} of {TOUR_STEPS.length}</span><button type="button" onClick={onDismiss} aria-label="Close tour"><FaTimes /></button></div>
    <h3>{step.title}</h3><p>{step.body}</p>
    <button type="button" onClick={onNext}>{step.index + 1 === TOUR_STEPS.length ? 'Got it' : 'Next'} <FaArrowRight /></button>
  </aside>
);

export const HelpFab = ({ onClick }) => (
  <button type="button" className={styles.helpFab} onClick={onClick} aria-label="Open dashboard tour"><FaQuestion /></button>
);
