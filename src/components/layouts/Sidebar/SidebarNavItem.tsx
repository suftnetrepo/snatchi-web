'use client'

import { IconDefinition } from '@fortawesome/free-solid-svg-icons'
import React, { PropsWithChildren } from 'react'
import { useSidebar } from '../SidebarProvider'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { usePathname } from 'next/navigation';

type Props = {
  href: string;
  icon?: IconDefinition;
} & PropsWithChildren

export default function SidebarNavItem(props: Props) {
  const { icon, children, href } = props;

  const {
    showSidebarState: [, setIsShowSidebar]
  } = useSidebar();

  const currentPath = usePathname(); 
const isActive = currentPath === href;

  return (
    <li className="nav-item">
      <Link 
        href={href}
        className={`px-3 py-2 d-flex align-items-center nav-link ${isActive ? 'active' : ''}`}
        onClick={() => setIsShowSidebar(false)}
      >
        {icon ? (
          <FontAwesomeIcon size="xl" className="nav-icon ms-n3" icon={icon} />
        ) : (
          <span className="nav-icon ms-n3" />
        )}
        {children}
      </Link>
    </li>
  );
}
