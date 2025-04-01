'use client';

import { Suspense } from 'react';
import { ChatContextProvider } from '../../../../hooks/ChatContext';
import RenderChat from './chat';

const Chat = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContextProvider>
        <RenderChat />
      </ChatContextProvider>
    </Suspense>
  );
};

export default Chat;
