'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ThemeProvider from '@/theme/ThemeProvider';
import { AppProvider } from '../Store/AppContext';
import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    require('bootstrap');
  }, []);

  useEffect(() => {
    (async () => {
      const scrollCue = (await import('@/plugins/scrollcue')).default;
      scrollCue.init({ interval: -400, duration: 700, percentage: 0.8 });
      scrollCue.update();
    })();
  }, [pathname]);

  return (
    <SessionProvider>
      <ThemeProvider>
        <AppProvider>{children}</AppProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
