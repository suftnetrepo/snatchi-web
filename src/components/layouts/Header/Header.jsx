import { Container } from 'react-bootstrap'
import HeaderSidebarToggler from './HeaderSidebarToggler'
import HeaderProfileNav from './HeaderProfileNav'

export default function Header() {
  return (
    <header className="admin__header sticky-top mb-4 pt-4 px-sm-2 border-bottom">
      <Container fluid className="header-navbar d-flex align-items-center justify-content-between px-0">
        <HeaderSidebarToggler />

        <div className="header-nav ms-2">
          <HeaderProfileNav />
        </div>
      </Container>
    </header>
  );
}
