import React, { useState, useCallback, useEffect } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { PROJECT, SCHEDULER } from '../utils/apiUrl';
import { schedulerValidator, schedulerSearchValidator } from '../app/protected/integrator/rules';
import { formatDateForInput, decodeHtmlToText } from '../utils/helpers';

interface Schedule {
  _id: string;
  integrator: string;
  engineer?: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  project: string;
  title: string;
  startDate: string | Date;
  endDate: string | Date;
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

const useScheduler = (engineerId: string) => {
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

  const handleSelection = useCallback((start: Date, end: Date, engineer: string, project: string) => {
    // Format dates to datetime-local format (YYYY-MM-DDTHH:mm:ss)
    const extractTimeFromDate = (date: Date): string => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    setState((prevState) => ({
      ...prevState,
      success: false,
      loading: false,
      fields: {
        ...prevState.fields,
        startDate: formatDateForInput(start),
        endDate: formatDateForInput(end),
        startTime: extractTimeFromDate(start),
        endTime: extractTimeFromDate(end),
        engineer,
        project
      }
    }));
  }, []);

    const handleViewEvent = useCallback((event: Schedule) => {
    // Format dates to datetime-local format (YYYY-MM-DDTHH:mm:ss)
    const extractTimeFromDate = (date: Date): string => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    setState((prevState) => ({
      ...prevState,
      success: false,
      loading: false,
      fields: {
        ...prevState.fields,
        ...event,
        startDate: formatDateForInput(new Date(event.startDate)),
        endDate: formatDateForInput(new Date(event.endDate)),
        startTime: extractTimeFromDate(new Date(event.startDate)),
        endTime: extractTimeFromDate(new Date(event.endDate)),
      }
    }));
  }, []);

  const buildScheduleDateTime = (dateValue: string, timeValue: string) => {
    const date = new Date(dateValue);
    const [hour, minute] = timeValue.split(':').map(Number);

    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);
  };

  const fetchUserSchedules = async (id: string) => {
    updateState({ loading: true, error: null });

    try {
      const params = new URLSearchParams({
        action: 'getByEngineer',
        id
      });

      const response: ApiResponse<Schedule[]> = await zat(SCHEDULER.getByEngineer, null, VERBS.GET, params);

      if (response.success) {
        const transformedData = (response.data || []).map((schedule) => {
          const startDateStr =
            schedule.startDate instanceof Date ? schedule.startDate.toISOString().split('T')[0] : schedule.startDate;

          const start = buildScheduleDateTime(startDateStr, schedule.startTime);

          const end = buildScheduleDateTime(startDateStr, schedule.endTime);

          return {
            ...schedule,
            id: schedule._id,
            title: schedule.title,
            start,
            end,
            startDate: start,
            endDate: end,
            engineerName: `${schedule.engineer?.first_name || ''} ${schedule.engineer?.last_name || ''}`.trim()
          };
        });

        updateState({
          data: transformedData,
          loading: false,
          success: true
        });
      } else {
        handleError(response.errorMessage || 'Failed to fetch schedules.');
      }
    } catch (error) {
      handleError('An unexpected error occurred while fetching schedules.');
    }
  };

  const fetchProjectSchedules = async (projectId: string) => {
    updateState({ loading: true, error: null });

    try {
      // @ts-ignore
      const response: ApiResponse<any[]> = await zat(SCHEDULER.getByEngineer, null, VERBS.GET, {
        action: 'getByProjectDateRange',
        projectId
      });

      if (response.success) {
        // Transform the data to match our Schedule structure
        const transformedData = (response.data || []).map((item: any) => ({
          _id: item.scheduleId,
          engineerId: item.engineerId,
          first_name: item.firstName,
          last_name: item.lastName,
          role: item.role,
          secure_url: item.avatar
        }));

        updateState({
          data: transformedData as any,
          loading: false,
          success: true
        });
        return transformedData;
      } else {
        handleError(response.errorMessage || 'Failed to fetch project schedules.');
        return [];
      }
    } catch (error) {
      handleError('An unexpected error occurred while fetching project schedules.');
      return [];
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
          // Transform string dates to Date objects for the calendar
          const transformedSchedule = {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate)
          };

          setState((prevState) => ({
            ...prevState,
            data: prevState.data.map((event) => (event._id === id ? transformedSchedule : event)),
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
            data: prevState.data.map((schedule) => {
              if (schedule._id === id) {
                // Transform string dates to Date objects if they exist
                return {
                  ...schedule,
                  ...body,
                  startDate: body.startDate ? new Date(body.startDate) : schedule.startDate,
                  endDate: body.endDate ? new Date(body.endDate) : schedule.endDate
                };
              }
              return schedule;
            }),
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
          // Transform string dates to Date objects for the calendar
          const transformedSchedule = {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate)
          };

          setState((prevState) => ({
            ...prevState,
            data: [transformedSchedule, ...prevState.data],
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

  async function handleProjectSelect(id: string) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, data, errorMessage } = await zat(PROJECT.fetchOne, null, VERBS.GET, {
      action: 'single',
      id: id
    });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        fields: {
          ...prevState.fields,
          title: data.name,
          description: decodeHtmlToText(data.description)
        },
        loading: false
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the project.');
    }
  }

  // Only fetch schedules on initial load with engineerId
  useEffect(() => {
    if (engineerId) {
      fetchUserSchedules(engineerId);
    }
  }, [engineerId]); // Only depend on engineerId, not fetchUserSchedules

  const clearMessages = useCallback(() => {
    updateState({ error: null, success: false });
  }, [updateState]);

  return {
    ...state,
    fetchUserSchedules,
    fetchProjectSchedules,
    handleChange,
    handleReset,
    handleEdit,
    handleDelete,
    handleEditStatus,
    handleSave,
    clearMessages,
    handleSelection,
    handleProjectSelect,
    handleViewEvent
  };
};

export { useScheduler };
