/**
 * Centralized status constants for projects, tasks, and schedulers
 * Used across the application to ensure consistency and avoid hardcoded strings
 * 
 * Source: Model enums in /app/api/models/
 * Last updated: 2026-05-20
 */

// Project statuses - used in project.js model
export const PROJECT_STATUS = {
  PENDING: 'Pending',
  PROGRESS: 'Progress',      // Currently showing status in progress
  COMPLETED: 'Completed',
  CANCELED: 'Canceled'
};

// Task statuses - used in task.js model
export const TASK_STATUS = {
  PENDING: 'Pending',
  PROGRESS: 'Progress',      // Currently showing status in progress
  COMPLETED: 'Completed',
  CANCELED: 'Canceled'
};

// Scheduler statuses - used in scheduler.js model
export const SCHEDULER_STATUS = {
  PENDING: 'Pending',
  DECLINED: 'Declined',
  ACCEPTED: 'Accepted',
  APPROVED: 'Approved',
  AWAITING_PAYMENT: 'AwaitingPayment',
  PAID: 'Paid',
  READY_TO_START: 'ReadyToStart',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PAYMENT_FAILED: 'PaymentFailed',
  PROGRESS: 'Progress',
  READY: 'Ready'
};

// Stripe webhook processing statuses - used in stripeWebhookEvent.js model
export const WEBHOOK_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Stripe Connect account statuses - used in integrator.js model
export const INTEGRATOR_CONNECT_STATUS = {
  NOT_STARTED: 'not_started',
  ONBOARDING_STARTED: 'onboarding_started',
  VERIFIED: 'verified',
  RESTRICTED: 'restricted',
  REQUIREMENTS_PENDING: 'requirements_pending',
  VERIFICATION_FAILED: 'verification_failed'
};

/**
 * Get display label for a status value
 * @param {string} status - Status value (e.g., 'Pending', 'Progress', 'Completed')
 * @returns {string} Display label
 */
export const getStatusLabel = (status) => {
  const labels = {
    'Pending': 'Pending',
    'Progress': 'In Progress',
    'Completed': 'Completed',
    'Canceled': 'Canceled',
    'Declined': 'Declined',
    'Accepted': 'Accepted',
    'Approved': 'Approved',
    'AwaitingPayment': 'Approved - Awaiting Payment',
    'Paid': 'Paid',
    'ReadyToStart': 'Paid - Ready to Start',
    'InProgress': 'In Progress',
    'Cancelled': 'Cancelled'
  };
  return labels[status] || status;
};

export const normalizeSchedulerStatus = (status) => {
  if (!status) {
    return null;
  }

  const normalizedInput = String(status).trim().toLowerCase().replace(/\s+/g, '');

  if (normalizedInput === 'progress' || normalizedInput === 'inprogress') {
    return SCHEDULER_STATUS.IN_PROGRESS;
  }

  if (normalizedInput === 'ready' || normalizedInput === 'readytostart') {
    return SCHEDULER_STATUS.READY_TO_START;
  }

  const canonicalStatus = Object.values(SCHEDULER_STATUS).find(
    (value) => String(value).trim().toLowerCase() === normalizedInput
  );

  return canonicalStatus || status;
};

export const isSchedulerInProgress = (status) => {
  const normalizedStatus = normalizeSchedulerStatus(status);
  return normalizedStatus === SCHEDULER_STATUS.IN_PROGRESS;
};

export const isSchedulerAwaitingPayment = (schedule) => {
  const normalizedStatus = normalizeSchedulerStatus(schedule?.status);
  return (
    (normalizedStatus === SCHEDULER_STATUS.APPROVED || normalizedStatus === SCHEDULER_STATUS.AWAITING_PAYMENT) &&
    (!schedule?.paymentStatus || schedule.paymentStatus === 'pending') &&
    Number(schedule?.estimatedAmount || 0) > 0
  );
};

/**
 * Validate a status against allowed values
 * @param {string} status - Status to validate
 * @param {string} type - Status type: 'project', 'task', 'scheduler', 'webhook'
 * @returns {boolean} True if status is valid
 */
export const isValidStatus = (status, type = 'project') => {
  const statusMap = {
    project: Object.values(PROJECT_STATUS),
    task: Object.values(TASK_STATUS),
    scheduler: Object.values(SCHEDULER_STATUS),
    webhook: Object.values(WEBHOOK_STATUS)
  };
  
  return (statusMap[type] || []).includes(status);
};
