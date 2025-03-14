import React, { useState, useEffect } from 'react';
import { onSnapshot, query, orderBy, collection, where } from 'firebase/firestore';
import { db } from '../firebase';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { PROJECT, PUSH_NOTIFICATION } from '../utils/apiUrl';
import { reverseGeocode } from '../utils/helpers';

const usePushNotification = (id) => {
  const [state, setState] = useState({
    data: [],
    notifications: [],
    loading: false,
    error: null,
    success: false
  });

  const handleError = (error) => {
    setState((prevState) => ({
      ...prevState,
      error: error,
      loading: false
    }));
  };

  const handleReset = () => {
    setState((prevState) => ({
      ...prevState,
      error: null,
      loading: false
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
        data: data?.assignedTo,
        loading: false
      }));
    } else {
      handleError(errorMessage || 'Failed to fetch the project.');
    }
  }

  async function handleSinglPushNotification(body) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, errorMessage } = await zat(PUSH_NOTIFICATION.notify, body, VERBS.PUT, { action: 'single' });

    if (success) {
      setState((prev) => ({ ...prev, loading: false }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to update the project.');
      return false;
    }
  }

  async function handleMultiplePushNotification(body) {
    setState((prev) => ({ ...prev, loading: true }));
    const { success, errorMessage } = await zat(PUSH_NOTIFICATION.notify, body, VERBS.PUT, { action: 'multiple' });

    if (success) {
      setState((prev) => ({ ...prev, loading: false }));
      return true;
    } else {
      handleError(errorMessage || 'Failed to update the project.');
      return false;
    }
  }

  const handleFetchNotifications = async (projectId) => {
    try {
      const notificationRef = collection(db, 'notification_locations');
      const notificationQuery = query(
        notificationRef,
        where('projectId', '==', projectId) // Filter by projectId
      );
  
      const unsubscribe = onSnapshot(notificationQuery, async (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // Wait for all reverseGeocode calls to finish
        const notificationsWithAddresses = await Promise.all(
          notifications.map(async (item) => {
            const address = await reverseGeocode(item?.latitude, item?.longitude);
            return {
              ...item,
              completeAddress: address || "",
            };
          })
        );
  
        // Update state with resolved addresses
        setState((pre) => ({
          ...pre,
          notifications: notificationsWithAddresses,
          loading: false,
        }));
      });
  
      return unsubscribe;
    } catch (error) {
      handleError(error.message);
    }
  };
  

  useEffect(() => {
    if (id) {
      handleSelect(id);
      handleFetchNotifications(id);
    }
  }, [id]);

  return {
    ...state,
    handleSelect,
    handleReset,
    handleSinglPushNotification,
    handleMultiplePushNotification,
    handleFetchNotifications
  };
};

export { usePushNotification };
