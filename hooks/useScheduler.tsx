import React, { useState, useEffect, useCallback } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { SCHEDULER, USER } from '../utils/apiUrl';
import { schedulerValidator } from '../app/protected/integrator/rules';

interface Calendar {
  id: string;
  text: string;
  start: string;
  end: string;
  resource: string;
  barColor: string;
  locked?: boolean;
}

interface Schedule {
  _id: string;
  integrator: string;
  user: User;
  title: string;
  startDate: string; 
  endDate: string; 
  status: string;
  description: string;
  createdAt: string; 
  updatedAt: string; 
  __v: number;
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface Resource {
  id: string;
  name: string;
}

interface SchedulerState {
  data: Schedule[];
  resources: Resource[];
  events: Calendar[];
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
    events: [],
    loading: false,
    fields: schedulerValidator.fields,
    error: null,
    success: false,
    rules: schedulerValidator.rules
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

  const handleSelection = useCallback((startDate: Date, endDate: Date, id: string) => {
    setState((prevState) => ({
      ...prevState,
      fields: {
        startDate: startDate.toISOString().slice(0, 16),
        endDate: endDate.toISOString().slice(0, 16),
        user: id,
        title: '',
        description: '',
        status: 'Pending'
      }
    }));
  }, []);

  const handleSelectedUpdate = useCallback((schedule: Partial<Schedule>) => {
    setState((prevState) => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        ...schedule,
        startDate: schedule?.startDate ? new Date(schedule.startDate).toISOString().slice(0, 16) + ':00' : '',
        endDate: schedule?.endDate ? new Date(schedule.endDate).toISOString().slice(0, 16) + ':00' : ''
      }
    }));
  }, []);

  const handleResizeUpdate = useCallback(async (schedule: Partial<Schedule>, id : string) => {
    await handleEdit(schedule,id);
  }, []);

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
            events: prevState.events.filter((schedule) => schedule.id !== id),
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
        const response: ApiResponse = await zat(SCHEDULER.updateOne, body, VERBS.PUT, {
          id,
          action: 'update'
        });

        if (response.success) {
          const updateSchedule = {
            ...response.data,
            id: response.data._id,
            text: response.data.title,
            start: response.data.startDate ? new Date(response.data.startDate).toISOString().slice(0, 16) + ':00' : '',
            end: response.data.endDate ? new Date(response.data.endDate).toISOString().slice(0, 16) + ':00' : '',
            resource: response.data.user._id,
            lock: response.data.status === 'Lock',
            barColor:
              response.data.status === 'Pending'
                ? '#ffbb99'
                : response.data.status === 'Accepted'
                  ? '#00cc99'
                  : '#ff66a3'
          };

          setState((prevState) => ({
            ...prevState,
            events: prevState.events.map((event) => (event.id === id ? updateSchedule : event)),
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

  const handleFetchUsers = useCallback(
    async ({
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
          const resources: Resource[] = response.data.map((item) => ({
            name: `${item.first_name} ${item.last_name}`,
            id: item._id
          }));

          updateState({
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
    },
    [handleError, updateState]
  );

  const handleFetch = useCallback(async (): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
      // @ts-ignore
      const response: ApiResponse<Schedule[]> = await zat(SCHEDULER.getAll, null, VERBS.GET, {
        action: 'getAll'
      });

      if (response.success && response.data) {
        const events = response.data.map((item) => ({
          ...item,
          id: item._id,
          text: item.status === 'Lock' ? '' : item.title,
          start: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) + ':00' : '',
          end: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) + ':00' : '',
          resource: item.user._id,
          barColor: item.status === 'Pending' ? '#ffbb99' : item.status === 'Accepted' ? '#009999' : '#ff66a3',
          lock: item.status === 'Lock',
        }));

        updateState({ events, loading: false });
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

  const handleFetchByDates = useCallback(
    async ({ startDate, endDate }: FetchByDatesParams): Promise<boolean> => {
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
    },
    [handleError, updateState]
  );

  const handleSave = useCallback(
    async (body: Partial<Schedule>): Promise<boolean> => {
      updateState({ loading: true, error: null });

      try {
        const response: ApiResponse<Schedule> = await zat(SCHEDULER.createOne, body, VERBS.POST);

        if (response.success && response.data) {
          const newSchedule = {
            ...response.data,
            id: response.data._id,
            text: response.data.title,
            start: response.data.startDate ? new Date(response.data.startDate).toISOString().slice(0, 16) + ':00' : '',
            end: response.data.endDate ? new Date(response.data.endDate).toISOString().slice(0, 16) + ':00' : '',
            resource: response.data.user._id,
            lock: response.data.status === 'Lock',
            barColor:
              response.data.status === 'Pending'
                ? '#ffbb99'
                : response.data.status === 'Accepted'
                  ? '#009999'
                  : '#ff66a3'
          };
        
          setState((prevState) => ({
            ...prevState,
            events: [newSchedule, ...prevState.events],
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
    },
    [handleError]
  );

  const clearMessages = useCallback(() => {
    updateState({ error: null, success: false });
  }, [updateState]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([handleFetchUsers({ pageIndex: 1, pageSize: 100 }), handleFetch()]);
    };

    load();
  }, [flag, handleFetchUsers, handleFetch]);

  return {
    ...state,

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
    clearMessages,
    handleSelectedUpdate,
    handleResizeUpdate
  };
};

export { useScheduler };
export type { Schedule, User, Resource, SchedulerState, FetchUsersParams, FetchByDatesParams };
