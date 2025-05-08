import { Container } from 'react-bootstrap';
import HeaderSidebarToggler from './HeaderSidebarToggler';
import HeaderProfileNav from './HeaderProfileNav';
import HeaderSearch from './HeaderSearch';
import { useRouter } from 'next/navigation';

export default function Header({ showSearch = true }) {
  const router = useRouter();
  const handleSearch = (searchTerm) => {
    if (searchTerm) {
      router.push(`/protected/integrator/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="admin__header sticky-top mb-4 pt-4 px-sm-2 border-bottom">
      <Container fluid className="header-navbar px-0">
        <div className="row">
          <div className="col-md-3 col-lg-3 d-flex align-items-center justify-content-start">
            <HeaderSidebarToggler />
          </div>
          {showSearch ? (
            <div className="col-md-6 col-lg-6">
              <HeaderSearch onSearch={(searchTerm) => handleSearch(searchTerm)} />
            </div>
          ) : (
            <div className="col-md-6 col-lg-6"> </div>
          )}

          <div className="col-md-3 col-lg-3 d-flex align-items-center justify-content-end">
            <HeaderProfileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
