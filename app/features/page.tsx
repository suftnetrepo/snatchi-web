import { NextPage } from 'next';
import { Fragment } from 'react';
import PageProgress from '@/components/common/PageProgress';
import PublicHeader from '@/components/blocks/navbar/PublicHeader';
import { Footer } from '@/components/blocks/footer';
import Features from '@/components/blocks/service';

const Feature: NextPage = () => {
  return (
    <Fragment>
      <PageProgress />

      <PublicHeader />

      <main className="content-wrapper">
        <section className="wrapper bg-soft-primary">
          <div className="container pt-10  pt-md-14 pb-md-14 text-center">
            <div className="row">
              <div className="col-sm-9 col-md-7 col-lg-7 mx-auto">
                <h1 className="display-1 mb-3">Features</h1>
                <p className="lead mb-0 px-xl-10 px-xxl-13">
                  Coordinate projects, people, bookings, documents and payments from one workspace.
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
