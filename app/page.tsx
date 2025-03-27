'use client';

import { Fragment } from 'react';
import type { NextPage } from 'next';
import PageProgress from '@/components/common/PageProgress';
import { Footer } from '@/components/blocks/footer';
import  Hero2  from '@/components/blocks/hero/Hero2';
import useLightBox from '@/hooks/useLightBox';
import { Navbar } from '@/components/blocks/navbar';
import FAQ from '@/components/blocks/faq';
import Link from 'next/link';
import Topbar from '@/components/elements/Topbar';
import Features from '@/components/blocks/service';
import Steps from '@/components/blocks/steps';
import Pricing from '@/components/blocks/pricing';
import Contact from '@/components/elements/contact';

const Home: NextPage = () => {
  useLightBox();

  return (
    <Fragment>
      <PageProgress />

      {/* <Topbar /> */}
      <header className="wrapper bg-light">
        <Navbar
          info
          navOtherClass="navbar-other ms-lg-4"
          navClassName="navbar navbar-expand-lg classic transparent navbar-light"
          button={
            <Link href="/login" className="btn btn-sm btn-primary rounded-pill">
              Sign In
            </Link>
          }
        />
      </header>

      <main className="content-wrapper">
        <section className="wrapper bg-white">
          <div className="container pt-8 pt-md-14">
            <Hero2 />
          </div>
          <Features />
          <Steps />
          <div className="pt-15 pt-md-17 bg-light">
            <Pricing />          
          </div>
          <FAQ />
          <Contact />
        </section>
      </main>
   
      <Footer />
    </Fragment>
  );
};

export default Home;
