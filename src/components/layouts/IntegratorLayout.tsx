import React from 'react';
import SidebarProvider from './SidebarProvider';
import SidebarOverlay from './Sidebar/SidebarOverlay';
import Sidebar from './Sidebar/Sidebar';
import {IntegratorSidebarNav} from './Sidebar/SidebarNav';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'

config.autoAddCss = false

export default function IntegratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarOverlay />
      <Sidebar>
        <IntegratorSidebarNav />
      </Sidebar>

      <div className="wrapper d-flex flex-column min-vh-100">
        <Header />

        <div className="body flex-grow-1 px-sm-2 mb-4">
          <div className="ms-0 me-0">{children}</div>
        </div>

        <Footer />
      </div>

      <SidebarOverlay />
    </SidebarProvider>
  );
}
