'use client';

import { NextPage } from 'next';
import { Fragment } from 'react';
import { Footer } from '@/components/blocks/footer';
import NextLink from '@/components/reuseable/links/NextLink';
import ResetPasswordForm from '@/components/elements/forms/ResetPasswordForm';
import NavBarLink from '@/components/reuseable/links/NavbarLink';

const ResetPassword: NextPage = () => {
  return (
    <Fragment>
      <header className="wrapper bg-soft-primary">
        <NavBarLink
          className="navbar navbar-expand-lg center-nav transparent position-absolute navbar-dark"
          button={<NextLink title=" Sign In" href="/login" className="btn btn-sm btn-primary rounded-pill" />}
        />
      </header>

      <main className="content-wrapper">
        <section className="wrapper bg-dark text-white">
          <div className="container pt-18 pt-md-20 pb-21 pb-md-21 text-center">
            <div className="row">
              <div className="col-lg-8 mx-auto">
                <h1 className="display-1 text-white mb-3">Reset Password</h1>
              </div>
            </div>
          </div>
        </section>

        <section className="wrapper bg-light">
          <div className="container pb-14 pb-md-16">
            <div className="row">
              <div className="col mt-n19">
                <div className="card shadow-lg">
                  <div className="row gx-0 text-center">
                    <div
                      className="col-lg-6 image-wrapper bg-image bg-cover rounded-top rounded-lg-start d-none d-md-block"
                      style={{ backgroundImage: 'url(/img/photos/tm3.jpg)' }}
                    />

                    <div className="col-lg-6">
                      <div className="p-10 p-md-11 p-lg-13">
                        <ResetPasswordForm />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </Fragment>
  );
};

export default ResetPassword;
