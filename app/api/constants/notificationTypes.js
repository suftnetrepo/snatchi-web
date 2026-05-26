// Notification type constants
const NOTIFICATION_TYPES = {
  BOOKING_CREATED: 'booking_created',
  BOOKING_ACCEPTED: 'booking_accepted',
  BOOKING_APPROVED: 'booking_approved',
  BOOKING_DECLINED: 'booking_declined',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  READY_TO_START: 'ready_to_start',
  SCHEDULE_UPDATED: 'schedule_updated',
  SCHEDULE_CANCELLED: 'schedule_cancelled',
  WORK_STARTED: 'work_started',
  WORK_COMPLETED: 'work_completed',
  ENGINEER_ACCEPTED: 'engineer_accepted',
  ENGINEER_DECLINED: 'engineer_declined'
};

// Notification priority levels
const NOTIFICATION_PRIORITY = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low'
};

// Notification screens
const NOTIFICATION_SCREENS = {
  CALENDAR: 'calendar',
  PAYMENTS: 'payments',
  SCHEDULES: 'schedules',
  PROFILE: 'profile',
  HOME: 'home'
};

// Recipient types
const RECIPIENT_TYPES = {
  USER: 'user',
  INTEGRATOR: 'integrator'
};

// Channel types
const CHANNEL_TYPES = {
  PUSH: 'push',
  IN_APP: 'in-app'
};

// Device types
const DEVICE_TYPES = {
  WEB: 'web',
  MOBILE_iOS: 'mobile_ios',
  MOBILE_ANDROID: 'mobile_android'
};

// Notification templates
const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.BOOKING_CREATED]: {
    title: 'New Booking Available',
    bodyTemplate: (data) => `You have a new booking for ${data.projectName}`,
    screen: NOTIFICATION_SCREENS.CALENDAR,
    priority: NOTIFICATION_PRIORITY.HIGH
  },

  [NOTIFICATION_TYPES.BOOKING_ACCEPTED]: {
    title: 'Booking Accepted',
    bodyTemplate: (data) => `Your booking for ${data.projectName} has been accepted`,
    screen: NOTIFICATION_SCREENS.CALENDAR,
    priority: NOTIFICATION_PRIORITY.NORMAL
  },

  [NOTIFICATION_TYPES.BOOKING_APPROVED]: {
    title: 'Booking Approved',
    bodyTemplate: (data) => `Your booking for ${data.projectName} has been approved`,
    screen: NOTIFICATION_SCREENS.CALENDAR,
    priority: NOTIFICATION_PRIORITY.HIGH
  },

  [NOTIFICATION_TYPES.BOOKING_DECLINED]: {
    title: 'Booking Declined',
    bodyTemplate: (data) => `Your booking for ${data.projectName} was declined`,
    screen: NOTIFICATION_SCREENS.CALENDAR,
    priority: NOTIFICATION_PRIORITY.NORMAL
  },

  [NOTIFICATION_TYPES.PAYMENT_COMPLETED]: {
    title: 'Payment Received',
    bodyTemplate: (data) => `Payment of ${data.amount} has been processed`,
    screen: NOTIFICATION_SCREENS.PAYMENTS,
    priority: NOTIFICATION_PRIORITY.HIGH
  },

  [NOTIFICATION_TYPES.PAYMENT_FAILED]: {
    title: 'Payment Failed',
    bodyTemplate: (data) => `Payment failed: ${data.reason || 'Please retry'}`,
    screen: NOTIFICATION_SCREENS.PAYMENTS,
    priority: NOTIFICATION_PRIORITY.HIGH
  },

  [NOTIFICATION_TYPES.READY_TO_START]: {
    title: 'Ready to Start',
    bodyTemplate: (data) => `Your booking is ready to start at ${data.startTime}`,
    screen: NOTIFICATION_SCREENS.CALENDAR,
    priority: NOTIFICATION_PRIORITY.HIGH
  },

  [NOTIFICATION_TYPES.SCHEDULE_UPDATED]: {
    title: 'Schedule Updated',
    bodyTemplate: (data) => `Your schedule has been updated: ${data.changeSummary}`,
    screen: NOTIFICATION_SCREENS.CALENDAR,
    priority: NOTIFICATION_PRIORITY.NORMAL
  },

  [NOTIFICATION_TYPES.SCHEDULE_CANCELLED]: {
    title: 'Schedule Cancelled',
    bodyTemplate: (data) => `Your schedule has been cancelled${data.reason ? ': ' + data.reason : ''}`,
    screen: NOTIFICATION_SCREENS.CALENDAR,
    priority: NOTIFICATION_PRIORITY.NORMAL
  },

  [NOTIFICATION_TYPES.WORK_STARTED]: {
    title: 'Work Started',
    bodyTemplate: (data) => `${data.engineerName} has started work on ${data.projectName}`,
    screen: NOTIFICATION_SCREENS.SCHEDULES,
    priority: NOTIFICATION_PRIORITY.NORMAL
  },

  [NOTIFICATION_TYPES.WORK_COMPLETED]: {
    title: 'Work Completed',
    bodyTemplate: (data) => `${data.engineerName} has completed work on ${data.projectName}`,
    screen: NOTIFICATION_SCREENS.SCHEDULES,
    priority: NOTIFICATION_PRIORITY.NORMAL
  },

  [NOTIFICATION_TYPES.ENGINEER_ACCEPTED]: {
    title: 'Engineer Accepted',
    bodyTemplate: (data) => `${data.engineerName} accepted your booking request`,
    screen: NOTIFICATION_SCREENS.SCHEDULES,
    priority: NOTIFICATION_PRIORITY.HIGH
  },

  [NOTIFICATION_TYPES.ENGINEER_DECLINED]: {
    title: 'Engineer Declined',
    bodyTemplate: (data) => `${data.engineerName} declined your booking request`,
    screen: NOTIFICATION_SCREENS.SCHEDULES,
    priority: NOTIFICATION_PRIORITY.NORMAL
  }
};

module.exports = {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_SCREENS,
  RECIPIENT_TYPES,
  CHANNEL_TYPES,
  DEVICE_TYPES,
  NOTIFICATION_TEMPLATES
};
