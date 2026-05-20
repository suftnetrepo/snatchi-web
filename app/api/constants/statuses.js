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
  PAID: 'Paid',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PROGRESS: 'Progress'
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
    'Paid': 'Paid',
    'Cancelled': 'Cancelled'
  };
  return labels[status] || status;
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
