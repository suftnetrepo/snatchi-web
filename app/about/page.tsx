'use client';

import { NextPage } from 'next';
import { Fragment } from 'react';
// -------- custom component -------- //
import Team from '@/components/blocks/team/Team';
import Target from '@/icons/lineal/Target';
import AwardTwo from '@/icons/lineal/AwardTwo';

import { Footer } from '@/components/blocks/footer';
import FigureImage from '@/components/reuseable/FigureImage';
import NextLink from '@/components/reuseable/links/NextLink';
import NavBarLink from '@/components/reuseable/links/NavbarLink';
import AboutUs from '@/components/blocks/about';
import PageProgress from '@/components/common/PageProgress';
import Topbar from '@/components/elements/Topbar';
import Navbar from '@/components/blocks/navbar/Navbar';
import Link from 'next/link';
import AccordionList from '@/components/common/AccordionList';

const About: NextPage = () => {
  return (
    <Fragment>
      <PageProgress />

      <Topbar />
      <header className="wrapper bg-light">
        <Navbar
          info
          navOtherClass="navbar-other ms-lg-4"
          navClassName="navbar navbar-expand-lg classic transparent navbar-light"
          button={
            <Link href="/login" className="btn btn-sm text-white bg__purple rounded-pill">
              Sign In
            </Link>
          }
        />
      </header>

      <main className="content-wrapper">
        <AboutUs />

        <section className="wrapper bg-light">
          <div className="container pb-14 pb-md-16">
            <div className="row gx-lg-8 gx-xl-12 gy-6 mb-10 align-items-center">
              <div className="col-lg-7 order-lg-2">
                <figure>
                  <img
                    alt=""
                    className="w-auto"
                    src="/img/illustrations/i2.png"
                    srcSet="/img/illustrations/i2@2x.png 2x"
                  />
                </figure>
              </div>

              <div className="col-lg-5">
                <h2 className="fs-15 text-uppercase text-line text-primary mb-3">Why Choose Us?</h2>
                <h3 className="display-5 mb-7">A few reasons why our valued customers choose us.</h3>
                <AccordionList />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========== footer section ========== */}
      <Footer />
    </Fragment>
  );
};

export default About;
