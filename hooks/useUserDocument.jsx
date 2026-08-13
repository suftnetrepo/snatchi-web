import { useCallback, useEffect, useRef, useState } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { USER_DOCUMENTS } from '../utils/apiUrl';

const useUserDocument = (userId, enabled = true) => {
  const requestSequence = useRef(0);
  const [state, setState] = useState({ data: [], loading: false, error: null });

  const handleReset = useCallback(() => {
    setState((previous) => ({ ...previous, error: null }));
  }, []);

  const handleError = useCallback((error) => {
    setState((previous) => ({ ...previous, error, loading: false }));
  }, []);

  const handleFetch = useCallback(async (targetUserId) => {
    if (!targetUserId) return false;
    const sequence = ++requestSequence.current;
    setState((previous) => ({ ...previous, data: [], loading: true, error: null }));
    const { data, success, errorMessage } = await zat(USER_DOCUMENTS.fetch, null, VERBS.GET, { userId: targetUserId });
    if (sequence !== requestSequence.current) return false;
    if (!success) {
      handleError(errorMessage || 'Unable to load documents.');
      return false;
    }
    setState((previous) => ({ ...previous, data: Array.isArray(data) ? data : [], loading: false }));
    return true;
  }, [handleError]);

  const handleUpload = useCallback(async (body) => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    const { data, success, errorMessage } = await zat(USER_DOCUMENTS.addOne, body, VERBS.POST);
    if (!success) {
      handleError(errorMessage || 'Unable to upload the document.');
      return false;
    }
    setState((previous) => ({ ...previous, data: [data, ...previous.data], loading: false }));
    return true;
  }, [handleError]);

  const handleDelete = useCallback(async (documentId) => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    const { success, errorMessage } = await zat(USER_DOCUMENTS.removeOne, null, VERBS.DELETE, {
      id: documentId,
      userId
    });
    if (!success) {
      handleError(errorMessage || 'Failed to delete the document.');
      return false;
    }
    setState((previous) => ({
      ...previous,
      data: previous.data.filter((document) => document._id !== documentId),
      loading: false
    }));
    return true;
  }, [handleError, userId]);

  useEffect(() => {
    if (enabled && userId) handleFetch(userId);
    if (!enabled) requestSequence.current += 1;
  }, [enabled, handleFetch, userId]);

  return { ...state, handleUpload, handleFetch, handleDelete, handleReset };
};

export { useUserDocument };
