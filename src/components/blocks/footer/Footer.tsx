import { FC } from 'react';
// -------- custom component -------- //
import NextLink from '@/components/reuseable/links/NextLink';
import { siteIdentity } from '@/data/site';
// -------- data -------- //
import footerNav from '@/data/footer';

const Footer8: FC = () => {
  return (
    <footer className="bg-dark text-inverse">
      <div className="container py-13 py-md-15">
        <div className="row gy-6 gy-lg-0">
          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <img className="mb-4" src="/img/logo.png" srcSet="/img/logo.png 2x" alt="Snatchi" />

              <p className="mb-4">
                © {new Date().getFullYear()} {siteIdentity.ownerName}. <br className="d-none d-lg-block" />
                Snatchi is owned and operated by {siteIdentity.ownerName} and developed by {siteIdentity.developerName}.
              </p>
            </div>
          </div>

          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">Get in Touch</h4>
              <address className="pe-xl-15 pe-xxl-17">{siteIdentity.address}</address>
              <NextLink title={siteIdentity.email} href={`mailto:${siteIdentity.email}`} />
              <br /><NextLink title={siteIdentity.phoneDisplay} href={siteIdentity.phoneHref} />
            </div>
          </div>

          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">Learn More</h4>
              <ul className="list-unstyled  mb-0">
                {footerNav.map(({ title, url }) => (
                  <li key={title}>
                    <NextLink title={title} href={url} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-md-12 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">Legal</h4>
              <ul className="list-unstyled mb-0">
                <li><NextLink title="Privacy Policy" href="/privacyPolicy" /></li>
                <li><NextLink title="Terms and Conditions" href="/termsAndCondition" /></li>
                <li><NextLink title="Contact Support" href="/contact" /></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer8;
