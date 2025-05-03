

import React, { useState } from 'react';
import {
  collection,
} from 'firebase/firestore';
import { db } from '../firebase';

const useChatInput = () => {
  const [state, setState] = useState({
    text: '',
    img: null,
    loading: false,
    error: null
  });

  const handleChange = (name, value) => {
    setState((pre) => ({
      ...pre,
      [name]: value
    }));
  };

  const handleError = (error) => {
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleReset = () => {
    setState((pre) => {
      return { ...pre, loading: false, text: '', img: null, error: null };
    });
  };

  const handleSend = async (chatRoomId, senderId, receiverId, text) => {
    console.log({ chatRoomId, senderId, receiverId, text });

    try {
      const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
      const newMessage = {
        _id: new Date().getTime().toString(),
        senderId,
        receiverId: receiverId || '',
        text: text || '',
        imageURL: null,
        timestamp: serverTimestamp(),
        isRead: false,
        user: {
          _id: senderId
        }
      };

      await addDoc(messagesRef, newMessage);
      return true;
    } catch (error) {
      handleError(error.message);
    }
  };

  return {
    ...state,
    handleSend,
    handleReset,
    handleChange
  };
};

export { useChatInput}