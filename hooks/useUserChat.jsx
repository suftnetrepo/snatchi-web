import React, { useState } from 'react';
import {
  arrayUnion,
  doc,
  getDoc,
  query,
  updateDoc,
  collection,
  setDoc,
  getDocs,
  Timestamp,
  where
} from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';

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

  const createUserProfile = async (userId, email) => {
    const timestamp = Timestamp.now();
    const userProfile = {
      email,
      displayName: '',
      photoURL: '',
      createdAt: timestamp,
      invitedBy: '',
      passwordNeedsReset: false,
      rooms: [],
      lastSeen: timestamp,
      status: 'offline'
    };

    await setDoc(doc(db, 'users', userId), userProfile);
  };

  const handleSignUp = async (email, password) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error('A user with this email already exists');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await createUserProfile(userCredential.user.uid, email);

      setState((pre) => {
        return { ...pre, user: user, loading: false };
      });

      return true;
    } catch (error) {
      handleError(error.message);
      return false;
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

  const findDirectChat = async (userId1, userId2) => {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('type', '==', 'direct'), where('users', 'array-contains', userId1));

      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const chatData = doc.data();
        if (chatData.users.includes(userId2) && chatData.users.length === 2) {
          return { id: doc.id, ...chatData };
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding direct chat:', error);
      return null;
    }
  };

  const handleCreateDirectChat = async (currentUserId, email,  chatName, type = 'direct') => {
    try {

      const newUserId = await getExistingUserId(email)
      const chatExist = await findDirectChat(currentUserId, newUserId)

      if(chatExist) {
        console.error('Error direct chat already existed');
        return true
      }

      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
      const otherUserDoc = await getDoc(doc(db, 'users', newUserId));

      const currentUserData = currentUserDoc.data();
      const otherUserData = otherUserDoc.data();

      const chatRef = doc(collection(db, 'chats'));
      const timestamp = Timestamp.now();

      const chatData = {
        name: chatName,
        type,
        users: [currentUserId, newUserId],
        userDetails: {
          [currentUserId]: {
            displayName: currentUserData.displayName || currentUserData.email,
            photoURL: currentUserData.photoURL || null
          },
          [newUserId]: {
            displayName: otherUserData.displayName || otherUserData.email,
            photoURL: otherUserData.photoURL || null
          }
        },
        createdAt: timestamp,
        lastUpdated: timestamp,
        userReadTimestamps: {
          [currentUserId]: timestamp,
          [newUserId]: null
        }
      };

      await setDoc(chatRef, chatData);

      console.log('Direct chat created:', chatRef.id);
      return chatRef.id;
    } catch (error) {
      console.error('Error creating direct chat:', error);
      handleError(error.message);
    }
  };

  const handleCreateGroupChat = async (creatorUserId, groupName, initialMemberIds = []) => {
    try {
      const allMemberIds = [creatorUserId, ...initialMemberIds.filter((id) => id !== creatorUserId)];

      const memberDetails = {};
      for (const memberId of allMemberIds) {
        const memberDoc = await getDoc(doc(db, 'users', memberId));
        if (memberDoc.exists()) {
          const userData = memberDoc.data();
          memberDetails[memberId] = {
            displayName: userData.displayName || userData.email,
            photoURL: userData.photoURL || null
          };
        }
      }

      const chatRef = doc(collection(db, 'chats'));
      const timestamp = Timestamp.now();

      const chatData = {
        type: 'group',
        name: groupName,
        createdBy: creatorUserId,
        users: allMemberIds,
        userDetails: memberDetails,
        createdAt: timestamp,
        lastUpdated: timestamp,
        userReadTimestamps: Object.fromEntries(allMemberIds.map((id) => [id, id === creatorUserId ? timestamp : null])),
        admins: [creatorUserId]
      };

      await setDoc(chatRef, chatData);

      const batch = writeBatch(db);
      allMemberIds.forEach((memberId) => {
        const userRef = doc(db, 'users', memberId);
        batch.update(userRef, {
          rooms: arrayUnion(chatRef.id)
        });
      });

      await batch.commit();
      console.log('Group chat created:', chatRef.id);
      return { id: chatRef.id, ...chatData };
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  };

  const createNewUserAccount = async (email, invitedByUserId) => {
    try {
      const tempPassword = '12345!';
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      const newUserId = userCredential.user.uid;

      await createUserProfile(newUserId, email);
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
        let newUserId;
        newUserId = createNewUserAccount(email, "")
        return newUserId
      }

      return querySnapshot.docs[0].id;
    } catch (error) {
      console.error('Error getting existing user ID:', error.message);
      throw error;
    }
  };

  const addMemberToGroupChat = async (chatRoomId, email, addedByUserId) => {
    try {
      const chatDoc = await getDoc(doc(db, 'chats', chatRoomId));
      const chatData = chatDoc.data();
      if (chatData.type !== 'group') {
        throw new Error('Cannot add members to direct chats');
      }

      let newUserId;

      newUserId = await getExistingUserId(email);
      if(!newUserId) {
        newUserId = await createNewUserAccount(email, addedByUserId);
      }

      if (chatData.users.includes(newUserId)) {
        console.log('User is already a member of this chat');
        return newUserId;
      }

      const newUserDoc = await getDoc(doc(db, 'users', newUserId));
      const newUserData = newUserDoc.data();
      const userDetail = {
        displayName: newUserData.displayName || email,
        photoURL: newUserData.photoURL || null
      };

      const timestamp = Timestamp.now();
      await updateDoc(doc(db, 'chats', chatRoomId), {
        users: arrayUnion(newUserId),
        [`userDetails.${newUserId}`]: userDetail,
        [`userReadTimestamps.${newUserId}`]: null,
        lastUpdated: timestamp,
        updatedBy: addedByUserId
      });

      // await addSystemMessage(
      //   chatRoomId,
      //   `${newUserData.displayName || newUserEmail} was added to the group by ${chatData.userDetails[addedByUserId].displayName}`
      // );

      return newUserId;
    } catch (error) {
      console.log('.................', error);
      handleError(error.message);
    }
  };

  const removeMemberFromGroupChat = async (chatRoomId, memberIdToRemove, removedByUserId) => {
    try {
      // Check if this is a group chat
      const chatDoc = await getDoc(doc(db, 'chats', chatRoomId));
      if (!chatDoc.exists()) {
        throw new Error('Chat room not found');
      }

      const chatData = chatDoc.data();
      if (chatData.type !== 'group') {
        throw new Error('Cannot remove members from direct chats');
      }

      // Check permissions (self-removal or admin removal)
      const isSelfRemoval = memberIdToRemove === removedByUserId;
      const isAdmin = chatData.admins.includes(removedByUserId);

      if (!isSelfRemoval && !isAdmin) {
        throw new Error('Only admins can remove other members');
      }

      // Create a new users array without the removed member
      const updatedUsers = chatData.users.filter((id) => id !== memberIdToRemove);

      // Create updated objects for other fields
      const timestamp = Timestamp.now();

      // Update chat document
      const chatRef = doc(db, 'chats', chatRoomId);
      const batch = writeBatch(db);

      // Update chat data
      batch.update(chatRef, {
        users: updatedUsers,
        lastUpdated: timestamp
      });

      // Remove user from admins if applicable
      if (chatData.admins.includes(memberIdToRemove)) {
        batch.update(chatRef, {
          admins: arrayRemove(memberIdToRemove)
        });
      }

      // Remove chat from user's rooms list
      const userRef = doc(db, 'users', memberIdToRemove);
      batch.update(userRef, {
        rooms: arrayRemove(chatRoomId)
      });

      await batch.commit();

      // Add system message
      const memberName = chatData.userDetails[memberIdToRemove]?.displayName || 'A user';
      const removerName = isSelfRemoval
        ? 'themselves'
        : chatData.userDetails[removedByUserId]?.displayName || 'An admin';

      await addSystemMessage(chatRoomId, `${memberName} was removed from the group by ${removerName}`);

      return true;
    } catch (error) {
      console.error('Error removing member from group chat:', error);
      throw error;
    }
  };

  const addSystemMessage = async (chatRoomId, text) => {
    try {
      const messageRef = doc(collection(db, 'messages'));
      const timestamp = Timestamp.now();

      await setDoc(messageRef, {
        chatId: chatRoomId,
        text: text,
        type: 'system',
        sentAt: timestamp,
        readBy: []
      });

      await updateDoc(doc(db, 'chats', chatRoomId), {
        lastUpdated: timestamp,
        lastMessageTimestamp: timestamp,
        lastMessagePreview: text.substring(0, 100)
      });
    } catch (error) {
      console.error('Error adding system message:', error);
    }
  };

  return {
    ...state,
    addSystemMessage,
    handleChatSignIn,
    handleSignOut,
    handleSignUp,
    handleReset,
    handleCreateDirectChat,
    handleCreateGroupChat,
    addMemberToGroupChat,
    removeMemberFromGroupChat
  };
};

export { useUserChat };
