'use client';

import SidebarProvider from '@/components/layouts/SidebarProvider';
import SidebarOverlay from '@/components/layouts/Sidebar/SidebarOverlay';
import Sidebar from '@/components/layouts/Sidebar/Sidebar';
import SidebarNav from '@/components/layouts/Sidebar/SidebarNav';
import Header from '@/components/layouts/Header/Header';
import Footer from '@/components/layouts/Footer/Footer';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import styles from './admin.module.css';

config.autoAddCss = false;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarOverlay />
      <Sidebar>
        <SidebarNav />
      </Sidebar>

      <div className={`wrapper d-flex flex-column min-vh-100 ${styles.shell}`}>
        <Header showSearch={false} showNotifications={false} />
        <main className={`body flex-grow-1 ${styles.main}`}>
          <div className={styles.content}>{children}</div>
        </main>
        <Footer />
      </div>
    </SidebarProvider>
  );
}
