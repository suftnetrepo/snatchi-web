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
    handleReset
  };
};

export { useFence };