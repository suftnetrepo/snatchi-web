'use client';

import React from 'react';
import SidebarProvider from '../../../src/components/layouts/SidebarProvider';
import SidebarOverlay from '../../../src/components/layouts/Sidebar/SidebarOverlay';
import Sidebar from '../../../src/components/layouts/Sidebar/Sidebar';
import { GuestSidebarNav } from '../../../src/components/layouts/Sidebar/SidebarNav';
import Header from '../../../src/components/layouts/Header/Header';
import Footer from '../../../src/components/layouts/Footer/Footer';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import RenderUserUserOffcanvas from './user/renderUserOffcanvas'
import RenderTaskOffcanvas from './dashboard/renderTaskOffcanvas'
import { useAppContext } from '@/Store/AppContext';

config.autoAddCss = false;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { showUserOffCanvas, taskOffCanvas, currentTask } = useAppContext();

  return (
    <>
      <SidebarProvider>
        <SidebarOverlay />
        <Sidebar>
          <GuestSidebarNav />
        </Sidebar>
        <div className="wrapper d-flex flex-column min-vh-100">
          <Header showSearch={false} />
          <div className="body flex-grow-1 px-sm-2 mb-4">
            <div className="ms-0 me-0">{children}</div>
          </div>
          <Footer />
        </div>
        <SidebarOverlay />
      </SidebarProvider>
      { showUserOffCanvas && <RenderUserUserOffcanvas show={showUserOffCanvas} /> }
      { taskOffCanvas && <RenderTaskOffcanvas show={taskOffCanvas} task={currentTask} /> }
      
    </>
  );
}
