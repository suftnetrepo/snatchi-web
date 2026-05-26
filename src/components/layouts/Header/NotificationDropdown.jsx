'use client';

import { useEffect, useState } from 'react';
import { Dropdown, DropdownMenu, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import {
  buildNotificationRoute,
  getNotificationTypeConfig,
  formatRelativeTime,
  truncateText
} from '@/app/utils/notificationNavigation';
import { useRouter } from 'next/navigation';
import NotificationBell from './NotificationBell';
import './NotificationDropdown.scss';

/**
 * NotificationDropdown Component
 *
 * Displays dropdown panel with latest notifications
 * - Latest 10-20 notifications
 * - Newest first
 * - Unread visually highlighted
 * - Click to navigate and mark as read
 * - "View All Notifications" link
 * - "Mark All as Read" button
 * - Loading/error states
 *
 * Usage:
 * <NotificationDropdown />
 */
export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, loading, error, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { refetch: refetchCount } = useNotificationCount();

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications({
        limit: 10,
        unreadOnly: false,
        archived: false,
        reset: true
      });
    }
  }, [isOpen, fetchNotifications]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await markAsRead(notification._id);
      refetchCount();

      // Navigate to related screen
      const route = buildNotificationRoute(notification);
      router.push(route);

      // Close dropdown
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to handle notification click', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      refetchCount();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <Dropdown className="notification-dropdown" show={isOpen} onToggle={handleBellClick}>
      <Dropdown.Toggle as="div" className="position-relative">
        <NotificationBell onClick={handleBellClick} isOpen={isOpen} />
      </Dropdown.Toggle>

      <DropdownMenu className="notification-dropdown-menu" align="end" data-testid="notification-dropdown">
        {/* Header */}
        <div className="notification-dropdown-header">
          <h6 className="mb-0">Notifications</h6>
          {notifications.length > 0 && (
            <button
              className="btn-link-sm"
              onClick={handleMarkAllAsRead}
              title="Mark all as read"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && notifications.length === 0 && (
          <div className="notification-dropdown-loading">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">Loading notifications...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="notification-dropdown-error">
            <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
            <span>Failed to load notifications</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && !error && (
          <div className="notification-dropdown-empty">
            <FontAwesomeIcon icon={faCheckCircle} className="mb-2" />
            <p>All caught up!</p>
            <small>No notifications yet</small>
          </div>
        )}

        {/* Notification List */}
        {notifications.length > 0 && (
          <div className="notification-dropdown-list">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notification-dropdown-footer">
            <button
              className="btn-link-sm w-100"
              onClick={() => {
                setIsOpen(false);
                router.push('/protected/engineer/notifications');
              }}
              data-testid="notification-view-all"
            >
              View all notifications
            </button>
          </div>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}

/**
 * Individual notification item
 */
function NotificationItem({ notification, onClick }) {
  const config = getNotificationTypeConfig(notification.type);
  const isUnread = !notification.status.read;

  return (
    <button
      className={`notification-item ${isUnread ? 'unread' : 'read'}`}
      onClick={onClick}
      data-testid="notification-item"
    >
      {/* Icon */}
      <div className="notification-item-icon" style={{ color: config.color }}>
        <FontAwesomeIcon icon={config.icon || 'fa-bell'} />
      </div>

      {/* Content */}
      <div className="notification-item-content">
        <div className="notification-item-title">{notification.title}</div>
        <div className="notification-item-body">{truncateText(notification.body, 80)}</div>
        <div className="notification-item-time">{formatRelativeTime(notification.createdAt)}</div>
      </div>

      {/* Unread Indicator */}
      {isUnread && <div className="notification-item-unread-dot" />}
    </button>
  );
}
