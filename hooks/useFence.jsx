import React, { useState, useCallback } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { FENCE } from '../utils/apiUrl';

const useFence = () => {
  const [state, setState] = useState({
    data: [],
    loading: false,
    error: null,
    success: false,
    totalCount: 0
  });

  const handleError = useCallback((error) => {
    setState((pre) => {
      return {
        ...pre,
        error: error,
        loading: false
      };
    });
  }, []);

  const handleReset = useCallback(() => {
    setState((pre) => {
      return {
        ...pre,
        success: false,
        loading: false,
        error: null
      };
    });
  }, []);

  async function handleFetchByUser(userId, projectId) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, data, errorMessage } = await zat(FENCE.fetch, null, VERBS.GET, {
      action: 'getByUserOnly',
      userId: userId,
      projectId: projectId
    });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: data,
        loading: false,
        success: data.length > 0,
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the fence.');
    }
  }

  const handleSave = useCallback(async (body) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { success, errorMessage } = await zat(FENCE.addOne, body, VERBS.POST);

    if (success) {
      setState((prevState) => ({
        ...prevState,
        success: true,
        loading: false
      }));

      return true;
    } else {
      handleError(errorMessage);
    }
  }, [handleError]);

  return {
    ...state,
    handleSave,
    handleReset,
    handleFetchByUser
  };
};

export { useFence };