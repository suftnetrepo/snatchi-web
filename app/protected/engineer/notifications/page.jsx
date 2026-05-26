'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Spinner, Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faTrash, faArchiveBox } from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import {
  buildNotificationRoute,
  getNotificationTypeConfig,
  formatRelativeTime,
  truncateText
} from '@/app/utils/notificationNavigation';
import { useRouter } from 'next/navigation';
import './page.scss';

/**
 * Notification Center Page
 * Location: /protected/engineer/notifications
 *
 * Features:
 * - Paginated list of all notifications
 * - Filter by read/unread
 * - Mark as read/mark all as read
 * - Archive/delete notifications
 * - Infinite scroll or pagination
 * - Deep linking into workflows
 */
export default function NotificationCenterPage() {
  const router = useRouter();
  const { refetch: refetchCount } = useNotificationCount();

  const [filterUnread, setFilterUnread] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const {
    notifications,
    loading,
    error,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification
  } = useNotifications();

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications({
      limit: itemsPerPage,
      unreadOnly: filterUnread,
      archived: false,
      reset: true
    });
    setCurrentPage(1);
  }, [filterUnread, itemsPerPage, fetchNotifications]);

  const handleFilterChange = (e) => {
    setFilterUnread(e.target.checked);
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await markAsRead(notification._id);
      refetchCount();

      // Navigate to related screen
      const route = buildNotificationRoute(notification);
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

  const handleArchive = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await archiveNotification(notificationId);
      refetchCount();
    } catch (err) {
      console.error('Failed to archive notification', err);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      refetchCount();
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  return (
    <Container fluid className="notification-center-page py-4" data-testid="notification-center-page">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <h2 className="mb-0">Notifications</h2>
            {notifications.length > 0 && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleMarkAllAsRead}
                data-testid="notification-mark-all-read"
              >
                Mark all as read
              </button>
            )}
          </div>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Row className="mb-4">
        <Col md={3}>
          <Form.Group>
            <Form.Check
              type="checkbox"
              id="filter-unread"
              label="Show unread only"
              checked={filterUnread}
              onChange={handleFilterChange}
              data-testid="notification-filter-unread"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Loading State */}
      {loading && notifications.length === 0 && (
        <Row>
          <Col className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-2">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="text-muted">Loading notifications...</p>
          </Col>
        </Row>
      )}

      {/* Error State */}
      {error && (
        <Row>
          <Col>
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
              <span>Failed to load notifications: {error}</span>
            </div>
          </Col>
        </Row>
      )}

      {/* Empty State */}
      {!loading && notifications.length === 0 && !error && (
        <Row>
          <Col className="text-center py-5">
            <FontAwesomeIcon icon={faCheckCircle} className="mb-3" size="3x" style={{ color: '#10B981' }} />
            <h5 className="mb-2">All caught up!</h5>
            <p className="text-muted">
              {filterUnread ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </Col>
        </Row>
      )}

      {/* Notifications List */}
      {notifications.length > 0 && (
        <Row>
          <Col>
            <div className="notification-center-list">
              {notifications.map((notification) => (
                <NotificationCenterItem
                  key={notification._id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onArchive={(e) => handleArchive(e, notification._id)}
                  onDelete={(e) => handleDelete(e, notification._id)}
                />
              ))}
            </div>
          </Col>
        </Row>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <Row className="mt-4">
          <Col className="text-center">
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                // Implement pagination/load more logic
                setCurrentPage(currentPage + 1);
              }}
            >
              Load more notifications
            </button>
          </Col>
        </Row>
      )}
    </Container>
  );
}

/**
 * Notification item for center page
 */
function NotificationCenterItem({ notification, onClick, onArchive, onDelete }) {
  const config = getNotificationTypeConfig(notification.type);
  const isUnread = !notification.status.read;

  return (
    <div
      className={`notification-center-item ${isUnread ? 'unread' : 'read'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
      data-testid={isUnread ? 'notification-item-unread' : 'notification-item-read'}
    >
      {/* Icon */}
      <div className="notification-center-item-icon" style={{ color: config.color }}>
        <FontAwesomeIcon icon={config.icon || 'fa-bell'} size="lg" />
      </div>

      {/* Content */}
      <div className="notification-center-item-content">
        <div className="notification-center-item-title">{notification.title}</div>
        <div className="notification-center-item-body">{notification.body}</div>
        <div className="notification-center-item-meta">
          <span className="notification-center-item-type">{config.label}</span>
          <span className="notification-center-item-time">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="notification-center-item-actions">
        {isUnread && <div className="notification-center-item-unread-dot" />}

        <button
          className="btn-action btn-archive"
          onClick={onArchive}
          title="Archive notification"
          aria-label="Archive notification"
        >
          <FontAwesomeIcon icon={faArchiveBox} />
        </button>

        <button
          className="btn-action btn-delete"
          onClick={onDelete}
          title="Delete notification"
          aria-label="Delete notification"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
}
