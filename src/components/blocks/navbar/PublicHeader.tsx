import Link from 'next/link';
import Navbar from './Navbar';

const PublicHeader = () => (
  <header className="wrapper bg-light">
    <Navbar
      info
      navOtherClass="navbar-other ms-lg-4"
      navClassName="navbar navbar-expand-lg classic transparent navbar-light"
      button={
        <Link href="/login" className="btn btn-sm btn-primary public-header-sign-in rounded-pill">
          Sign In
        </Link>
      }
    />
  </header>
);

export default PublicHeader;
