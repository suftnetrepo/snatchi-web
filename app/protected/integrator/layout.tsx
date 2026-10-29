'use client';

import { Suspense } from 'react';
import SidebarProvider from '../../../src/components/layouts/SidebarProvider';
import SidebarOverlay from '../../../src/components/layouts/Sidebar/SidebarOverlay';
import Sidebar from '../../../src/components/layouts/Sidebar/Sidebar';
import { IntegratorSidebarNav } from '../../../src/components/layouts/Sidebar/SidebarNav';
import Header from '../../../src/components/layouts/Header/Header';
import Footer from '../../../src/components/layouts/Footer/Footer';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import ContextualHelp from './help/ContextualHelp';
import { usePathname } from 'next/navigation';
import SubscriptionEntitlementGuard, { BILLING_RECOVERY_PATH } from '../../../src/components/billing/SubscriptionEntitlementGuard';

config.autoAddCss = false;

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === BILLING_RECOVERY_PATH) {
    return <SubscriptionEntitlementGuard>{children}</SubscriptionEntitlementGuard>;
  }

  return (
    <SubscriptionEntitlementGuard>
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
          <Suspense fallback={null}><ContextualHelp /></Suspense>
          <Footer />
        </div>
        <SidebarOverlay />
      </SidebarProvider>
    </SubscriptionEntitlementGuard>
  );
}
