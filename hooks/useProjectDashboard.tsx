import React, { useState } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { PROJECT } from '../utils/apiUrl';

interface Initialize {
  data: [] | null | {};
  loading: boolean;
  error: null | string;
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

  return { ...state, handleAggregate, handleRecent, handleChartAggregate };
};

export { useProjectDashboard };
