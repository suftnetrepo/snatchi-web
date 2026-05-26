/**
 * notificationNavigation.js
 *
 * Centralized helper for building navigation routes from notifications
 * Prevents scattered routing logic across components
 *
 * Usage:
 * const route = buildNotificationRoute(notification);
 * router.push(route);
 */

/**
 * Build navigation route from notification
 *
 * @param {Object} notification - Notification document
 * @returns {string} - Route to navigate to
 */
export function buildNotificationRoute(notification) {
  if (!notification) return '/protected/engineer/calendar';

  const { screen, screenParams = {}, relatedTo = {} } = notification;

  // Build route based on screen type
  switch (screen) {
    case 'calendar':
      // Schedule/booking related
      if (relatedTo.schedule) {
        return `/protected/engineer/calendar?scheduleId=${relatedTo.schedule}`;
      }
      return '/protected/engineer/calendar';

    case 'payments':
      // Payment related
      if (relatedTo.payment) {
        return `/protected/engineer/payments/${relatedTo.payment}`;
      }
      return '/protected/engineer/payments';

    case 'schedules':
      // Schedule/booking list
      if (relatedTo.schedule) {
        return `/protected/engineer/schedules/${relatedTo.schedule}`;
      }
      return '/protected/engineer/schedules';

    case 'profile':
      return '/protected/engineer/profile';

    case 'home':
    default:
      return '/protected/engineer/calendar';
  }
}

/**
 * Get notification type config (icon, color, title)
 * Used for rendering notification items
 */
export const NOTIFICATION_TYPE_CONFIG = {
  booking_created: {
    icon: 'fa-calendar-plus',
    color: '#3B82F6', // blue
    label: 'New Booking'
  },
  booking_accepted: {
    icon: 'fa-check-circle',
    color: '#10B981', // green
    label: 'Booking Accepted'
  },
  booking_declined: {
    icon: 'fa-times-circle',
    color: '#EF4444', // red
    label: 'Booking Declined'
  },
  booking_approved: {
    icon: 'fa-thumbs-up',
    color: '#8B5CF6', // purple
    label: 'Booking Approved'
  },
  engineer_accepted: {
    icon: 'fa-check-circle',
    color: '#10B981', // green
    label: 'Engineer Accepted'
  },
  engineer_declined: {
    icon: 'fa-times-circle',
    color: '#EF4444', // red
    label: 'Engineer Declined'
  },
  payment_completed: {
    icon: 'fa-check-circle',
    color: '#10B981', // green
    label: 'Payment Completed'
  },
  payment_failed: {
    icon: 'fa-exclamation-circle',
    color: '#EF4444', // red
    label: 'Payment Failed'
  },
  ready_to_start: {
    icon: 'fa-play-circle',
    color: '#3B82F6', // blue
    label: 'Ready to Start'
  },
  work_started: {
    icon: 'fa-hourglass-start',
    color: '#F59E0B', // amber
    label: 'Work Started'
  },
  work_completed: {
    icon: 'fa-trophy',
    color: '#10B981', // green
    label: 'Work Completed'
  },
  schedule_updated: {
    icon: 'fa-edit',
    color: '#3B82F6', // blue
    label: 'Schedule Updated'
  },
  schedule_cancelled: {
    icon: 'fa-ban',
    color: '#EF4444', // red
    label: 'Schedule Cancelled'
  }
};

/**
 * Get config for notification type
 */
export function getNotificationTypeConfig(notificationType) {
  return (
    NOTIFICATION_TYPE_CONFIG[notificationType] || {
      icon: 'fa-bell',
      color: '#6B7280',
      label: 'Notification'
    }
  );
}

/**
 * Format relative time
 * e.g., "5 minutes ago", "2 hours ago", "Yesterday"
 */
export function formatRelativeTime(date) {
  if (!date) return 'recently';

  const now = new Date();
  const notificationDate = new Date(date);
  const diffMs = now - notificationDate;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  }

  if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  }

  if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  }

  if (diffDay === 1) {
    return 'yesterday';
  }

  if (diffDay < 7) {
    return `${diffDay} days ago`;
  }

  // Show full date for older notifications
  return notificationDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Truncate text for preview
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}
