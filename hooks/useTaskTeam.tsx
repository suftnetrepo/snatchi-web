/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { PROJECT, TASK_TEAM } from '../utils/apiUrl';
import { teamValidator } from './../app/protected/integrator/rules';
import { customStyles } from '../utils/helpers';

const useTaskTeam = (projectId: string, taskId: string) => {
  const [state, setState] = useState({
    data: [],
    options: [],
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
    const { data, success, errorMessage } = await zat(TASK_TEAM.fetch, null, VERBS.GET, { projectId: id, taskId });

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
    const { success, errorMessage } = await zat(TASK_TEAM.removeOne, null, VERBS.DELETE, {
      id: team_id,
      projectId: projectId,
      taskId: taskId
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

    handleAdd({
      projectId: projectId,
      user_id:user_id,
      taskId: taskId
    }).then((result) => {});
     
  };

  const handleAdd = async (body: any) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, success, errorMessage } = await zat(TASK_TEAM.addOne, body, VERBS.POST);
    const user = state.userData.find((user) => user.id._id === data?.id);
    const match = state.data.find((team) => team.id.id === body.user_id);

    if(match) return

    const newTeam = {
      id :{
        first_name: user.id.first_name,
        last_name: user.id.last_name,
        role: user.id.role,
        secure_url: user.id.secure_url,
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

  async function handleFetchOptions(id) {
     setState((prev) => ({ ...prev, loading: true }));
     const { success, data, errorMessage } = await zat(PROJECT.fetchOne, null, VERBS.GET, {
       action: 'single',
       id: id
     });
 
     const assignedToOptions =
       data?.assignedTo.map((item) => {
         return {
           label: `${item.id.first_name} ${item.id.last_name}`,
           value: item.id._id
         };
       }) || [];
 
     if (success) {
       setState((prevState) => ({
         ...prevState,
         userData: data?.assignedTo,
         options: assignedToOptions,
         loading: false
       }));
     } else {
       handleError(errorMessage || 'Failed to fetch the project.');
     }
   }

  useEffect(() => {
    taskId && projectId && handleFetch(projectId);
  }, [projectId, taskId]);

  return {
    ...state,
    handleChange,
    handleFetch,
    handleDelete,
    handleReset,
    handleSelect,
    handleAdd,
    handleFetchOptions,
    customStyles
  };
};

export { useTaskTeam };
