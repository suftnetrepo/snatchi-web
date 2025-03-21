import { FC, Fragment } from 'react';
import { slideInDownAnimate } from '@/utils/animation';
import NextLink from '@/components/reuseable/links/NextLink';

const AppBtn: FC = () => {
  return (
    <div className="d-flex justify-content-center justify-content-lg-start" style={slideInDownAnimate('900ms')}>
      <span style={slideInDownAnimate('1200ms')}>
        <NextLink
          href="#"
          className="btn btn-secondary btn-icon btn-icon-start rounded-pill me-2"
          title={
            <Fragment>
              <i className="uil uil-apple" /> App Store
            </Fragment>
          }
        />
      </span>

      <span style={slideInDownAnimate('1500ms')}>
        <NextLink
          href="#"
          className="btn btn-green btn-icon btn-icon-start rounded-pill"
          title={
            <Fragment>
              <i className="uil uil-google-play" /> Google Play
            </Fragment>
          }
        />
      </span>
    </div>
  );
};

export default AppBtn;
