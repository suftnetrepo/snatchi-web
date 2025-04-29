'use client';

import React from 'react';
import SidebarProvider from '../../../src/components/layouts/SidebarProvider';
import SidebarOverlay from '../../../src/components/layouts/Sidebar/SidebarOverlay';
import Sidebar from '../../../src/components/layouts/Sidebar/Sidebar';
import { IntegratorSidebarNav } from '../../../src/components/layouts/Sidebar/SidebarNav';
import Header from '../../../src/components/layouts/Header/Header';
import Footer from '../../../src/components/layouts/Footer/Footer';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

config.autoAddCss = false;

export default function Layout({ children }: { children: React.ReactNode }) {
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
