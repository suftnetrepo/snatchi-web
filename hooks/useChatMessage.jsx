import React, { useState, useEffect } from 'react';
import {
  onSnapshot,
  query,
  orderBy,
  collection,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

const useChatMessage = (chatRoomId) => {
  const [state, setState] = useState({
    messages: [],
    loading: false,
    error: null
  });

  const handleError = (error) => {
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleFetchMessages = async (chatRoomId) => {
    try {
      const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setState((pre) => {
          return { ...pre, messages: messages, loading: false };
        });
      });

      return unsubscribe;
    } catch (error) {
      handleError(error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = handleFetchMessages(chatRoomId);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [chatRoomId]);

  return {
    ...state,
    handleFetchMessages,
  };
};

export { useChatMessage}