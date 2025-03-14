/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { TEAM, USER } from '../utils/apiUrl';
import { teamValidator } from '../app/protected/integrator/rules';
import { customStyles } from '../utils/helpers';

const useTeam = (id: string) => {
  const [state, setState] = useState({
    data: [],
    teamData: [],
    userData: [],
    loading: false,
    fields: teamValidator.fields,
    error: null,
    success: false,
    rules: teamValidator.rules
  });

  const handleReset = () => {
    setState((pre) => {
      return { ...pre, fields: teamValidator.fields };
    });
  };

  const handleChange = (name: string, value: string) => {
    setState((prevState) => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: value
      }
    }));
  };

  const handleError = (error: string) => {
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleFetch = async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, success, errorMessage } = await zat(TEAM.fetch, null, VERBS.GET, { id: id });

    if (success) {
      setState((pre) => {
        return { ...pre, data: data, loading: false };
      });
      return true;
    } else {
      handleError(errorMessage);
    }
  };

  const handleDelete = async (team_id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { success, errorMessage } = await zat(TEAM.removeOne, null, VERBS.DELETE, {
      id: team_id,
      projectId: id
    });

    if (success) {
      setState((pre) => ({
        ...pre,
        data: pre.data.filter((team) => team._id !== team_id),
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to delete the user.');
      return false;
    }
  };

  const handleSelect = (user_id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const match = state.data.find((team) => team.id.id === user_id);

    if (!match)
      handleAdd({
        user_id: user_id,
        projectId: id
      }).then((result) => {});
  };

  const handleAdd = async (body: any) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, success, errorMessage } = await zat(TEAM.addOne, body, VERBS.POST);
    const user = state.userData.find((user) => user._id === data?.id);

    const newTeam = {
      id :{
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        secure_url: user.secure_url,
        id: data.id
      },
      _id: data._id,
    };

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: [newTeam, ...prevState.data],
        loading: false
      }));

      return true;
    } else {
      handleError(errorMessage);
    }
  };

  const handleFetchUsers = useCallback(async ({ pageIndex = 1, pageSize = 10 }) => {
    try {
      const { data, success, errorMessage } = await zat(USER.fetch, null, VERBS.GET, {
        action: 'users',
        page: pageIndex,
        limit: pageSize
      });

      if (success) {
        setState((pre) => ({
          ...pre,
          userData: data,
          teamData: data.map((item) => ({
            label: `${item.first_name} ${item.last_name}`,
            value: item._id
          })),
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

  useEffect(() => {
    id && handleFetch(id);
  }, [id]);

  return {
    ...state,
    handleChange,
    handleFetch,
    handleDelete,
    handleReset,
    handleSelect,
    handleAdd,
    handleFetchUsers,
    customStyles
  };
};

export { useTeam };
