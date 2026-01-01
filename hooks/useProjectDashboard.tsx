import React, { useState } from 'react';
import moment from 'moment';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { PROJECT } from '../utils/apiUrl';

interface Initialize {
  data: [] | null | {};
  loading: boolean;
  error: null | string;
    recent?: any | null;
}

const useProjectDashboard = () => {
  const [state, setState] = useState<Initialize>({
    data: null,
    loading: false,
    error: null
  });

  const handleError = (error: string) => {
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleRecent = async () => {
    const { data, success, errorMessage } = await zat(PROJECT.recent, null, VERBS.GET);

    if (success) {
      setState((pre) => {
        return { ...pre, data: data, loading: false };
      });
      return { success, user: data };
    } else {
      handleError(errorMessage);
    }
  };

   async function handleSelect(id:string) {
      setState((prev) => ({ ...prev, loading: true }));
      const { success, data, errorMessage } = await zat(PROJECT.fetchOne, null, VERBS.GET, {
        action: 'single',
        id: id
      } as any);
  
      if (success) {
        setState((prevState) => ({
          ...prevState,
          recent: {
            ...prevState.recent,
            ...data,
            startDate: moment(data.startDate).format('YYYY-MM-DDTHH:mm'),
            endDate: moment(data.endDate).format('YYYY-MM-DDTHH:mm')
          },
          loading: false
        }));
      } else {
        handleError(errorMessage || 'Failed to fetch the project.');
      }
    }

  const handleAggregate = async () => {
    const { data, success, errorMessage } = await zat(PROJECT.aggregate, null, VERBS.GET);
  
    if (success) {
      setState((pre) => {
        return { ...pre, data: data, loading: false };
      });
      return { success, user: data };
    } else {
      handleError(errorMessage);
    }
  };

  const handleChartAggregate = async () => {
    const { data, success, errorMessage } = await zat(PROJECT.chart, null, VERBS.GET);

    if (success) {
      setState((pre) => {
        return { ...pre, data: data, loading: false };
      });
      return { success, user: data };
    } else {
      handleError(errorMessage);
    }
  };

  return { ...state, handleSelect, handleAggregate, handleRecent, handleChartAggregate };
};

export { useProjectDashboard };
