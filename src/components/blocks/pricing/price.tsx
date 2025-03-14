import { FC } from 'react';

// ======================================
type PriceProps = {
    value: number;
    classes?: string;
    duration: string;
    currency?: string;
};
// ======================================

const Price: FC<PriceProps> = (props) => {
    const { value, duration, classes, currency = '£' } = props;

    return (
      <div className={`price justify-content-start ${classes}`}>
        <span className="price-currency text-dark">{currency}</span>
        <span className="price-value text-dark">{value}</span>
        <span className="price-duration text-dark">{duration}</span>
      </div>
    );
};

export default Price;
