'use client';

import React from 'react';
import { ChatContextProvider } from '../../../../hooks/ChatContext';
import RenderChat from './chat';

const Chat = () => {
  return (
    <ChatContextProvider>
      <RenderChat />
    </ChatContextProvider>
  );
};

export default Chat;
