/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { DOCUMENT } from '../utils/apiUrl';
import { fileValidator } from '../app/protected/integrator/rules';

interface DocumentRecord {
  _id: string;
  [key: string]: unknown;
}

interface DocumentState {
  data: DocumentRecord[];
  loading: boolean;
  fields: typeof fileValidator.fields;
  error: string | null;
  success: boolean;
  rules: typeof fileValidator.rules;
}

const useDocument = (id?: string) => {
  const [state, setState] = useState<DocumentState>({
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

  const handleUpload = async (body: any) => {
    setState((prev) => ({ ...prev, loading: true, error : null }));
    const { data, success, errorMessage } = await zat(DOCUMENT.uploadOne, body, VERBS.POST);

    if (success) {
        setState((prevState) => ({
         ...prevState,
         data: [data, ...prevState.data],
         loading: false
       }));

      return true;
    } else {
      handleError(errorMessage || 'Failed to upload the document.');
    }
  };

  const handleFetch = async (id : string) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, success, errorMessage } = await zat(DOCUMENT.fetch, null, VERBS.GET, { id: id });

    if (success) {
      setState((pre) => {
        return { ...pre, data: data, loading: false };
      });
      return true;
    } else {
      handleError(errorMessage || 'Failed to fetch documents.');
    }
  };

   const handleDelete = async (document_id: string) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
     const { success, errorMessage } = await zat(DOCUMENT.removeOne, null, VERBS.DELETE, {
       id: document_id,
       projectId: id
     });

     if (success) {
       setState((pre) => ({
         ...pre,
         data: pre.data.filter((document) => document._id !== document_id),
         loading: false
       }));
       return true;
     } else {
       handleError(errorMessage || 'Failed to delete the user.');
       return false;
     }
   };

  useEffect(()=> {
    id && handleFetch(id)
  },[id])

  return { ...state, handleUpload, handleChange, handleFetch, handleDelete, handleReset };
};

export { useDocument };
