import type { Metadata } from 'next';
import Providers from './providers';

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
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://snatchi.com'),
  title: {
    default: 'Snatchi — AV Project, Engineer and Booking Management',
    template: '%s | Snatchi'
  },
  description: 'Plan AV projects, schedule engineers, share documents and manage team communication from one workspace.',
  applicationName: 'Snatchi',
  openGraph: {
    type: 'website',
    siteName: 'Snatchi',
    title: 'Snatchi — AV Project, Engineer and Booking Management',
    description: 'Run AV projects, engineers and bookings from one workspace.'
  },
  robots: { index: true, follow: true }
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
