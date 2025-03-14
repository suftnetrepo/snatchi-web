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
                  <h2 className="display-5 mb-3">About Us</h2>
                  <p className="lead">
                    Snatchi is an innovative AV project management solution designed to transform the way audiovisual
                    professionals manage their projects. Built with the latest technology and a deep understanding of
                    the AV industry's unique challenges, Snatchi streamlines workflows, enhances collaboration, and
                    ensures that every project is executed with precision and efficiency.
                  </p>
                  <p></p>
                  <p className="mb-1 lead">
                    At its core, Snatchi empowers users to take control of their AV projects from inception to
                    completion. With intuitive tools for task scheduling, resource allocation, budget tracking, and
                    progress monitoring, our platform provides a comprehensive suite of features tailored to meet the
                    needs of AV professionals. Whether you’re managing a small installation or a large-scale deployment,
                    Snatchi equips you with the tools to stay organized, meet deadlines, and exceed client expectations
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
