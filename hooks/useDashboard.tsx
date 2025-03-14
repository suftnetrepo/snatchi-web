import React, { useState } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { DASHBOARD } from '../utils/apiUrl';

interface Initialize {
  data: [] | null;
  loading: boolean;
  error: null | string;
}

const useDashboard = () => {
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
    });

    if (success) {
      setState((pre) => {
        const newItems = currentPage === 1 ? data : [...data, ...state.data];
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

  return { ...state, handleAggregate, handleRecent, handlePaginate, handleChartAggregate };
};

export { useDashboard };
