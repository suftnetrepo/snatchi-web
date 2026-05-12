import React, { useState, useCallback } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { SCHEDULER } from '../utils/apiUrl';
import { schedulerValidator, schedulerSearchValidator } from '../app/protected/integrator/rules';

interface Schedule {
  _id: string;
  integrator: string;
  project: string;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface SchedulerState {
  data: Schedule[];
  loading: boolean;
  fields: Record<string, any>;
  error: string | null;
  success: boolean;
  rules: any;
  model?: Record<string, any>;
  modelRules: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  errorMessage?: string;
}

const useScheduler = () => {
  const [state, setState] = useState<SchedulerState>({
    data: [],
    loading: false,
    fields: schedulerValidator.fields,
    error: null,
    success: false,
    rules: schedulerValidator.rules,
    model: schedulerSearchValidator.model,
    modelRules: schedulerSearchValidator.rules
  });

  const updateState = useCallback((updates: Partial<SchedulerState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  }, []);

  const handleReset = useCallback(async () => {
    updateState({ fields: schedulerValidator.reset(), success: false, loading: false, error: null });
  }, [updateState]);

  const handleChange = useCallback((name: string, value: string) => {
    setState((prevState) => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: value
      }
    }));
  }, []);

  const fetchUserSchedules = async (id: string) => {
    updateState({ loading: true, error: null });

    try {
      const params = new URLSearchParams({
        action: 'getByUser',
        id: id
      });

      // @ts-ignore
      const response: ApiResponse<Schedule[]> = await zat(SCHEDULER.getByUser, null, VERBS.GET, params);

      if (response.success) {
        updateState({ data: response.data || [], loading: false, success: true });
      } else {
        handleError(response.errorMessage || 'Failed to fetch schedules.');
      }
    } catch (error) {
      handleError('An unexpected error occurred while fetching schedules.');
    }
  };

  const handleError = useCallback(
    (error: string) => {
      updateState({ error, loading: false });
    },
    [updateState]
  );

  const handleDelete = useCallback(
    async (id: string): Promise<boolean> => {
      updateState({ loading: true, error: null });

      try {
        // @ts-ignore
        const response: ApiResponse = await zat(SCHEDULER.removeOne, null, VERBS.DELETE, { id });

        if (response.success) {
          setState((prevState) => ({
            ...prevState,
            data: prevState.data.filter((schedule) => schedule._id !== id),
            loading: false
          }));
          return true;
        } else {
          handleError(response.errorMessage || 'Failed to delete the schedule.');
          return false;
        }
      } catch (error) {
        handleError('An unexpected error occurred while deleting the schedule.');
        return false;
      }
    },
    [handleError, updateState]
  );

  const handleEdit = useCallback(
    async (body: Partial<Schedule>, id: string): Promise<boolean> => {
      updateState({ loading: true, error: null });

      try {
        // @ts-ignore
        const { data, success, errorMessage } = await zat(SCHEDULER.updateOne, body, VERBS.PUT, {
          id,
          action: 'update'
        });

        if (success) {
          setState((prevState) => ({
            ...prevState,
            data: prevState.data.map((event) => (event._id === id ? data : event)),
            loading: false,
            success: true
          }));
          return true;
        } else {
          handleError(errorMessage || 'Failed to update the schedule.');
          return false;
        }
      } catch (error) {
        handleError('An unexpected error occurred while updating the schedule.');
        return false;
      }
    },
    [handleError, updateState]
  );

  const handleEditStatus = useCallback(
    async (body: Partial<Schedule>, id: string): Promise<boolean> => {
      updateState({ loading: true, error: null });

      try {
        // @ts-ignore
        const response: ApiResponse = await zat(SCHEDULER.updateOne, body, VERBS.PUT, {
          id,
          action: 'status'
        });

        if (response.success) {
          setState((prevState) => ({
            ...prevState,
            data: prevState.data.map((schedule) => (schedule._id === id ? { ...schedule, ...body } : schedule)),
            loading: false,
            success: true
          }));
          return true;
        } else {
          handleError(response.errorMessage || 'Failed to update the schedule status.');
          return false;
        }
      } catch (error) {
        handleError('An unexpected error occurred while updating the schedule status.');
        return false;
      }
    },
    [handleError, updateState]
  );

  const handleSave = useCallback(
    async (body: Partial<Schedule>): Promise<boolean> => {
      updateState({ loading: true, error: null });

      try {
        const { data, success, errorMessage } = await zat(SCHEDULER.createOne, body, VERBS.POST);

        if (success) {
          setState((prevState) => ({
            ...prevState,
            data: [data, ...prevState.data],
            loading: false,
            success: true
          }));
          return true;
        } else {
          handleError(errorMessage || 'Failed to save the schedule.');
          return false;
        }
      } catch (error) {
        handleError('An unexpected error occurred while saving the schedule.');
        return false;
      }
    },
    [handleError]
  );

  const clearMessages = useCallback(() => {
    updateState({ error: null, success: false });
  }, [updateState]);

  return {
    ...state,
    fetchUserSchedules,
    handleChange,
    handleReset,
    handleEdit,
    handleDelete,
    handleEditStatus,
    handleSave,
    clearMessages,
  };
};

export { useScheduler };
