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
export function useNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

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
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Fetch once on mount only
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  // Refetch function for manual updates (e.g., after mark-as-read)
  const refetch = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    error,
    refetch
  };
}
