import {
  faBug,
  faCalculator,
  faChartPie,
  faCode,
  faDroplet,
  faGauge,
  faLayerGroup,
  faLocationArrow,
  faPencil,
  faPuzzlePiece,
  faRightToBracket,
  faAddressCard,
  faBell, faFileLines, faStar,
  faProjectDiagram,
  faCogs,
  faUser,
  faBuildingUser,
  faComment,
  faMoneyBillTrendUp,
  faMoneyCheck
} from '@fortawesome/free-solid-svg-icons'
import {  } from 'react-icons/ti';
import React from 'react'
import SidebarNavItem from './SidebarNavItem'


export default function SidebarNav() {
 
  return (
    <ul className="list-unstyled mt-4">
      <SidebarNavItem icon={faGauge} href="/protected/admin/dashboard">
        Dashboard
      </SidebarNavItem>
      <SidebarNavItem icon={faUser} href="/protected/admin/user">
        Users
      </SidebarNavItem>
      <SidebarNavItem icon={faBuildingUser} href="/protected/admin/integrator">
        Integrators
      </SidebarNavItem>
      <SidebarNavItem icon={faCogs} href="/protected/admin/settings">
        Settings
      </SidebarNavItem>
    </ul>
  );
}

const IntegratorSidebarNav=()=> {
  return (
    <ul className="list-unstyled mt-4">
      <SidebarNavItem icon={faGauge} href="/protected/integrator/dashboard">
        Dashboard
      </SidebarNavItem>
      <SidebarNavItem icon={faProjectDiagram} href="/protected/integrator/project">
        Projects
      </SidebarNavItem>
      <SidebarNavItem icon={faMoneyCheck} href="/protected/integrator/invoice">
        Invoices
      </SidebarNavItem>
      <SidebarNavItem icon={faBuildingUser} href="/protected/integrator/user">
        Users
      </SidebarNavItem>
      <SidebarNavItem icon={faComment} href="/protected/integrator/chat">
        Chat
      </SidebarNavItem>
      <SidebarNavItem icon={faCogs} href="/protected/integrator/settings">
        Settings
      </SidebarNavItem>
    </ul>
  );
}

export { IntegratorSidebarNav };
