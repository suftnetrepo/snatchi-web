'use client';

import next, { NextPage } from 'next';
import { Fragment } from 'react';

import { Footer } from '@/components/blocks/footer';
import PageProgress from '@/components/common/PageProgress';
import ContactForm from '@/components/common/ContactForm';
import ContactTiles from '@/components/elements/tiles/Contact-Tiles';
import Topbar from '@/components/elements/Topbar';
import Navbar from '@/components/blocks/navbar/Navbar';
import Link from 'next/link';

const ContactTwo: NextPage = () => {
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
        <section className="wrapper bg-white">
          <div className="container py-14 py-md-16">
            {/* ========== contact info section ========== */}
            <div className="row gx-md-8 gx-xl-12 gy-10 align-items-center">
              <ContactTiles />

              <div className="col-lg-5">
                <h2 className="display-4 mb-8">Got any questions? Don't hesitate to get in touch.</h2>
                <div className="d-flex flex-row">
                  <div>
                    <div className="icon text-primary fs-28 me-6 mt-n1">
                      <i className="uil uil-location-pin-alt" />
                    </div>
                  </div>

                  <div>
                    <h5 className="mb-1">Address</h5>
                    <address>
                      113 -115 Fonthill Road, Finsbury Park, London, N4 3HH <br className="d-none d-md-block" />
                      London, United Kingdom
                    </address>
                  </div>
                </div>

                <div className="d-flex flex-row">
                  <div>
                    <div className="icon text-primary fs-28 me-6 mt-n1">
                      <i className="uil uil-phone-volume" />
                    </div>
                  </div>

                  <div>
                    <h5 className="mb-1">Phone</h5>
                    <p>+44 7404 522 280 </p>
                  </div>
                </div>

                <div className="d-flex flex-row">
                  <div>
                    <div className="icon text-primary fs-28 me-6 mt-n1">
                      <i className="uil uil-envelope" />
                    </div>
                  </div>

                  <div>
                    <h5 className="mb-1">E-mail</h5>
                    <p className="mb-0">
                      <a href="mailto:info@snatchi.com" className="link-body">
                        info@snatchi.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== contact form section ========== */}
            <div className="row mt-8">
              <div className="col-lg-10 offset-lg-1 col-xl-8 offset-xl-2">
                <h2 className="display-4 mb-3 text-center">Drop Us a Line</h2>
                <p className="lead text-center mb-10">
                  Reach out to us from our contact form and we will get back to you shortly.
                </p>

                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </Fragment>
  );
};

export default ContactTwo;
