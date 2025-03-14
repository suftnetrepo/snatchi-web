'use client'; 

import { FC, Fragment, ReactElement, useRef } from 'react';
import useSticky from '@/hooks/useSticky';
import NextLink from '@/components/reuseable/links/NextLink';
import SocialLinks from '@/components/reuseable/SocialLinks';
import Social from './partials/Social';

type NavbarProps = {
  info?: boolean;
  fancy?: boolean;
  logoAlt?: string;
  social?: boolean;
  stickyBox?: boolean;
  navClassName?: string;
  button?: ReactElement;
  navOtherClass?: string;
};

const Navbar: FC<NavbarProps> = (props) => {
  const { navClassName, social, button, fancy, navOtherClass, stickyBox, logoAlt } = props;

  const sticky = useSticky(350);
  const navbarRef = useRef<HTMLElement | null>(null);
 
  const logo = sticky ? 'logo' : logoAlt ?? 'logo'; 
  const fixedClassName = 'navbar navbar-expand-lg center-nav transparent navbar-light navbar-clone fixed';

  const headerContent = (
    <Fragment>
      <div className="navbar-brand w-100">
        <NextLink
          href="/"
          title={<img alt="logo" src={`/img/logo.png`} srcSet={`/img/logo.png 2x`} className="img-fluid" />}
        />
      </div>

      <div id="offcanvas-nav" data-bs-scroll="true" className="navbar-collapse offcanvas offcanvas-nav offcanvas-start">
        <div className="offcanvas-header d-lg-none">
          <h3 className="text-white fs-30 mb-0">Snatchi</h3>
          <button type="button" aria-label="Close" data-bs-dismiss="offcanvas" className="btn-close btn-close-white" />
        </div>

        <div className="offcanvas-body ms-lg-auto d-flex flex-column h-100">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NextLink title="Home" className="nav-link" href="/" />
            </li>

            <li className="nav-item">
              <NextLink title="About us" className="nav-link" href="/about" />
            </li>

            <li className="nav-item">
              <NextLink title="Pricing" className="nav-link" href="/pricing" />
            </li>

            <li className="nav-item">
              <NextLink title="Features" className="nav-link" href="/features" />
            </li>

            <li className="nav-item">
              <NextLink title="Contact" className="nav-link" href="/contact" />
            </li>
          </ul>

          <div className="offcanvas-footer d-lg-none">
            <div>
              <NextLink title="info@snatchi.com" className="link-inverse" href="mailto:info@snatchi.com" />
              <br />
              <NextLink href="tel:+449404522280" title="+44 9404 522 280" />
              <br />
              <SocialLinks />
            </div>
          </div>
        </div>
      </div>

      <div className={navOtherClass}>
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          {button && <li className="nav-item d-none d-md-block">{button}</li>}
          {social && <Social />}
          <li className="nav-item d-lg-none">
            <button data-bs-toggle="offcanvas" data-bs-target="#offcanvas-nav" className="hamburger offcanvas-nav-btn">
              <span />
            </button>
          </li>
        </ul>
      </div>
    </Fragment>
  );

  return (
    <Fragment>
      {stickyBox && <div style={{ paddingTop: sticky ? navbarRef.current?.clientHeight : 0 }} />}

      <nav ref={navbarRef} className={sticky ? fixedClassName : navClassName}>
        {fancy ? (
          <div className="container">
            <div className="navbar-collapse-wrapper bg-white d-flex flex-row flex-nowrap w-100 justify-content-between align-items-center">
              {headerContent}
            </div>
          </div>
        ) : (
          <div className="container flex-lg-row flex-nowrap align-items-center">{headerContent}</div>
        )}
      </nav>
    </Fragment>
  );
};

export default Navbar;
