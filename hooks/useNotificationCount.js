'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useNotificationCount - Fetch and refresh unread notification count
 *
 * Features:
 * - Fetches unread count on mount
 * - Auto-refreshes at configurable interval
 * - Supports manual refetch
 * - Cleans up on unmount
 * - Handles auth expiration safely
 * - Avoids excessive polling with debounce
 */
export function useNotificationCount(refreshInterval = 30000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const lastFetchRef = useRef(0);
  const MIN_FETCH_INTERVAL = 3000; // Prevent spam - min 3 seconds between fetches

  // Fetch unread count
  const fetchUnreadCount = useCallback(async (force = false) => {
    // Prevent excessive polling
    const now = Date.now();
    if (!force && now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
      return;
    }

    lastFetchRef.current = now;

    try {
      const response = await fetch('/api/notifications/unread-count', {
        credentials: 'include' // Include cookies for authentication
      });

      if (response.status === 401) {
        // Auth expired
        setError('Unauthorized');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const { success, data, error: apiError } = await response.json();

      if (!success) {
        throw new Error(apiError || 'Failed to fetch unread count');
      }

      setUnreadCount(data.count || 0);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      // Don't reset count on error - keep previous value for UX
    }
  }, []);

  // Setup auto-refresh on mount
  useEffect(() => {
    // Initial fetch
    fetchUnreadCount(true);

    // Setup periodic refresh
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchUnreadCount();
      }, refreshInterval);
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, fetchUnreadCount]);

  // Refetch function for manual updates (e.g., after mark-as-read)
  const refetch = useCallback(() => {
    fetchUnreadCount(true);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    error,
    refetch
  };
}
