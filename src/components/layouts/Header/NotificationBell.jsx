'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import './NotificationBell.scss';

/**
 * NotificationBell Component
 *
 * Displays notification bell with unread badge
 * - Shows unread count (capped at 99+)
 * - Badge hidden when count = 0
 * - Clickable to open dropdown
 * - Accessible with ARIA labels
 * - Responsive
 *
 * Usage:
 * <NotificationBell onClick={handleBellClick} />
 */
export default function NotificationBell({ onClick, isOpen = false }) {
  const { unreadCount, loading, error } = useNotificationCount(30000); // Refresh every 30 seconds

  const displayCount = Math.min(unreadCount, 99);
  const showBadge = unreadCount > 0;

  return (
    <button
      className={`notification-bell ${isOpen ? 'active' : ''}`}
      onClick={onClick}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      title={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      data-testid="notification-bell"
    >
      <FontAwesomeIcon icon={faBell} className="bell-icon" />

      {showBadge && (
        <span
          className="notification-unread-badge"
          data-testid="notification-unread-badge"
        >
          {displayCount === 99 ? '99+' : displayCount}
        </span>
      )}
    </button>
  );
}
