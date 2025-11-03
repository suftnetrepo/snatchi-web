import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { PROJECT } from '../utils/apiUrl';
import { projectValidator } from '../app/protected/integrator/rules';
import { customStyles } from '../utils/helpers';

const useProject = (searchQuery) => {
  const [state, setState] = useState({
    data: [],
    copyData: [],
    options: [],
    loading: false,
    error: null,
    totalCount: 0,
    search_term:''
  });

  const handleError = (error) => {
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleReset = () => {
    setState((pre) => {
      return { ...pre, data: null, singleData: null, error: null };
    });
  };

  const handleDelete = async (id) => {
    const { success, errorMessage } = await zat(PROJECT.removeOne, null, VERBS.DELETE, { id: id });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: prevState.data.filter((project) => project._id !== id),
        totalCount: prevState.totalCount - 1,
        loading: false
      }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to delete the project.');
      return false;
    }
  };

  const handleSelectedAddress = (selectedAddress) => {
    setState((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        addressLine1:
          selectedAddress?.address.suburb || selectedAddress?.address.place || selectedAddress?.address.municipality,
        town: selectedAddress?.address.town || selectedAddress?.address.city,
        county: selectedAddress?.address.county || selectedAddress?.address.state,
        postcode:
          selectedAddress?.address.country_code === 'gb' || selectedAddress?.address.country_code === 'us'
            ? selectedAddress?.address.postcode
            : '',
        country: selectedAddress?.address.country,
        completeAddress: selectedAddress?.display_name,
        location: {
          type: 'Point',
          coordinates: [parseFloat(selectedAddress?.lat) || 0, parseFloat(selectedAddress?.lon) || 0]
        }
      }
    }));
  };

  const handleFetch = useCallback(async ({ pageIndex = 1, pageSize = 10, sortBy = [], searchQuery = '' }) => {
    const sortField = sortBy.length > 0 ? sortBy[0].id : null;
    const sortOrder = sortBy.length > 0 ? (sortBy[0].desc ? 'desc' : 'asc') : 'null';

    try {
      const { data, success, errorMessage, totalCount } = await zat(PROJECT.fetch, null, VERBS.GET, {
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

  async function handleFetchSingle(id) {
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
        options: assignedToOptions,
        loading: false
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the project.');
    }
  }

  async function handleFetchSingle(id) {
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
        options: assignedToOptions,
        loading: false
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the project.');
    }
  }

  async function handleFetchUserProjects(id) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, data, errorMessage } = await zat(PROJECT.fetchOne, null, VERBS.GET, {
      action: 'userProjects',
      id: id
    });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        data: data,
        copyData: data,
        loading: false
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the project.');
    }
  }

  async function handleFilterProjects(term) {
    setState((prevState) => ({
      ...prevState,
      data: term.length > 0 
        ? prevState.copyData.filter((j) => j.name.toLowerCase().includes(term.toLowerCase())) 
        : prevState.copyData,
      loading: false,
      search_term : term
    }));
  }

  useEffect(() => {
    handleFetch({ searchQuery });
  }, [searchQuery, handleFetch]);

  return {
    handleFilterProjects,
    ...state,
    handleFetch,
    handleDelete,
    handleReset,
    handleSelectedAddress,
    handleFetchSingle,
    customStyles,
    handleFetchUserProjects
  };
};

const useProjectEdit = (id) => {
  const [state, setState] = useState({
    data: {},
    fields: projectValidator.fields,
    loading: false,
    error: null,
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
      loading: false
    }));
  };

  const handleReset = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    setState({
      data: null,
      fields: {
        ...projectValidator.fields,
        startDate: moment(new Date()).format('YYYY-MM-DDTHH:mm'),
        endDate: moment(endDate).format('YYYY-MM-DDTHH:mm')
      },
      error: null,
      loading: false,
      success: false
    });
  };

  const handleSelectedAddress = (selectedAddress) => {
    setState((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        addressLine1:
          selectedAddress?.address.suburb || selectedAddress?.address.place || selectedAddress?.address.municipality,
        town: selectedAddress?.address.town || selectedAddress?.address.city,
        county: selectedAddress?.address.county || selectedAddress?.address.state,
        postcode:
          selectedAddress?.address.country_code === 'gb' || selectedAddress?.address.country_code === 'us'
            ? selectedAddress?.address.postcode
            : '',
        country: selectedAddress?.address.country,
        completeAddress: selectedAddress?.display_name,
        location: {
          type: 'Point',
          coordinates: [parseFloat(selectedAddress?.lat) || 0, parseFloat(selectedAddress?.lon) || 0]
        }
      }
    }));
  };

  async function handleSelect(id) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, data, errorMessage } = await zat(PROJECT.fetchOne, null, VERBS.GET, {
      action: 'single',
      id: id
    });

    if (success) {
      setState((prevState) => ({
        ...prevState,
        fields: {
          ...prevState.fields,
          ...data,
          startDate: moment(data.startDate).format('YYYY-MM-DDTHH:mm'),
          endDate: moment(data.endDate).format('YYYY-MM-DDTHH:mm')
        },
        loading: false
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the project.');
    }
  }

  async function handleSave(body) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, errorMessage } = await zat(PROJECT.createOne, body, VERBS.POST);

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

  async function handleEdit(body, id) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, errorMessage } = await zat(PROJECT.updateOne, body, VERBS.PUT, { id: id });

    if (success) {
      setState((prev) => ({ ...prev, loading: false }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to update the project.');
      return false;
    }
  }

  useEffect(() => {
    if (id) {
      handleSelect(id);
    }
  }, [id]);

  return {
    ...state,
    handleSelect,
    handleReset,
    handleEdit,
    handleChange,
    handleSave,
    handleSelectedAddress
  };
};

export { useProject, useProjectEdit };
