import React, { useState, useEffect, useCallback } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { TASK } from '../utils/apiUrl';
import moment from "moment";
import { taskValidator } from './../app/protected/integrator/rules';

const useTask = (searchQuery, projectId) => {
  const [state, setState] = useState({
    data: [],
    calenderData: [],
    editData: {},
    loading: false,
    error: null,
    totalCount: 0,
    deleteSuccess : false
  });

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

  const handleDelete = async (id) => {
    const { success, errorMessage } = await zat(TASK.removeOne, null, VERBS.DELETE, { id: id, projectId: projectId });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: prevState.data.filter((task) => task._id !== id),
        calenderData: prevState.data.filter((task) => task._id !== id).map((task) => ({
          id: task._id,
          title: task.name,
          start: new Date(task.startDate),
          end: new Date(task.endDate),
          description: task.description,
          status: task.status,
          priority: task.priority,
        })),
        totalCount: prevState.totalCount - 1,
        loading: false,
        deleteSuccess : true
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to delete the task.');
      return false;
    }
  };

  const handleFetch = useCallback(async ({ pageIndex = 1, pageSize = 10, sortBy = [], searchQuery = '' }) => {
    const sortField = sortBy.length > 0 ? sortBy[0].id : null;
    const sortOrder = sortBy.length > 0 ? (sortBy[0].desc ? 'desc' : 'asc') : 'null';

    try {
      const { data, success, errorMessage, totalCount } = await zat(TASK.fetch, null, VERBS.GET, {
        projectId: projectId,
        action: 'paginate',
        page: pageIndex === 0 ? 1 : pageIndex,
        limit: pageSize,
        ...(sortField && { sortField }),
        ...(sortOrder && { sortOrder }),
        searchQuery
      });

      console.log(data)

      if (success) {
        setState((pre) => ({
          ...pre,
          data: data,
          calenderData: data.map((task) => ({
            id: task._id, 
            title: task.name, 
            start: new Date(task.startDate),
            end: new Date(task.endDate),
            description: task.description, 
            status: task.status,
            priority: task.priority,
          })),
          totalCount: totalCount,
          loading: false
        }));
        return true;
      } else {
        handleError(errorMessage);
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while fetching tasks.');
      return false;
    }
  }, [projectId]);

  useEffect(() => {
    handleFetch({ searchQuery });
  }, [searchQuery, handleFetch]);

  return {
    ...state,
    handleFetch,
    handleDelete,
    handleReset
  };
};

const useTaskEdit = (taskId, projectId) => {
  const [state, setState] = useState({
    data: {},
    fields: taskValidator.fields,
    loading: false,
    error: null,
    taskError : null,
    success: false
  });

  const handleChange = (name, value) => {
    setState((prevState) => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: value
      }
    }));
  };

  const handleError = (error) => {
    setState((prevState) => ({
      ...prevState,
      error: error,
      taskError : error,
      loading: false
    }));
  };

  const handleReset = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    setState({
      data: null,
      fields: {
        ...taskValidator.fields,
        startDate: new Date(),
        endDate: endDate
      },
      error: null,
      loading: false,
      success: false
    });
  };

  async function handleSelect(id) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, data, errorMessage } = await zat(TASK.fetchOne, null, VERBS.GET, {
      action: 'single',
      id: id,
      projectId: projectId
    });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        fields: {
          ...prevState.fields,
          ...data,        
          startDate: moment(data.startDate).format("YYYY-MM-DDTHH:mm"),
          endDate: moment(data.endDate).format("YYYY-MM-DDTHH:mm")
        },
        loading: false
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the task.');
    }
  }

  async function handleSave(body) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, errorMessage } = await zat(TASK.createOne, body, VERBS.POST);

    if (success) {
      setState((prevState) => ({
        ...prevState,
        success: true,
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to update the task.');
      return false;
    }
  }

  async function handleEdit(body, id) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, errorMessage } = await zat(TASK.updateOne, body, VERBS.PUT, { id: id, action: 'multiple' });

    if (success) {
      setState((prev) => ({ ...prev, success: true, loading: false }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to update the task.');
      return false;
    }
  }

  useEffect(() => {
    if (taskId) {
      handleSelect(taskId);
    }
  }, [taskId]);

  return {
    ...state,
    handleSelect,
    handleReset,
    handleEdit,
    handleChange,
    handleSave
  };
};

export { useTask, useTaskEdit };
