import React, { useState, useEffect, useCallback } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { INVOICE } from '../utils/apiUrl';

const useInvoice = ( searchQuery) => {
  const [state, setState] = useState({
    data: [],
    loading: false,
    error: null,
    success: false,
    totalCount: 0
  });

  const handleEditItem = (invoice) => {
    setState((prevState) => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        ...invoice,
        issueDate: new Date(invoice.issueDate)
      }
    }));
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
      const { data, success, errorMessage, totalCount } = await zat(INVOICE.fetchInvoices, null, VERBS.GET, {
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
      handleError('An unexpected error occurred while fetching projects.');
      return false;
    }
  }, []);

  async function handleEditInvoice(body, invoice_id) {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { success, errorMessage } = await zat(INVOICE.updateOne, body, VERBS.PUT, { id: invoice_id });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        loading: false,
        data: prevState.data
          ? prevState.data.map((invoice) =>
              invoice._id === invoice_id ? { ...invoice, status: body.status } : invoice
            )
          : [], // Ensure `data` is always an array
        success: true,
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to update the invoice.');
      return false;
    }
  }

  const handleDelete = async (invoice_id) => {
    const { success, errorMessage } = await zat(INVOICE.removeOne, null, VERBS.DELETE, {
      id: invoice_id
    });

    if (success) {
      setState((pre) => ({
        ...pre,
        data: pre.data.filter((invoice) => invoice._id !== invoice_id),
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to delete the invoice.');
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
    handleChange,
    handleEditInvoice,
    handleEditItem,
    handleFetch
  };
};

export { useInvoice };
