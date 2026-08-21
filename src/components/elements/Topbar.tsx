import { FC } from 'react';
import { siteIdentity } from '@/data/site';

// =========================================================
type TopbarProps = { bgColor?: string; textColor?: string };
// =========================================================

const Topbar: FC<TopbarProps> = ({ bgColor = 'bg__purple', textColor = 'text-white' }) => {
  return (
    <div className={`${bgColor} ${textColor} fw-bold fs-15 d-none d-md-block`}>
      <div className="container py-2 d-md-flex flex-md-row">
        <div className="d-flex flex-row align-items-center">
          <div className="icon text-white fs-22 mt-1 me-2">
            <i className="uil uil-location-pin-alt"></i>
          </div>

          <address className="mb-0">{siteIdentity.address}</address>
        </div>

        <div className="d-flex flex-row align-items-center me-6 ms-auto">
          <div className="icon text-white fs-22 mt-1 me-2">
            <i className="uil uil-phone-volume"></i>
          </div>

          <p className="mb-0"><a className="link-white hover" href={siteIdentity.phoneHref}>{siteIdentity.phoneDisplay}</a></p>
        </div>

        <div className="d-flex flex-row align-items-center">
          <div className="icon text-white fs-22 mt-1 me-2">
            <i className="uil uil-message"></i>
          </div>

          <p className="mb-0">
            <a href={`mailto:${siteIdentity.email}`} className="link-white hover">
              {siteIdentity.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
