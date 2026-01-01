import React, { useState } from 'react';
import moment from 'moment';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { DASHBOARD, PROJECT } from '../utils/apiUrl';

interface Initialize {
  data: any[] | null;
  loading: boolean;
  error: null | string;
  recent?: any | null;
}

const useDashboard = () => {
  const [state, setState] = useState<Initialize>({
    data: null,
    loading: false,
    error: null,
    recent: null
  });

  const handleError = (error: string) => {
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleRecent = async () => {
    const { data, success, errorMessage } = await zat(DASHBOARD.recent, null, VERBS.GET);

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
    const { data, success, errorMessage } = await zat(DASHBOARD.aggregate, null, VERBS.GET);

    if (success) {
      setState((pre) => {
        return { ...pre, data: data, loading: false };
      });
      return { success, user: data };
    } else {
      handleError(errorMessage);
    }
  };

  const handlePaginate = async (currentPage = 1) => {
    const { data, success, errorMessage } = await zat(DASHBOARD.paginate, null, VERBS.GET, {
      limit: 10,
      page: currentPage
    } as any);

    if (success) {
      setState((pre) => {
        const newItems = currentPage === 1 ? (data || []) : ([...(pre.data || []), ...(data || [])]);
        return { ...pre, data: newItems, loading: false };
      });
      return { success, user: data };
    } else {
      handleError(errorMessage);
    }
  };

  const handleChartAggregate = async () => {
    const { data, success, errorMessage } = await zat(DASHBOARD.chart, null, VERBS.GET);

    if (success) {
      setState(pre => {
        return { ...pre, data: data, loading: false };
      });
      return { success, user: data };
    } else {
      handleError(errorMessage);
    }
  };

  return { ...state, handleAggregate,handleSelect, handleRecent, handlePaginate, handleChartAggregate };
};

export { useDashboard };
