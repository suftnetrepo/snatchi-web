'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import './NotificationBell.scss';

export default function NotificationBell({ onClick, isOpen = false, unreadCount = 0 }) {
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
