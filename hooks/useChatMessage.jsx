import React, { useState, useEffect, useRef } from 'react';
import { onSnapshot, query, orderBy, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const useChatMessage = (chatRoomId, userId) => {
  const activeChatIdRef = useRef(null);
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

  const markMessagesAsRead = async (chatRoomId, userId) => {
    const roomRef = doc(db, 'chats', chatRoomId);
    await updateDoc(roomRef, {
      [`unreadCount.${userId}`]: 0
    });
  };

  const handleFetchMessages = async (chatRoomId, userId) => {
    try {

      await markMessagesAsRead(chatRoomId,userId)
      activeChatIdRef.current = chatRoomId;

      const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        if (activeChatIdRef.current !== chatRoomId) return;

        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setState((pre) => ({
          ...pre,
          messages,
          loading: false
        }));
      });

      return unsubscribe;
    } catch (error) {
      handleError(error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = handleFetchMessages(chatRoomId, userId);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [chatRoomId, userId]);

  return {
    ...state,
    handleFetchMessages
  };
};

export { useChatMessage };
