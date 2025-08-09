import React, { useState, useEffect, useCallback } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { SCHEDULER, USER } from '../utils/apiUrl';
import { schedulerValidator } from '../app/protected/integrator/rules';

// Type definitions
interface Schedule {
  _id: string;
  startDate: string;
  endDate: string;
  status: string;
  // Add other schedule properties as needed
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  // Add other user properties as needed
}

interface Resource {
  id: string;
  name: string;
}

interface SchedulerState {
  data: Schedule[];
  resources: Resource[];
  loading: boolean;
  fields: Record<string, any>;
  error: string | null;
  success: boolean;
  rules: any;
  totalCount?: number;
}

interface FetchUsersParams {
  pageIndex?: number;
  pageSize?: number;
  sortBy?: Array<{ id: string; desc: boolean }>;
  searchQuery?: string;
}

interface FetchByDatesParams {
  startDate: string;
  endDate: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  errorMessage?: string;
  totalCount?: number;
}

const useScheduler = (flag = true) => {
  const [state, setState] = useState<SchedulerState>({
    data: [],
    resources: [],
    loading: false,
    fields: schedulerValidator.fields,
    error: null,
    success: false,
    rules: schedulerValidator.rules
  });

  // Helper function to update state
  const updateState = useCallback((updates: Partial<SchedulerState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // Reset form fields
  const handleReset = useCallback(() => {
    updateState({ fields: schedulerValidator.fields });
  }, [updateState]);

  // Handle form field changes
  const handleChange = useCallback((name: string, value: string) => {
    setState(prevState => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: value
      }
    }));
  }, []);

  // Handle date selection
  const handleSelection = useCallback((startDate: Date, endDate: Date, id: string) => {
    setState(prevState => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        startDate: startDate.toISOString().slice(0, 16),
        endDate: endDate.toISOString().slice(0, 16),
        id,
        status: 'Pending'
      }
    }));
  }, []);

  // Handle errors
  const handleError = useCallback((error: string) => {
    updateState({ error, loading: false });
  }, [updateState]);

  // Delete schedule
  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    updateState({ loading: true, error: null });
    
    try {
         // @ts-ignore
      const response: ApiResponse = await zat(SCHEDULER.removeOne, null, VERBS.DELETE, { id });

      if (response.success) {
        setState(prevState => ({
          ...prevState,
          data: prevState.data.filter(schedule => schedule._id !== id),
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
  }, [handleError, updateState]);

  // Edit schedule
  const handleEdit = useCallback(async (body: Partial<Schedule>, id: string): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
         // @ts-ignore
      const response: ApiResponse = await zat(SCHEDULER.updateOne, body, VERBS.PUT, {
        id,
        action: 'update'
      });

      if (response.success) {
        setState(prevState => ({
          ...prevState,
          data: prevState.data.map(schedule => 
            schedule._id === id ? { ...schedule, ...body } : schedule
          ),
          loading: false,
          success: true
        }));
        return true;
      } else {
        handleError(response.errorMessage || 'Failed to update the schedule.');
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while updating the schedule.');
      return false;
    }
  }, [handleError, updateState]);

  // Edit schedule status
  const handleEditStatus = useCallback(async (body: Partial<Schedule>, id: string): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
         // @ts-ignore
      const response: ApiResponse = await zat(SCHEDULER.updateOne, body, VERBS.PUT, {
        id,
        action: 'status'
      });

      if (response.success) {
        setState(prevState => ({
          ...prevState,
          data: prevState.data.map(schedule => 
            schedule._id === id ? { ...schedule, ...body } : schedule
          ),
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
  }, [handleError, updateState]);

  // Fetch users with pagination and sorting
  const handleFetchUsers = useCallback(async ({
    pageIndex = 1,
    pageSize = 10,
    sortBy = [],
    searchQuery = ''
  }: FetchUsersParams = {}): Promise<boolean> => {
    const sortField = sortBy.length > 0 ? sortBy[0].id : null;
    const sortOrder = sortBy.length > 0 ? (sortBy[0].desc ? 'desc' : 'asc') : null;

    try {
         // @ts-ignore
      const response: ApiResponse<User[]> = await zat(USER.fetch, null, VERBS.GET, {
        action: 'users',
        page: pageIndex === 0 ? 1 : pageIndex,
        limit: pageSize,
        ...(sortField && { sortField }),
        ...(sortOrder && { sortOrder }),
        searchQuery
      });

      if (response.success && response.data) {
        const resources: Resource[] = response.data.map(item => ({
          name: `${item.first_name} ${item.last_name}`,
          id: item._id
        }));

        updateState({
          data: response.data as any, // Type assertion needed due to mixed data types
          resources,
          totalCount: response.totalCount,
          loading: false
        });
        return true;
      } else {
        handleError(response.errorMessage || 'Failed to fetch users.');
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while fetching users.');
      return false;
    }
  }, [handleError, updateState]);

  // Fetch all schedules
  const handleFetch = useCallback(async (): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      const response: ApiResponse<Schedule[]> = await zat(SCHEDULER.getAll, null, VERBS.GET);

      if (response.success && response.data) {
        updateState({ data: response.data, loading: false });
        return true;
      } else {
        handleError(response.errorMessage || 'Failed to fetch schedules.');
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while fetching schedules.');
      return false;
    }
  }, [handleError, updateState]);

  // Fetch schedules by user
  const handleFetchByUser = useCallback(async (): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      const response: ApiResponse<Schedule[]> = await zat(SCHEDULER.getByUser, null, VERBS.GET);

      if (response.success && response.data) {
        updateState({ data: response.data, loading: false });
        return true;
      } else {
        handleError(response.errorMessage || 'Failed to fetch user schedules.');
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while fetching user schedules.');
      return false;
    }
  }, [handleError, updateState]);

  // Fetch schedules by date range
  const handleFetchByDates = useCallback(async ({ startDate, endDate }: FetchByDatesParams): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
         // @ts-ignore
      const response: ApiResponse<Schedule[]> = await zat(SCHEDULER.getByDates, null, VERBS.GET, {
        startDate,
        endDate
      });

      if (response.success && response.data) {
        updateState({ data: response.data, loading: false });
        return true;
      } else {
        handleError(response.errorMessage || 'Failed to fetch schedules by dates.');
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while fetching schedules by dates.');
      return false;
    }
  }, [handleError, updateState]);

  // Save new schedule
  const handleSave = useCallback(async (body: Partial<Schedule>): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      const response: ApiResponse<Schedule> = await zat(SCHEDULER.createOne, body, VERBS.POST);

      if (response.success && response.data) {
        setState(prevState => ({
          ...prevState,
          data: [response.data!, ...prevState.data],
          loading: false,
          success: true
        }));
        return true;
      } else {
        handleError(response.errorMessage || 'Failed to save the schedule.');
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while saving the schedule.');
      return false;
    }
  }, [handleError]);

  // Clear success/error states
  const clearMessages = useCallback(() => {
    updateState({ error: null, success: false });
  }, [updateState]);

  // Initialize users on mount
  useEffect(() => {
    if (flag) {
      handleFetchUsers({ pageIndex: 1, pageSize: 100 });
    }
  }, [flag, handleFetchUsers]);

  return {
    // State
    ...state,
    
    // Actions
    handleChange,
    handleReset,
    handleFetchUsers,
    handleSelection,
    handleEdit,
    handleDelete,
    handleEditStatus,
    handleFetchByUser,
    handleFetch,
    handleFetchByDates,
    handleSave,
    clearMessages
  };
};

export { useScheduler };
export type { Schedule, User, Resource, SchedulerState, FetchUsersParams, FetchByDatesParams };