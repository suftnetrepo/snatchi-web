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
    totalCount: 0,
    userId: '',
    fields :{
      startDate : new Date(),
      endDate : new Date()
    }
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

  const handleDateChange = (name, value) => {
    setState((prevState) => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: value
      }
    }));
  };

  async function handleFetchByUser(userId, projectId, date) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, data, errorMessage } = await zat(FENCE.fetch, null, VERBS.GET, {
      action: 'getByUserOnly',
      userId: userId,
      projectId: projectId,
      date: date
    });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: data,
        loading: false,
        success: true,
        userId
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the fence.');
    }
  }

  async function handleFetchByDates( startDate, endDate, userId, id) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, data, errorMessage } = await zat(FENCE.fetch, null, VERBS.GET, {
      action: 'getByDatesUser',
      userId: userId,
      startDate: startDate,
      endDate: endDate, id
    });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: data,
        loading: false,
        success: true,
        userId
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the fence.');
    }
  }

  const handleSave = useCallback(
    async (body) => {
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
    },
    [handleError]
  );

  return {
    ...state,
    handleSave,
    handleReset,
    handleFetchByUser,
    handleFetchByDates,
    handleDateChange
  };
};

export { useFence };
