'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Spinner } from 'react-bootstrap';
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
  const containerRef = useRef(null);
  const { notifications, loading, error, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { unreadCount, refetch: refetchCount } = useNotificationCount();

  // Close when clicking outside the entire component
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Fetch notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ limit: 10, unreadOnly: false, archived: false, reset: true });
    }
  }, [isOpen, fetchNotifications]);

  const handleBellClick = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      await markAsRead(notification._id);
      refetchCount();
      const route = buildNotificationRoute(notification);
      setIsOpen(false);
      router.push(route);
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
    <div className="notification-dropdown" ref={containerRef} style={{ position: 'relative' }}>
      <div className="position-relative">
        <NotificationBell onClick={handleBellClick} isOpen={isOpen} unreadCount={unreadCount} />
      </div>

      {isOpen && (
        <div className="notification-dropdown-menu" data-testid="notification-dropdown">
        {/* Header */}
        <div className="notification-dropdown-header">
          <h6 className="mb-0">Notifications</h6>
          <div className="d-flex align-items-center gap-2">
            {notifications.length > 0 && (
              <button
                className="btn-link-sm"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                Mark all as read
              </button>
            )}
            <button
              className="btn-link-sm notification-close-btn"
              onClick={handleClose}
              title="Close"
              aria-label="Close notifications"
            >
              ✕
            </button>
          </div>
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
        </div>
      )}
    </div>
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
