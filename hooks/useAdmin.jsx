import React, { useState, useEffect, useCallback } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { INTEGRATOR, USER } from '../utils/apiUrl';

const useAdmin = (searchQuery) => {
  const [state, setState] = useState({
    data: [],
    viewData: {},
    userData: [],
    loading: false,
    error: null,
    totalCount: 0
  });

  const handleUpdateUser = (id, data) => {
    setState((prevState) => ({
      ...prevState,
      userData: prevState.userData.map((user) => (user._id === id ? data : user))
    }));
  };

  const handleSelect = (data) => {
    setState((pre) => {
      return { ...pre, viewData: data };
    });
  };

  const handleError = (error) => {
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleReset = () => {
    setState((pre) => {
      return { ...pre, editData: null, error: null };
    });
  };

  const handleFetchIntegrators = useCallback(
    async ({ pageIndex = 1, pageSize = 10, sortBy = [], searchQuery = '' }) => {
      const sortField = sortBy.length > 0 ? sortBy[0].id : null;
      const sortOrder = sortBy.length > 0 ? (sortBy[0].desc ? 'desc' : 'asc') : null;

      try {
        const { data, success, errorMessage, totalCount } = await zat(INTEGRATOR.fetchIntegrators, null, VERBS.GET, {
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
        handleError('An unexpected error occurred while fetching integrators.');
        return false;
      }
    },
    []
  );

  const handleFetchUserById = useCallback(async (integratorId) => {
    const { data, success, errorMessage } = await zat(USER.getById, null, VERBS.GET, {
      action: 'integrator_user',
      integratorId
    });

    if (success) {
      setState((pre) => {
        return { ...pre, userData: data, loading: false };
      });
      return true;
    } else {
      handleError(errorMessage);
    }
  }, []); 

  useEffect(() => {
    handleFetchIntegrators({ searchQuery });
  }, [searchQuery, handleFetchIntegrators]);

  return {
    ...state,
    handleUpdateUser,   
    handleFetchIntegrators,
    handleReset,
    handleSelect,
    handleFetchUserById
  };
};

export { useAdmin };
