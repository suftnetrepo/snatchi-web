/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { INTEGRATOR, USER } from '../utils/apiUrl';
import { integratorValidator } from '../app/protected/integrator/rules';

const useSettings = () => {
  const [state, setState] = useState({
    data: [],
    loading: false,
    fields: integratorValidator.fields,
    error: null,
    success: false,
    rules: integratorValidator.rules
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

  const handleFetchIntegrator = async () => {
    const { data, success, errorMessage } = await zat(INTEGRATOR.fetchSingle, null, VERBS.GET);

    if (success) {
      setState((prevState) => ({
        ...prevState,
        fields: {
          ...prevState.fields,
          ...data.data          
        },
        loading: false
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the project.');
    }
  };

  const handleSave = async (body)=> {
    setState((prev) => ({ ...prev, loading: true, success : false }));
    const { success, errorMessage } = await zat(INTEGRATOR.uploadOne, body, VERBS.POST);

    if (success) {
      setState((prevState) => ({
        ...prevState,
        success: true,
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to update the project.');
      return false;
    }
  }

  const handleSaveChangePassword = async (body) => {
    setState((prev) => ({ ...prev, loading: true, success: false, error : null }));
    const { success, errorMessage } = await zat(USER.changePassword, body, VERBS.PUT, { action:'change_password' });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        success: true,
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to update the project.');
      return false;
    }
  }

  useEffect(() => {
     handleFetchIntegrator();
  }, []);

  return {
    ...state,  
    handleFetchIntegrator,  
    handleReset,
    handleSelect,
    handleChange,
    handleSave,
    handleSaveChangePassword
  };
};

export { useSettings };
