'use client';

import { Suspense } from 'react';
import Search from './search';
import { ChatContextProvider } from '@/hooks/ChatContext';

export default function Page() {
  return (
    <ChatContextProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <Search />
      </Suspense>
    </ChatContextProvider>
  );
}
