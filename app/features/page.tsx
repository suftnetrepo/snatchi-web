import { NextPage } from 'next';
import { Fragment } from 'react';
import { Navbar } from '@/components/blocks/navbar';
import PageProgress from '@/components/common/PageProgress';
import Link from 'next/link';
import Topbar from '@/components/elements/Topbar';
import { Footer } from '@/components/blocks/footer';
import Features from '@/components/blocks/service';

const Feature: NextPage = () => {
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
        <section className="wrapper bg-soft-primary">
          <div className="container pt-10  pt-md-14 pb-md-14 text-center">
            <div className="row">
              <div className="col-sm-9 col-md-7 col-lg-7 mx-auto">
                <h1 className="display-1 mb-3">Features</h1>
                <p className="lead mb-0 px-xl-10 px-xxl-13">
                  Your needs drive our purpose – tailored solutions just for you.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="wrapper mt-12">
          <div className="container pb-14 pb-md-16">
            <Features show={false} />
          </div>
        </section>
      </main>
      <Footer />
    </Fragment>
  );
};

export default Feature;
