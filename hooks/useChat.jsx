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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const useUserChat = () => {
  const [state, setState] = useState({
    user: null,
    loading: false,
    error: null
  });

  const handleError = (error) => {
    setState((pre) => {
      return { ...pre, error: error, loading: false };
    });
  };

  const handleReset = () => {
    setState((pre) => {
      return { ...pre, user: null, error: null };
    });
  };

  const handleSignUp = async (name, email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name,
        email
      });

      setState((pre) => {
        return { ...pre, user: user, loading: false };
      });

      return true;
    } catch (error) {
      handleError(error.message);
    }
  };

  const handleChatSignIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setState((pre) => {
        return { ...pre, user: userCredential.user, loading: false };
      });
      return true;
    } catch (error) {
      handleError(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setState((pre) => {
        return { ...pre, user: null, loading: false };
      });
      return true;
    } catch (error) {
      handleError(error.message);
    }
  };

  return {
    ...state,
    handleChatSignIn,
    handleSignOut,
    handleSignUp,
    handleReset
  };
};

const useChatRoom = (user_id) => {
  const [state, setState] = useState({
    chats: [],
    user: null,
    loading: false,
    error: null,
    search_terms: '',
    roomName: ''
  });

  const handleError = (error) => {
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

  const handleSearch = async (term) => {
    try {
      const chatRoomsRef = collection(db, 'chats');
      const chatRoomsQuery = query(chatRoomsRef, orderBy('name'));
      const querySnapshot = await getDocs(chatRoomsQuery);

      const chatRooms = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((doc) => doc.name.toLowerCase().includes(term.toLowerCase()));

      setState((pre) => {
        return { ...pre, chats: chatRooms, error: null };
      });

      return unsubscribe;
    } catch (error) {
      handleError(error.message);
    }
  };

  const handleNewRoom = async (userIds, chatName) => {
    try {
      await addDoc(collection(db, 'chats'), {
        name: chatName,
        users: userIds,
        lastMessage: '',
        lastUpdated: Timestamp.now()
      });

      setState((pre) => {
        return { ...pre, roomName: '', loading: false };
      });
    } catch (error) {
      handleError(error.message);
    }
  };


  const handleAddMember = async (chatRoomId, newUserEmail) => {
    let newUserId;
    const newUserPassword = '123456!';
    try {
      // Step 1: Attempt to Sign In
      const userCredential = await signInWithEmailAndPassword(auth, newUserEmail, newUserPassword);
      newUserId = userCredential.user.uid;
      console.log("User signed in successfully:", newUserId);
    } catch (error) {
      console.warn("Sign-in failed, trying to create an account...");
  
      try {
        // Step 2: If sign-in fails, create a new account
        const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword);
        newUserId = userCredential.user.uid;
  
        // Step 3: Store new user details in Firestore
        await setDoc(doc(db, "users", newUserId), {
          email: newUserEmail,
          createdAt: Timestamp.now(),
          roomId: chatRoomId, // Assign room immediately
        });
  
        console.log("New user signed up and added to Firestore:", newUserId);
      } catch (signUpError) {
        console.error("Account creation failed:", signUpError.message);
        return; // Stop execution if account creation fails
      }
    }
  
    // Step 4: Add user to the chat room
    try {
      const chatRoomRef = doc(db, "chats", chatRoomId);
      await updateDoc(chatRoomRef, {
        users: arrayUnion(newUserId),
        lastUpdated: Timestamp.now(),
      });
  
      console.log(`User ${newUserId} added to chat room ${chatRoomId}`);
    } catch (chatRoomError) {
      console.error("Error adding user to chat room:", chatRoomError.message);
    }
  };


  const handleRemoveMember = async (chatRoomId, userIdToRemove) => {
    try {
      const chatRoomRef = doc(db, 'chats', chatRoomId);

      const chatRoomSnapshot = await getDoc(chatRoomRef);
      if (!chatRoomSnapshot.exists()) {
        throw new Error('Chat room not found!');
      }

      const currentMembers = chatRoomSnapshot.data().users;
      const updatedMembers = currentMembers.filter((userId) => userId !== userIdToRemove);

      await updateDoc(chatRoomRef, {
        users: updatedMembers,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      handleError(error.message);
    }
  };

  const handleDeleteChat = async (chatRoomId) => {
    try {
      const chatRoomRef = doc(db, 'chats', chatRoomId);
      await deleteDoc(chatRoomRef);
    } catch (error) {
      handleError(error.message);
    }
  };

  const handleFetchChatRooms = (userId) => {
    try {
      const chatRoomsRef = collection(db, 'chats');
      const chatRoomsQuery = query(
        chatRoomsRef,
        where('users', 'array-contains', userId || 0)
        // orderBy('lastUpdated', 'desc')
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
  };

  const handleFetchChatRoomsByName = (roomName) => {
    try {
      const chatRoomsRef = collection(db, 'chats');
      const chatRoomsQuery = query(chatRoomsRef, where('name', '==', roomName));

      const unsubscribe = onSnapshot(chatRoomsQuery, (snapshot) => {
        const chatRooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setState((pre) => {
          return { ...pre, chats: chatRooms, error: null };
        });
      });

      return unsubscribe;
    } catch (error) {
      handleError(error.message);
    }
  };

  useEffect(() => {
    handleFetchChatRooms(user_id);
  }, [user_id]);

  return {
    ...state,
    handleReset,
    handleAddMember,
    handleDeleteChat,
    handleNewRoom,
    handleRemoveMember,
    handleError,
    handleSearch,
    handleFetchChatRooms,
    handleSearchChange,
    handleNewRoomChange,
    handleFetchChatRoomsByName
  };
};

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

  const handleMarkMessagesAsRead = async (chatRoomId, userId) => {
    try {
      const messagesRef = collection(db, 'chats', chatRoomId, 'messages');

      const querySnapshot = await getDocs(
        query(messagesRef, where('isRead', '==', false), where('senderId', '!=', userId))
      );

      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });

      await batch.commit();

      return true;
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
    handleMarkMessagesAsRead
  };
};

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

  const handleUploadImage = async (file) => {
    if (!file) return;
    const storage = getStorage();
    const storageRef = ref(storage, `chat_images/${file.name}-${Date.now()}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      handleError(error.message);
    }
  };

  const handleSend = async (chatRoomId, senderId, receiverId, text, image) => {
    let imageURL = null;
    try {
      imageURL = await handleUploadImage(image);
      const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
      const newMessage = {
        _id: new Date().getTime().toString(),
        senderId,
        receiverId,
        text: text || '',
        imageURL: imageURL || null,
        timestamp: serverTimestamp(),
        isRead: false,
        user: {
          _id: senderId
        },
      };

      await addDoc(messagesRef, newMessage);

      // const chatRef = doc(db, 'chats', chatRoomId);
      // const truncatedText = text.length > 50 ? text.slice(0, 50) : text;
      // await updateDoc(chatRef, {
      //   lastMessage: truncatedText,
      //   lastUpdated: serverTimestamp(),
      // });

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
export { useUserChat, useChatRoom, useChatMessage, useChatInput };
