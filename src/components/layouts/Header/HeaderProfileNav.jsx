import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Nav, NavItem } from 'react-bootstrap';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPowerOff, faUser } from '@fortawesome/free-solid-svg-icons';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChatContextProvider, useChatContext } from '@/hooks/ChatContext';
import { useAppContext } from '@/Store/AppContext';

const ItemWithIcon = (props) => {
  const { icon, children } = props;

  return (
    <>
      <FontAwesomeIcon className="me-2" icon={icon} fixedWidth />
      {children}
    </>
  );
};

function Render() {
  const { signOutChatRoom } = useChatContext();
  const { showOffCanvas } = useAppContext();
  const router = useRouter();
  const handleSignOut = async () => {
    signOut({ redirect: false });
    signOutChatRoom();
    router.push('/');
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
          <DropdownItem onClick={() => showOffCanvas(true)}>
            <ItemWithIcon icon={faUser}>Manage Your Profile</ItemWithIcon>
          </DropdownItem>
          <DropdownItem onClick={handleSignOut}>
            <ItemWithIcon icon={faPowerOff}>logout</ItemWithIcon>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </Nav>
  );
}

const HeaderProfileNav = () => {
  return (
    <ChatContextProvider>
      <Render />
    </ChatContextProvider>
  );
};

export default HeaderProfileNav;
