import Link from 'next/link'
import { Nav, NavItem, NavLink } from 'react-bootstrap'

export default function HeaderFeaturedNav() {

  return (
    <Nav>
      <NavItem>
        <Link href="/" passHref legacyBehavior>
          <NavLink className="p-2">dashboard</NavLink>
        </Link>
      </NavItem>
      <NavItem>
        <Link href="#" passHref legacyBehavior>
          <NavLink className="p-2">users</NavLink>
        </Link>
      </NavItem>
      <NavItem>
        <Link href="#" passHref legacyBehavior>
          <NavLink className="p-2">settings</NavLink>
        </Link>
      </NavItem>
    </Nav>
  )
}
