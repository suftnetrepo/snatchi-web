/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { USER_DOCUMENTS } from '../utils/apiUrl';
import { fileValidator } from '../app/protected/integrator/rules';

const useUserDocument = (userId) => {
  const [state, setState] = useState({
    data: [],
    loading: false,
    fields: fileValidator.fields,
    error: null,
    success: false,
    rules: fileValidator.rules
  });

  const handleReset = () => {
    setState((pre) => {
      return { ...pre, fields: fileValidator.fields };
    });
  };

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
    setState((pre) => {
      return { ...pre, error, loading: false };
    });
  };

  const handleUpload = async (body) => {
    setState((prev) => ({ ...prev, loading: true, error : null }));
    const { data, success, errorMessage } = await zat(USER_DOCUMENTS.uploadOne, body, VERBS.POST);

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: [data, ...prevState.data],
        loading: false
      }));

      return true;
    } else {
      handleError(errorMessage);
    }
  };

  const handleFetch = async (userId) => {
     setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, success, errorMessage } = await zat(USER_DOCUMENTS.fetch, null, VERBS.GET, {
      userId: userId,
    });

    if (success) {
      setState((pre) => {
        return { ...pre, data: data, loading: false };
      });
      return true;
    } else {
      handleError(errorMessage);
    }
  };

  const handleDelete = async (document_id) => {
     setState((prev) => ({ ...prev, loading: true, error: null }));
    const { success, errorMessage } = await zat(USER_DOCUMENTS.removeOne, null, VERBS.DELETE, {
      id: document_id,
    });

    if (success) {
      setState((pre) => ({
        ...pre,
        data: pre.data.filter((document) => document._id !== document_id),
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to delete the document.');
      return false;
    }
  };

  useEffect(() => {
    userId && handleFetch();
  }, [userId, handleFetch]);

  return { ...state, handleUpload, handleChange, handleFetch, handleDelete, handleReset };
};

export { useUserDocument };
