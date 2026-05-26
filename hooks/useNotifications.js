'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * useNotifications - Fetch and manage notifications list
 *
 * Features:
 * - Fetch notifications with pagination/limit
 * - Filter by unread/all
 * - Filter by archived
 * - Sort newest first
 * - Handle loading/error states
 * - Refetch capability
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const offsetRef = useRef(0);

  /**
   * Fetch notifications with filters
   * @param {Object} options
   * @param {number} options.limit - How many to fetch (default 20)
   * @param {boolean} options.unreadOnly - Only unread? (default false)
   * @param {boolean} options.archived - Include archived? (default false)
   * @param {boolean} options.reset - Reset offset and replace results? (default true)
   */
  const fetchNotifications = useCallback(
    async (options = {}) => {
      const {
        limit = 20,
        unreadOnly = false,
        archived = false,
        reset = true
      } = options;

      try {
        setLoading(true);
        setError(null);

        if (reset) {
          offsetRef.current = 0;
        }

        const url = new URL('/api/notifications', window.location.origin);
        url.searchParams.set('limit', Math.min(limit, 100));
        url.searchParams.set('offset', offsetRef.current);
        url.searchParams.set('unread', unreadOnly.toString());
        url.searchParams.set('archived', archived.toString());

        const response = await fetch(url.toString(), {
          credentials: 'include' // Include cookies for authentication
        });

        if (response.status === 401) {
          setError('Unauthorized');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const { success, data, error: apiError } = await response.json();

        if (!success) {
          throw new Error(apiError || 'Failed to fetch notifications');
        }

        // data structure: { notifications: [], total: number }
        const { notifications: newNotifications = [], total = 0 } = data;

        if (reset) {
          setNotifications(newNotifications);
        } else {
          // Append for pagination
          setNotifications((prev) => [...prev, ...newNotifications]);
        }

        // Check if there are more
        const fetched = reset ? newNotifications.length : notifications.length + newNotifications.length;
        setHasMore(fetched < total);

        // Update offset for next fetch
        offsetRef.current += newNotifications.length;

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    },
    [notifications.length]
  );

  /**
   * Load more notifications (pagination)
   */
  const loadMore = useCallback(
    async (options = {}) => {
      await fetchNotifications({
        ...options,
        reset: false
      });
    },
    [fetchNotifications]
  );

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          action: 'read',
          notificationId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId
            ? { ...n, status: { ...n.status, read: true } }
            : n
        )
      );

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          action: 'read-all'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          status: { ...n.status, read: true }
        }))
      );

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Archive a notification
   */
  const archiveNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          action: 'archive',
          notificationId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Remove from list
      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId)
      );

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          notificationId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Remove from list
      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId)
      );

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  return {
    notifications,
    loading,
    error,
    hasMore,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification
  };
}
