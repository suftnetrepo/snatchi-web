import React, { useState, useEffect, useCallback } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { USER } from '../utils/apiUrl';

const useUser = (searchQuery) => {
  const [state, setState] = useState({
    data: [],
    editData: {},
    aggregateData: [],
    searchResults :[],
    loading: false,
    searchTerm : '',
    error: null,
    totalCount: 0
  });

  const handleChange = (value) => {
    setState((prevState) => ({
      ...prevState,
      searchTerm: value,
    }));
  };

  const handleEdit = (data) => {
    setState((pre) => {
      return { ...pre, editData: data };
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

  const handleSearchUser = async (searchTerm) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, success, errorMessage } = await zat(USER.search, null, VERBS.GET, { action: "search_user", searchQuery: searchTerm  });
  
    if (success) {
      setState((pre) => {
        return { ...pre, searchResults: data, loading: false };
      });
      return true;
    } else {
      handleError(errorMessage);
    }
  };

  const handleFetchUser = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, success, errorMessage } = await zat(USER.fetch, null, VERBS.GET);

    if (success) {
      setState((pre) => {
        return { ...pre, data: data, loading: false };
      });
      return true;
    } else {
      handleError(errorMessage);
    }
  };

  const handleDeleteUser = async (id) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { success, errorMessage } = await zat(USER.removeOne, null, VERBS.DELETE, { id: id });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: prevState.data.filter((user) => user._id !== id),
        totalCount: prevState.totalCount - 1,
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to delete the user.');
      return false;
    }
  };
 
  async function handleSaveUser(body) {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { success, errorMessage, data } = await zat(USER.createOne, body, VERBS.POST);

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: [data, ...prevState.data],
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to update the user.');
      return false;
    }
  }

  const handleFetchUsers = useCallback(async ({ pageIndex = 1, pageSize = 10, sortBy = [], searchQuery = '' }) => {
    const sortField = sortBy.length > 0 ? sortBy[0].id : null;
    const sortOrder = sortBy.length > 0 ? (sortBy[0].desc ? 'desc' : 'asc') : null;

    try {
      const { data, success, errorMessage, totalCount } = await zat(USER.fetch, null, VERBS.GET, {
        action : "users", 
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
      handleError('An unexpected error occurred while fetching users.');
      return false;
    }
  }, []);

  async function handleEditUser(body, id) {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { success, errorMessage, data } = await zat(USER.updateOne, body, VERBS.PUT, { id: id, action: 'update_user' });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: prevState.data.map((user) => (user._id === id ? data : user)),
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to update the user.');
      return false;
    }
  }

  async function handleAggregate() {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { success, errorMessage, data } = await zat(USER.aggregate, null, VERBS.GET);

    if (success) {
      setState((prevState) => ({
        ...prevState,
        aggregateData: data,
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to update the user.');
      return false;
    }
  }

  useEffect(() => {
    handleFetchUsers({ searchQuery });
  }, [searchQuery, handleFetchUsers]);

  return {
    ...state,
    handleFetchUser,
    handleFetchUsers,
    handleDeleteUser,
    handleEdit,
    handleEditUser,
    handleSaveUser,
    handleReset,
    handleAggregate,
    handleSearchUser,
    handleChange
  };
};

export { useUser };
