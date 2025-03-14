import { FC } from 'react';
// -------- data -------- //
import data from '@/data/demo-27';

interface PricingProps {
  show?: boolean;
}

const Features: FC<PricingProps> = ({show = true}) => {
  return (
    <section className={`wrapper ${show ? 'bg-light' : null} `}>
      <div className={`container ${show ? 'py-15 py-md-16' : null} `}>
        {show && (
          <div className="row text-center">
            <div className="col-md-10 col-lg-9 col-xxl-8 mx-auto">
              <h2 className="fs-15 text-uppercase text-muted mb-3">What We Do?</h2>
              <h3 className="display-3 ls-sm mb-9 px-xl-11">
                Your needs drive our purpose – tailored solutions just for you.
              </h3>
            </div>
          </div>
        )}

        <div className="row gx-lg-8 gx-xl-12 gy-8">
          {data.serviceList.map(({ Icon, id, title, color, description }) => (
            <div className="col-md-6 col-lg-4" key={id}>
              <div className="d-flex flex-row">
                <div>
                  <Icon className={`icon-svg-md text-${color} me-5 mt-1`} />
                </div>

                <div>
                  <h4 className="fs-20 ls-sm">{title}</h4>
                  <p className="mb-0">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
