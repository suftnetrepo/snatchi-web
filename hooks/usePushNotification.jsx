import React, { useState, useEffect } from 'react';
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '../firebase';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { PROJECT, PUSH_NOTIFICATION } from '../utils/apiUrl';
import { haversineDistance } from '../utils/helpers';

const usePushNotification = (id) => {
  const [state, setState] = useState({
    data: [],
    notifications: [],
    project: null,
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
        project: data,
        loading: false
      }));

      return data;
    } else {
      handleError(errorMessage || 'Failed to fetch the project.');
      return false;
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

  const handleFetchNotifications = async (projectId, project) => {
    try {
      const notificationRef = collection(db, 'notification_locations');
      const notificationQuery = query(
        notificationRef,
        where('projectId', '==', projectId) // Filter by projectId
      );

      const unsubscribe = onSnapshot(notificationQuery, async (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        const notificationsWithAddresses = await Promise.all(
          notifications.map(async (item) => {
            const {distance, formattedDistance } = haversineDistance(
              { latitude: item?.latitude, longitude: item?.longitude },
              { latitude:  project.location?.coordinates[0], longitude:   project.location?.coordinates[1] }
            );

            return {
              ...item,
              distance,
              formattedDistance,
              threshold: 50,
              result : distance > 1 ?  "Not on Site" : distance.toFixed(2) >= 20 && distance.toFixed(2) <= 50 ? "On Site" : "Not on Site"
            };
          })
        );

        setState((pre) => ({
          ...pre,
          notifications: notificationsWithAddresses,
          loading: false
        }));
      });

      return unsubscribe;
    } catch (error) {
      handleError(error.message);
    }
  };

  useEffect(() => {
    if (id) {
      handleSelect(id).then((result) => {
        handleFetchNotifications(id, result);
      });
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
