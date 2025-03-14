import { FC } from "react";
import PricingList from "./price-list";
interface PricingProps {
	show?: boolean;
}

const Pricing: FC<PricingProps> = ({ show = true }) => {
	return (
    <div>
      {show && (
        <div className="wrapper bg-light">
          <div className="container text-center">
            <div className="row">
              <div className="col-lg-10 mx-auto">
                <h3 className="display-4 mb-15 mb-md-6 px-lg-10">
                  Every plan provides cost-effective solutions, quality features, and reliable support.
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`wrapper ${show ? 'bg-light' : null} `}>
        <div className={`container ${show ? 'py-14 py-md-16' : null} `}>
          <PricingList />
        </div>
      </div>
    </div>
  );
};

export default Pricing;
