import { NextPage } from 'next';
import Image from 'next/image';

const AboutUs: NextPage = () => {
    return (
      <>
        <section id="about">
          <div className="wrapper bg-gray">
            <div className="container py-14 py-md-16">
              <div className="row gx-md-8 gx-xl-12 gy-6 align-items-center">
                <div className="col-md-8 col-lg-6 order-lg-2 mx-auto">
                  <div className="img-mask mask-2">
                    <Image width={1000} height={850} src="/img/photos/about10.jpg" alt="" />
                  </div>
                </div>

                <div className="col-lg-6">
                  <h1 className="display-5 mb-3">About Snatchi</h1>
                  <p className="lead">
                    Snatchi is a work-management platform for audiovisual organisations coordinating projects,
                    engineers and bookings. It brings everyday operational information into one shared workspace so
                    teams can spend less time switching between disconnected tools.
                  </p>
                  <p></p>
                  <p className="mb-1 lead">
                    Teams can manage projects, organise members, schedule engineers, share documents, communicate and
                    review invoices and payments. Snatchi is owned and operated by PlasmaPro Ltd and developed by Suftnet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
};

export default AboutUs;
