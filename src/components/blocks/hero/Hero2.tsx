import { FC } from 'react';
import NextLink from '@/components/reuseable/links/NextLink';


const Hero2: FC = () => {
  return (
    <div className="row gx-lg-0 gx-xl-8 gy-10 gy-md-13 gy-lg-0 mb-7 mb-md-10 mb-lg-16 align-items-center">
      <div
        className="col-md-8 offset-md-2 col-lg-6 offset-lg-1 position-relative order-2 order-lg-2 mt-8 mt-lg-0"
      >
        <div className="shape bg-dot primary rellax w-17 h-19" style={{ top: '-1.7rem', left: '-1.5rem' }} />
        <div
          className="shape rounded bg-soft-primary rellax d-md-block"
          style={{ width: '85%', height: '90%', right: '-0.8rem', bottom: '-1.8rem' }}
        />

        <figure className="rounded">
          <img src="/img/photos/about8.jpg" srcSet="/img/photos/about8@2x.jpg 2x" alt="hero" />
        </figure>
      </div>

      <div className="col-lg-5 order-1 mt-lg-n10 text-center text-lg-start">
        <h1 className="display-1 mb-5">
          Run AV projects, engineers and bookings from one workspace
        </h1>

        <p className="lead fs-25 lh-sm mb-7 px-md-10 px-lg-0">
          Plan projects, schedule engineers, share documents and keep your team informed without juggling disconnected tools.
        </p>

        <div className="d-flex justify-content-center justify-content-lg-start">
          <span>
            <NextLink title="View Plans" href="#plans" className="btn btn-lg btn-primary rounded-pill me-2" />
          </span>
          <span>
            <NextLink title="Explore Features" href="/features" className="btn btn-lg btn-outline-primary rounded-pill" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default Hero2;
