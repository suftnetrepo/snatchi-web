/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import {
  arrayUnion,
  doc,
  onSnapshot,
  deleteDoc,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  collection,
  setDoc,
  addDoc,
  getDocs,
  Timestamp,
  where
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';

const useChatRoom = (userId) => {
  const [state, setState] = useState({
    chats: [],
    user: null,
    loading: false,
    error: null,
    search_terms: '',
    roomName: ''
  });

  const handleError = (error) => {
    console.log("..............................error", error)
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleReset = () => {
    setState((pre) => {
      return { ...pre, chats: [], error: null };
    });
  };

  const handleNewRoomChange = (value) => {
    setState((pre) => ({
      ...pre,
      roomName: value
    }));
  };

  const handleSearchChange = (name, value) => {
    setState((pre) => ({
      ...pre,
      [name]: value
    }));
  };

  const getUserRooms = async (userId) => {
    try {
      const chatRoomsRef = collection(db, 'chats');
      const chatRoomsQuery = query(
        chatRoomsRef,
        where('users', 'array-contains', userId || 0)
      );

      const unsubscribe = onSnapshot(chatRoomsQuery, (snapshot) => {
        const chatRooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setState((prev) => ({
          ...prev,
          chats: chatRooms,
          error: null
        }));
      });

      return unsubscribe;
    } catch (error) {
      handleError(error.message);
    }
  }

  const getUserRoomsSortedByActivity = async (userId) => {
    const rooms = await getUserRooms(userId);

    // Sort by lastUpdated timestamp, most recent first
    return rooms.sort((a, b) => {
      return b.lastUpdated?.toMillis() - a.lastUpdated?.toMillis();
    });
  };

  const getUserRoomsWithUnreadMessages = async (userId) => {
    const rooms = await getUserRooms(userId);

    // Filter rooms where the last message timestamp is after the user's last read timestamp
    return rooms.filter((room) => {
      const userLastRead = room.userReadTimestamps?.[userId] || 0;
      const lastMessageTimestamp = room.lastMessageTimestamp?.toMillis() || 0;
      return lastMessageTimestamp > userLastRead;
    });
  };

  const listenToUserRooms = (userId, callback) => {
    // First get the user document to access their room IDs
    const userDocRef = doc(db, 'users', userId);

    // Listen for changes to the user document
    const unsubscribeFromUser = onSnapshot(userDocRef, async (userDoc) => {
      if (!userDoc.exists()) {
        callback([]);
        return;
      }

      const userData = userDoc.data();
      const roomIds = userData.rooms || [];

      if (roomIds.length === 0) {
        callback([]);
        return;
      }

      // Set up listeners for each room
      const roomListeners = roomIds.map((roomId) => {
        return onSnapshot(doc(db, 'chats', roomId), (roomDoc) => {
          // When any room updates, get all rooms again
          // This isn't the most efficient approach but ensures the callback always has all current data
          getUserRooms(userId).then((allRooms) => callback(allRooms));
        });
      });

      // Store unsubscribe functions to clean up later if needed
      return () => {
        unsubscribeFromUser();
        roomListeners.forEach((unsubscribe) => unsubscribe());
      };
    });

    // Return unsubscribe function
    return unsubscribeFromUser;
  };

  const handleNewRoom = async (userId, chatName, type) => {
    const timestamp = Timestamp.now();
    try {
      await addDoc(collection(db, 'chats'), {
        type,
        name: chatName,
        userDetails: {
          [userId]: {
            displayName: '',
            photoURL: ''
          }
        },
        users: userId,
        lastMessage: '',
        lastUpdated: timestamp,
        createdAt: timestamp,
        lastUpdated: timestamp,
        lastMessageTimestamp: timestamp,
        lastMessagePreview: '',
        lastMessageSentBy: '',
        userReadTimestamps: {
          [userId]: timestamp
        },
        description: '',
        createdBy: userId,
        admins: [],
        image: '',
        unreadCount: {
          [userId]: 0
        },
        isEncrypted: false
      });

      setState((pre) => {
        return { ...pre, roomName: '', loading: false };
      });
    } catch (error) {
      handleError(error.message);
    }
  };

  const handleAddParticipant = async (chatRoomId, newUserEmail, invitedByUserId) => {
    const TEMP_PASSWORD = '12345!';

    try {
      let newUserId = await createNewUserAccount(newUserEmail, TEMP_PASSWORD, invitedByUserId);
      await addUserToChatRoom(newUserId, chatRoomId);

      console.log(`Successfully added user ${newUserId} to chat room ${chatRoomId}`);
      return newUserId;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        try {
          const existingUserId = await getExistingUserId(newUserEmail);
          await addUserToChatRoom(existingUserId, chatRoomId);
          return existingUserId;
        } catch (existingUserError) {
          console.error('Failed to add existing user:', existingUserError.message);
          throw new Error(`Could not add existing user: ${existingUserError.message}`);
        }
      } else {
        console.error('Failed to add member:', error.message);
        throw new Error(`Could not add member: ${error.message}`);
      }
    }
  };

  const createNewUserAccount = async (email, tempPassword, invitedByUserId) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      const newUserId = userCredential.user.uid;

      await setDoc(doc(db, 'users', newUserId), {
        email,
        createdAt: Timestamp.now(),
        invitedBy: invitedByUserId,
        passwordNeedsReset: false,
        rooms: []
      });

      return newUserId;
    } catch (error) {
      console.error('Error creating new user account:', error.message);
      throw error;
    }
  };

  const getExistingUserId = async (email) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('User exists in Auth but not in Firestore database');
      }

      return querySnapshot.docs[0].id;
    } catch (error) {
      console.error('Error getting existing user ID:', error.message);
      throw error;
    }
  };

  const handleUserChatsByType = async (userId) => {
    try {
      const rooms = await getUserRooms(userId);

      const direct = [];
      const groups = [];
      const integrator = [];

      rooms.forEach((room) => {
        if (room.type === 'direct') {
          const otherUserId = room.users.find((id) => id !== userId);
          const otherUserDetails = room.userDetails?.[otherUserId] || { displayName: 'Unknown User' };

          direct.push({
            ...room,
            displayName: otherUserDetails.displayName,
            photoURL: otherUserDetails.photoURL
          });
        } else if (room.type === 'group') {
          groups.push(room);
        } else if (room.type === 'integrator') {
          integrator.push({
            ...room,
            displayName: room.name || 'Integrator Chat'
          });
        }
      });

      const sortByLastUpdated = (a, b) => b.lastUpdated?.toMillis() - a.lastUpdated?.toMillis();

      return {
        direct: direct.sort(sortByLastUpdated),
        groups: groups.sort(sortByLastUpdated),
        integrator: integrator.sort(sortByLastUpdated)
      };
    } catch (error) {
      console.error('Error getting user chats by type:', error);
      return { direct: [], groups: [] };
    }
  };

  const handleSearchUsers = async (searchTerm, currentUserId, limit = 10) => {
    try {
      const chatRoomsRef = collection(db, 'chats');
      const chatRoomsQuery = query(chatRoomsRef, orderBy('name'));
      const querySnapshot = await getDocs(chatRoomsQuery);

      const chatRooms = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((doc) => doc.name.toLowerCase().includes(searchTerm.toLowerCase()));

      setState((pre) => {
        return { ...pre, chats: chatRooms, error: null };
      });

      return unsubscribe;
    } catch (error) {
      handleError(error.message);
    }
  };

  useEffect(() => {
    userId && getUserRooms(userId);
  }, [userId]);

  return {
    ...state,
    getUserRoomsSortedByActivity,
    getUserRoomsWithUnreadMessages,
    listenToUserRooms,
    getUserRooms,
    handleSearchUsers,
    handleReset,
    handleUserChatsByType,
    handleError,
    handleSearchChange,
    handleNewRoomChange,
    handleNewRoom,
    handleAddParticipant
  };
};

export { useChatRoom };
