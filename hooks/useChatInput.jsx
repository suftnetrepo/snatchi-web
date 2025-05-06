import React, { useState } from 'react';
import { collection, addDoc, Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { truncate } from '../utils/helpers';

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
    console.log(".......................error", error)
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleReset = () => {
    setState((pre) => {
      return { ...pre, loading: false, text: '', img: null, error: null };
    });
  };

  const handleSend = async (chatRoomId, senderId, text) => {
    const timestamp = Timestamp.now();
    try {
      const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
      const roomRef = doc(db, 'chats', chatRoomId);
      const roomSnap = await getDoc(roomRef);

      const roomData = roomSnap.data();
      const usersInRoom = roomData.users || [];

      const newMessage = {
        _id: new Date().getTime().toString(),
        senderId,
        text: text || '',
        imageURL: null,
        timestamp: timestamp,
        isRead: false,
        user: {
          _id: senderId
        }
      };

      await addDoc(messagesRef, newMessage);

      const unreadCountUpdates = {};
      usersInRoom.forEach((userId) => {
        if (userId !== senderId) {
          const currentCount = roomData.unreadCount?.[userId] || 0;
          unreadCountUpdates[`unreadCount.${userId}`] = currentCount + 1;
        }
      });

      await updateDoc(roomRef, {
        lastMessage: truncate(text),
        lastMessageTimestamp: timestamp,
        lastMessageSentBy: senderId,
        ...unreadCountUpdates
      });

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

export { useChatInput };
