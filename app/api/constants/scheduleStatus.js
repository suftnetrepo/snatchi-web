// Schedule status constants
const SCHEDULE_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  APPROVED: 'Approved',
  AWAITING_PAYMENT: 'AwaitingPayment',
  PAID: 'Paid',
  READY_TO_START: 'ReadyToStart',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PAYMENT_FAILED: 'PaymentFailed'
};

// Integrator Connect status constants
const INTEGRATOR_CONNECT_STATUS = {
  NOT_STARTED: 'not_started',
  ONBOARDING_STARTED: 'onboarding_started',
  VERIFIED: 'verified',
  RESTRICTED: 'restricted',
  REQUIREMENTS_PENDING: 'requirements_pending',
  VERIFICATION_FAILED: 'verification_failed'
};

/**
 * Normalize schedule status string
 * Handles both legacy and new status formats
 */
function normalizeSchedulerStatus(status) {
  if (!status) return null;

  const statusStr = String(status).trim();
  const normalized = Object.values(SCHEDULE_STATUS).find(
    (s) => s.toLowerCase() === statusStr.toLowerCase()
  );

  return normalized || null;
}

/**
 * Check if a status string is valid
 */
function isValidScheduleStatus(status) {
  return normalizeSchedulerStatus(status) !== null;
}

/**
 * Check if schedule is in a terminal state
 */
function isTerminalStatus(status) {
  const normalized = normalizeSchedulerStatus(status);
  return [
    SCHEDULE_STATUS.COMPLETED,
    SCHEDULE_STATUS.CANCELLED,
    SCHEDULE_STATUS.DECLINED,
    SCHEDULE_STATUS.PAYMENT_FAILED
  ].includes(normalized);
}

/**
 * Check if schedule is in progress
 */
function isSchedulerInProgress(status) {
  const normalized = normalizeSchedulerStatus(status);
  return normalized === SCHEDULE_STATUS.IN_PROGRESS;
}

/**
 * Check if schedule is awaiting payment
 */
function isAwaitingPayment(status) {
  const normalized = normalizeSchedulerStatus(status);
  return [
    SCHEDULE_STATUS.APPROVED,
    SCHEDULE_STATUS.AWAITING_PAYMENT
  ].includes(normalized);
}

/**
 * Check if schedule is ready to start
 */
function isReadyToStart(status) {
  const normalized = normalizeSchedulerStatus(status);
  return normalized === SCHEDULE_STATUS.READY_TO_START;
}

/**
 * Get all valid statuses
 */
function getAllStatuses() {
  return Object.values(SCHEDULE_STATUS);
}

/**
 * Get status display name (for UI)
 */
function getStatusDisplayName(status) {
  const displayNames = {
    [SCHEDULE_STATUS.PENDING]: 'Pending',
    [SCHEDULE_STATUS.ACCEPTED]: 'Accepted',
    [SCHEDULE_STATUS.DECLINED]: 'Declined',
    [SCHEDULE_STATUS.APPROVED]: 'Approved',
    [SCHEDULE_STATUS.AWAITING_PAYMENT]: 'Awaiting Payment',
    [SCHEDULE_STATUS.PAID]: 'Paid',
    [SCHEDULE_STATUS.READY_TO_START]: 'Ready to Start',
    [SCHEDULE_STATUS.IN_PROGRESS]: 'In Progress',
    [SCHEDULE_STATUS.COMPLETED]: 'Completed',
    [SCHEDULE_STATUS.CANCELLED]: 'Cancelled',
    [SCHEDULE_STATUS.PAYMENT_FAILED]: 'Payment Failed'
  };

  const normalized = normalizeSchedulerStatus(status);
  return displayNames[normalized] || status;
}

module.exports = {
  SCHEDULE_STATUS,
  INTEGRATOR_CONNECT_STATUS,
  normalizeSchedulerStatus,
  isValidScheduleStatus,
  isTerminalStatus,
  isSchedulerInProgress,
  isAwaitingPayment,
  isReadyToStart,
  getAllStatuses,
  getStatusDisplayName
};
