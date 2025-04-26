'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import ThemeProvider from '@/theme/ThemeProvider';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import 'react-big-calendar/lib/css/react-big-calendar.css';
// Bootstrap and custom scss
import '@/assets/scss/style.scss';
// animate css
import 'animate.css';
// import swiper css
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
// video player css
import 'plyr-react/plyr.css';
// glightbox css
import 'glightbox/dist/css/glightbox.css';
// custom scrollcue css
import '@/plugins/scrollcue/scrollCue.css';
import { AppProvider } from '../Store/AppContext';
import { SessionProvider } from 'next-auth/react';

function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      require('bootstrap');
    }
  }, []);

  useEffect(() => {
    (async () => {
      const scrollCue = (await import('@/plugins/scrollcue')).default;
      scrollCue.init({ interval: -400, duration: 700, percentage: 0.8 });
      scrollCue.update();
    })();
  }, [pathname]);

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      </head>
      <body>
        <SessionProvider>
          <ThemeProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <AppProvider>{children}</AppProvider>
            </LocalizationProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

export default RootLayout;
