import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const ChatContext = createContext();

export const ChatContextProvider = ({ children }) => {
  const [state, setState] = useState({
    currentChatUser: null,
    chatRoomId: null,
    chatRoom: null
  });

  useEffect(() => {
    if (!auth) {
      console.error('Firebase Auth is not initialized.');
      return;
    }

    const storedUser = window.localStorage.getItem('chatUser');
    if (storedUser && storedUser !== 'undefined') {
      setState((prevState) => ({
        ...prevState,
        currentChatUser: JSON.parse(storedUser)
      }));
    }

    const unsubscribeAuthListener = onAuthStateChanged(auth, (user) => {
      if (user) {
        setState((prevState) => ({
          ...prevState,
          currentChatUser: user
        }));
        window.localStorage.setItem('chatUser', JSON.stringify(user));
      } else {
        setState((prevState) => ({
          ...prevState,
          currentChatUser: null
        }));
        window.localStorage.removeItem('chatUser');
      }
    });

    return () => unsubscribeAuthListener();
  }, []);

  const changeChatRoom = (chatRoom) => {
    setState((prevState) => {
      return {
        ...prevState,
        chatRoomId: chatRoom.id,
        chatRoom: chatRoom
      };
    });
  };

  return (
    <ChatContext.Provider
      value={{
        ...state,
        changeChatRoom
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  return useContext(ChatContext);
};
