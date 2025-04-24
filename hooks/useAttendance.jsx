import React, { useState, useEffect, useCallback } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { ATTENDANCE } from '../utils/apiUrl';

const useAttendance = ( searchQuery) => {
  const [state, setState] = useState({
    data: [],
    loading: false,
    error: null,
    success: false,
    totalCount: 0
  });

  const handleError = (error) => {
    setState((pre) => {
      return {
        ...pre,
        error: error,
        loading: false
      };
    });
  };

  const handleReset = () => {
    setState((pre) => {
      return {
        ...pre,
        success: false,
        loading: false,
        error: null
      };
    });
  };

  const handleFetch = useCallback(async ({ pageIndex = 1, pageSize = 10, sortBy = [], searchQuery = '' }) => {
    const sortField = sortBy.length > 0 ? sortBy[0].id : null;
    const sortOrder = sortBy.length > 0 ? (sortBy[0].desc ? 'desc' : 'asc') : 'null';

    try {
      const { data, success, errorMessage, totalCount } = await zat(ATTENDANCE.fetch, null, VERBS.GET, {
        action: 'paginate',
        page: pageIndex === 0 ? 1 : pageIndex,
        limit: pageSize,
        ...(sortField && { sortField }),
        ...(sortOrder && { sortOrder }),
        searchQuery
      });

      if (success) {
        setState((pre) => ({
          ...pre,
          data: data,
          totalCount: totalCount,
          loading: false
        }));
        return true;
      } else {
        handleError(errorMessage);
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while fetching attendances.');
      return false;
    }
  }, []);


  const handleDelete = async (id) => {
    const { success, errorMessage } = await zat(ATTENDANCE.removeOne, null, VERBS.DELETE, {
      id: id
    });

    if (success) {
      setState((pre) => ({
        ...pre,
        data: pre.data.filter((j) => j._id !== id),
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to delete the attendance.');
      return false;
    }
  };

  useEffect(() => {
    handleFetch({ searchQuery });
  }, [searchQuery, handleFetch]);

  return {
    ...state,
    handleDelete,
    handleReset,
    handleFetch
  };
};

export { useAttendance };
