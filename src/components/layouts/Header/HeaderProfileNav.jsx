import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  NavItem
} from 'react-bootstrap';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons';
import HeaderLogout from './HeaderLogout';
import { signOut } from 'next-auth/react';

const ItemWithIcon = (props) => {
  const { icon, children } = props;

  return (
    <>
      <FontAwesomeIcon className="me-2" icon={icon} fixedWidth />
      {children}
    </>
  );
};

export default function HeaderProfileNav() {
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <Nav>
      <Dropdown as={NavItem}>
        <DropdownToggle
          variant="link"
          bsPrefix="hide-caret"
          className="py-0 px-2 rounded-0 shadow-none"
          id="dropdown-profile"
        >
          <div className="avatar position-relative">
            <Image sizes="32px" layout="fill" className="rounded-circle" src="/img/avatars/u1.jpg" alt="" />
          </div>
        </DropdownToggle>
        <DropdownMenu className="pt-4">
                  
          <HeaderLogout>
            <DropdownItem
              onClick={handleSignOut}
            >
              <ItemWithIcon icon={faPowerOff}>logout</ItemWithIcon>
            </DropdownItem>
          </HeaderLogout>
        </DropdownMenu>
      </Dropdown>
    </Nav>
  );
}
