/**
 * Notification Events Wrapper Layer
 * 
 * Purpose:
 * Central point for all workflow → notification mappings.
 * Prevents duplicate notification logic across codebase.
 * 
 * All workflow events should call these methods instead of
 * directly calling notificationService.createNotification()
 * 
 * Each method:
 * - Builds standardized notification payload
 * - Resolves recipients
 * - Calls notificationService internally
 * - Includes audit logging
 * - Handles edge cases
 */

const notificationService = require('./notificationService');
const { NOTIFICATION_TYPES, NOTIFICATION_SCREENS, RECIPIENT_TYPES } = require('../constants/notificationTypes');
const { logger } = require('../utils/logger');

/**
 * Helper: Log notification event
 */
const logNotificationEvent = (eventType, recipientCount, metadata = {}) => {
  logger.info(`Notification event triggered: ${eventType}`, {
    event: eventType,
    recipientCount,
    ...metadata
  });
};

/**
 * Helper: Log notification error
 */
const logNotificationError = (eventType, error, metadata = {}) => {
  logger.error(`Failed to trigger notification event: ${eventType}`, {
    event: eventType,
    error: error.message,
    stack: error.stack,
    ...metadata
  });
};

/**
 * BOOKING CREATED
 * 
 * Triggered when: Integrator B creates a booking/schedule
 * Notify: Engineer
 * Priority: high
 */
const bookingCreated = async (payload) => {
  const {
    scheduleId,
    engineerId,
    projectName,
    startDate,
    status,
    startTime,
    endTime,  
    endDate,
    projectId,
    projectDescription,
    radius,
    activeDays,
    completeAddress,
    latitude,
    longitude,
    integratorId,
    priority
  } = payload;

  try {
    const formattedDate = new Date(startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    await notificationService.createNotification({
      recipient: {
        userId: engineerId,
        type: RECIPIENT_TYPES.USER
      },
      type: NOTIFICATION_TYPES.BOOKING_CREATED,
      title: 'New Booking Request',
      body: `New booking for ${projectName} - ${formattedDate}`,
      screen: NOTIFICATION_SCREENS.CALENDAR,
      screenParams: {
        scheduleId: scheduleId.toString(),
        projectName,
        status,
        startDate,
        endDate,
        startTime,
        endTime,
        projectId,
        projectDescription,
        radius,
        activeDays,
        completeAddress,
        latitude,
        longitude,
        integratorId,
        priority
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'high'
    });

    logNotificationEvent('BOOKING_CREATED', 1, {
      engineerId,
      scheduleId,
      projectName
    });
  } catch (error) {
    logNotificationError('BOOKING_CREATED', error, {
      engineerId,
      scheduleId
    });
    throw error;
  }
};

/**
 * BOOKING ACCEPTED
 * 
 * Triggered when: Engineer accepts schedule
 * Notify: Receiving Integrator (integrator A)
 * Priority: high
 */
const bookingAccepted = async (payload) => {
  const {
    scheduleId,
    receivingIntegratorId,
    engineerName,
    projectName,
    projectDescription
  } = payload;

  try {
    await notificationService.createNotification({
      recipient: {
        integratorId: receivingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.ENGINEER_ACCEPTED,
      title: 'Engineer Accepted',
      body: `${engineerName} accepted the booking for ${projectName}`,
      screen: NOTIFICATION_SCREENS.SCHEDULES,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'high'
    });

    logNotificationEvent('BOOKING_ACCEPTED', 1, {
      receivingIntegratorId,
      scheduleId,
      engineerName
    });
  } catch (error) {
    logNotificationError('BOOKING_ACCEPTED', error, {
      receivingIntegratorId,
      scheduleId
    });
    throw error;
  }
};

/**
 * BOOKING DECLINED
 * 
 * Triggered when: Engineer declines schedule
 * Notify: Paying Integrator (integrator B)
 * Priority: high
 */
const bookingDeclined = async (payload) => {
  const {
    scheduleId,
    payingIntegratorId,
    engineerName,
    projectName,
    declineReason,
    status
  } = payload;

  try {
    await notificationService.createNotification({
      recipient: {
        integratorId: payingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.ENGINEER_DECLINED,
      title: 'Engineer Declined Booking',
      body: `${engineerName} declined the booking for ${projectName}`,
      status: status,
      screen: NOTIFICATION_SCREENS.SCHEDULES,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'high'
    });

    logNotificationEvent('BOOKING_DECLINED', 1, {
      payingIntegratorId,
      scheduleId,
      engineerName
    });
  } catch (error) {
    logNotificationError('BOOKING_DECLINED', error, {
      payingIntegratorId,
      scheduleId
    });
    throw error;
  }
};

/**
 * BOOKING APPROVED
 * 
 * Triggered when: Receiving Integrator (A) approves schedule
 * Notify: 
 *   - Engineer
 *   - Paying Integrator (B)
 * Priority: high
 */
const bookingApproved = async (payload) => {
  const {
    scheduleId,
    engineerId,
    payingIntegratorId,
    projectName,
    siteLocation,
    startDate
  } = payload;

  try {
    const formattedDate = new Date(startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Notify Engineer
    await notificationService.createNotification({
      recipient: {
        userId: engineerId,
        type: RECIPIENT_TYPES.USER
      },
      type: NOTIFICATION_TYPES.BOOKING_APPROVED,
      title: 'Booking Approved',
      body: `Your booking for ${projectName} has been approved. Awaiting payment.`,
      screen: NOTIFICATION_SCREENS.CALENDAR,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'high'
    });

    // Notify Paying Integrator
    await notificationService.createNotification({
      recipient: {
        integratorId: payingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.BOOKING_APPROVED,
      title: 'Booking Approved',
      body: `Booking for ${projectName} approved. Payment now due.`,
      screen: NOTIFICATION_SCREENS.PAYMENTS,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'high'
    });

    logNotificationEvent('BOOKING_APPROVED', 2, {
      engineerId,
      payingIntegratorId,
      scheduleId
    });
  } catch (error) {
    logNotificationError('BOOKING_APPROVED', error, {
      engineerId,
      payingIntegratorId,
      scheduleId
    });
    throw error;
  }
};

/**
 * PAYMENT COMPLETED
 * 
 * Triggered when: Stripe payment succeeds
 * Notify:
 *   - Engineer
 *   - Receiving Integrator (A)
 *   - Paying Integrator (B)
 * Priority: high
 * 
 * NOTE: Deduplicated to prevent duplicate sends on webhook retry
 */
const paymentCompleted = async (payload) => {
  const {
    scheduleId,
    paymentId,
    engineerId,
    payingIntegratorId,
    receivingIntegratorId,
    projectName,
    amountPaid
  } = payload;

  try {
    // Check if notification already sent (idempotency)
    // Notification model will be checked via relatedTo.payment
    const Notification = require('../models/notification');
    const existingNotification = await Notification.findOne({
      'relatedTo.payment': paymentId,
      type: NOTIFICATION_TYPES.PAYMENT_COMPLETED
    });

    if (existingNotification) {
      logger.info('Payment completed notification already sent', {
        paymentId,
        notificationId: existingNotification._id
      });
      return;
    }

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amountPaid / 100);

    // Notify Engineer
    await notificationService.createNotification({
      recipient: {
        userId: engineerId,
        type: RECIPIENT_TYPES.USER
      },
      type: NOTIFICATION_TYPES.PAYMENT_COMPLETED,
      title: 'Payment Confirmed',
      body: `Payment of ${formattedAmount} confirmed for ${projectName}`,
      screen: NOTIFICATION_SCREENS.PAYMENTS,
      screenParams: {
        paymentId: paymentId.toString(),
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId,
        payment: paymentId
      },
      priority: 'high'
    });

    // Notify Receiving Integrator (A)
    await notificationService.createNotification({
      recipient: {
        integratorId: receivingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.PAYMENT_COMPLETED,
      title: 'Payment Received',
      body: `Payment of ${formattedAmount} received for ${projectName}`,
      screen: NOTIFICATION_SCREENS.PAYMENTS,
      screenParams: {
        paymentId: paymentId.toString()
      },
      relatedTo: {
        schedule: scheduleId,
        payment: paymentId
      },
      priority: 'high'
    });

    // Notify Paying Integrator (B)
    await notificationService.createNotification({
      recipient: {
        integratorId: payingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.PAYMENT_COMPLETED,
      title: 'Payment Completed',
      body: `Payment of ${formattedAmount} processed for ${projectName}`,
      screen: NOTIFICATION_SCREENS.PAYMENTS,
      screenParams: {
        paymentId: paymentId.toString()
      },
      relatedTo: {
        schedule: scheduleId,
        payment: paymentId
      },
      priority: 'high'
    });

    logNotificationEvent('PAYMENT_COMPLETED', 3, {
      engineerId,
      payingIntegratorId,
      receivingIntegratorId,
      paymentId,
      scheduleId
    });
  } catch (error) {
    logNotificationError('PAYMENT_COMPLETED', error, {
      paymentId,
      scheduleId
    });
    throw error;
  }
};

/**
 * PAYMENT FAILED
 * 
 * Triggered when: Stripe payment fails
 * Notify: Paying Integrator (B)
 * Priority: high
 * 
 * NOTE: Deduplicated to prevent duplicate sends on webhook retry
 */
const paymentFailed = async (payload) => {
  const {
    scheduleId,
    paymentId,
    payingIntegratorId,
    projectName,
    failureReason
  } = payload;

  try {
    // Check if notification already sent (idempotency)
    const Notification = require('../models/notification');
    const existingNotification = await Notification.findOne({
      'relatedTo.payment': paymentId,
      type: NOTIFICATION_TYPES.PAYMENT_FAILED
    });

    if (existingNotification) {
      logger.info('Payment failed notification already sent', {
        paymentId,
        notificationId: existingNotification._id
      });
      return;
    }

    await notificationService.createNotification({
      recipient: {
        integratorId: payingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.PAYMENT_FAILED,
      title: 'Payment Failed',
      body: `Payment for ${projectName} failed: ${failureReason}. Please retry.`,
      screen: NOTIFICATION_SCREENS.PAYMENTS,
      screenParams: {
        paymentId: paymentId.toString(),
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId,
        payment: paymentId
      },
      priority: 'high'
    });

    logNotificationEvent('PAYMENT_FAILED', 1, {
      payingIntegratorId,
      paymentId,
      scheduleId
    });
  } catch (error) {
    logNotificationError('PAYMENT_FAILED', error, {
      paymentId,
      scheduleId
    });
    throw error;
  }
};

/**
 * READY TO START
 * 
 * Triggered when: Schedule status becomes ReadyToStart (payment succeeded)
 * Notify: Engineer
 * Priority: high
 */
const readyToStart = async (payload) => {
  const {
    scheduleId,
    engineerId,
    projectName,
    siteLocation,
    startDate
  } = payload;

  try {
    const formattedDate = new Date(startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    await notificationService.createNotification({
      recipient: {
        userId: engineerId,
        type: RECIPIENT_TYPES.USER
      },
      type: NOTIFICATION_TYPES.READY_TO_START,
      title: 'Payment Confirmed — Ready to Start',
      body: `${projectName} at ${siteLocation} starts ${formattedDate}`,
      screen: NOTIFICATION_SCREENS.CALENDAR,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'high'
    });

    logNotificationEvent('READY_TO_START', 1, {
      engineerId,
      scheduleId
    });
  } catch (error) {
    logNotificationError('READY_TO_START', error, {
      engineerId,
      scheduleId
    });
    throw error;
  }
};

/**
 * WORK STARTED
 * 
 * Triggered when: Engineer marks job as started
 * Notify:
 *   - Paying Integrator (B)
 *   - Receiving Integrator (A)
 * Priority: normal
 */
const workStarted = async (payload) => {
  const {
    scheduleId,
    payingIntegratorId,
    receivingIntegratorId,
    projectName,
    engineerName
  } = payload;

  try {
    // Notify Paying Integrator
    await notificationService.createNotification({
      recipient: {
        integratorId: payingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.WORK_STARTED,
      title: 'Work Started',
      body: `${engineerName} started work on ${projectName}`,
      screen: NOTIFICATION_SCREENS.SCHEDULES,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'normal'
    });

    // Notify Receiving Integrator
    await notificationService.createNotification({
      recipient: {
        integratorId: receivingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.WORK_STARTED,
      title: 'Work Started',
      body: `Work on ${projectName} has started`,
      screen: NOTIFICATION_SCREENS.SCHEDULES,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'normal'
    });

    logNotificationEvent('WORK_STARTED', 2, {
      payingIntegratorId,
      receivingIntegratorId,
      scheduleId
    });
  } catch (error) {
    logNotificationError('WORK_STARTED', error, {
      payingIntegratorId,
      receivingIntegratorId,
      scheduleId
    });
    throw error;
  }
};

/**
 * WORK COMPLETED
 * 
 * Triggered when: Engineer marks job as completed
 * Notify:
 *   - Paying Integrator (B)
 *   - Receiving Integrator (A)
 * Priority: normal
 */
const workCompleted = async (payload) => {
  const {
    scheduleId,
    payingIntegratorId,
    receivingIntegratorId,
    projectName,
    engineerName
  } = payload;

  try {
    // Notify Paying Integrator
    await notificationService.createNotification({
      recipient: {
        integratorId: payingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.WORK_COMPLETED,
      title: 'Work Completed',
      body: `${engineerName} completed work on ${projectName}`,
      screen: NOTIFICATION_SCREENS.SCHEDULES,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'normal'
    });

    // Notify Receiving Integrator
    await notificationService.createNotification({
      recipient: {
        integratorId: receivingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.WORK_COMPLETED,
      title: 'Work Completed',
      body: `Work on ${projectName} is complete`,
      screen: NOTIFICATION_SCREENS.SCHEDULES,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'normal'
    });

    logNotificationEvent('WORK_COMPLETED', 2, {
      payingIntegratorId,
      receivingIntegratorId,
      scheduleId
    });
  } catch (error) {
    logNotificationError('WORK_COMPLETED', error, {
      payingIntegratorId,
      receivingIntegratorId,
      scheduleId
    });
    throw error;
  }
};

/**
 * SCHEDULE UPDATED
 * 
 * Triggered when: Schedule fields are modified
 * Notify: All affected parties
 * Priority: normal
 * 
 * Note: Only notify if significant changes (date, time, location)
 */
const scheduleUpdated = async (payload) => {
  const {
    scheduleId,
    engineerId,
    payingIntegratorId,
    receivingIntegratorId,
    projectName,
    updatedFields
  } = payload;

  try {
    // Only notify if significant changes
    const significantFields = ['startDate', 'endDate', 'location', 'siteLocation', 'payingIntegrator'];
    const changedSignificantFields = Object.keys(updatedFields || {}).filter((key) =>
      significantFields.includes(key)
    );

    if (changedSignificantFields.length === 0) {
      logger.info('Schedule update notification skipped - no significant changes', {
        scheduleId,
        updatedFields: Object.keys(updatedFields || {})
      });
      return;
    }

    // Notify Engineer
    await notificationService.createNotification({
      recipient: {
        userId: engineerId,
        type: RECIPIENT_TYPES.USER
      },
      type: NOTIFICATION_TYPES.SCHEDULE_UPDATED,
      title: 'Schedule Updated',
      body: `Schedule for ${projectName} has been updated`,
      screen: NOTIFICATION_SCREENS.CALENDAR,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'normal'
    });

    // Notify Paying Integrator
    await notificationService.createNotification({
      recipient: {
        integratorId: payingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.SCHEDULE_UPDATED,
      title: 'Schedule Updated',
      body: `Schedule for ${projectName} has been updated`,
      screen: NOTIFICATION_SCREENS.SCHEDULES,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'normal'
    });

    // Notify Receiving Integrator
    await notificationService.createNotification({
      recipient: {
        integratorId: receivingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.SCHEDULE_UPDATED,
      title: 'Schedule Updated',
      body: `Schedule for ${projectName} has been updated`,
      screen: NOTIFICATION_SCREENS.SCHEDULES,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'normal'
    });

    logNotificationEvent('SCHEDULE_UPDATED', 3, {
      engineerId,
      payingIntegratorId,
      receivingIntegratorId,
      scheduleId,
      changedFields: changedSignificantFields
    });
  } catch (error) {
    logNotificationError('SCHEDULE_UPDATED', error, {
      engineerId,
      scheduleId
    });
    throw error;
  }
};

/**
 * SCHEDULE CANCELLED
 * 
 * Triggered when: Schedule is cancelled
 * Notify: All affected parties
 * Priority: high
 */
const scheduleCancelled = async (payload) => {
  const {
    scheduleId,
    engineerId,
    payingIntegratorId,
    receivingIntegratorId,
    projectName,
    cancellationReason
  } = payload;

  try {
    // Notify Engineer
    await notificationService.createNotification({
      recipient: {
        userId: engineerId,
        type: RECIPIENT_TYPES.USER
      },
      type: NOTIFICATION_TYPES.SCHEDULE_CANCELLED,
      title: 'Booking Cancelled',
      body: `Booking for ${projectName} has been cancelled`,
      screen: NOTIFICATION_SCREENS.CALENDAR,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'high'
    });

    // Notify Paying Integrator
    await notificationService.createNotification({
      recipient: {
        integratorId: payingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.SCHEDULE_CANCELLED,
      title: 'Booking Cancelled',
      body: `Booking for ${projectName} has been cancelled`,
      screen: NOTIFICATION_SCREENS.SCHEDULES,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'high'
    });

    // Notify Receiving Integrator
    await notificationService.createNotification({
      recipient: {
        integratorId: receivingIntegratorId,
        type: RECIPIENT_TYPES.INTEGRATOR
      },
      type: NOTIFICATION_TYPES.SCHEDULE_CANCELLED,
      title: 'Booking Cancelled',
      body: `Booking for ${projectName} has been cancelled`,
      screen: NOTIFICATION_SCREENS.SCHEDULES,
      screenParams: {
        scheduleId: scheduleId.toString()
      },
      relatedTo: {
        schedule: scheduleId
      },
      priority: 'high'
    });

    logNotificationEvent('SCHEDULE_CANCELLED', 3, {
      engineerId,
      payingIntegratorId,
      receivingIntegratorId,
      scheduleId
    });
  } catch (error) {
    logNotificationError('SCHEDULE_CANCELLED', error, {
      engineerId,
      scheduleId
    });
    throw error;
  }
};

module.exports = {
  bookingCreated,
  bookingAccepted,
  bookingDeclined,
  bookingApproved,
  paymentCompleted,
  paymentFailed,
  readyToStart,
  workStarted,
  workCompleted,
  scheduleUpdated,
  scheduleCancelled
};
