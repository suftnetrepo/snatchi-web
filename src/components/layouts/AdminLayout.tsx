import React from 'react';
import SidebarProvider from '../layouts/SidebarProvider';
import SidebarOverlay from '../layouts/Sidebar/SidebarOverlay';
import Sidebar from '../layouts/Sidebar/Sidebar';
import SidebarNav from '../layouts/Sidebar/SidebarNav';
import Header from '../layouts/Header/Header';
import Footer from '../layouts/Footer/Footer';
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'

config.autoAddCss = false

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarOverlay />
      <Sidebar>
        <SidebarNav />
      </Sidebar>

      <div className="wrapper d-flex flex-column min-vh-100">
        <Header />

        <div className="body flex-grow-1 px-sm-2 mb-4">
          <div className='ms-0 me-0'>{children}</div>
        </div>

        <Footer />
      </div>

      <SidebarOverlay />
    </SidebarProvider>
  );
}
