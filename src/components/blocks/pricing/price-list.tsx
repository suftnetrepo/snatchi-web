'use client'; // Mark this as a Client Component

import { FC } from 'react';
// -------- data-------- //
import { pricingList } from '@/data/pricing';
import PricingCard from './pricing-card';

// =============================================================================
type PricingListProps = { className?: string };
// =============================================================================

const PricingList: FC<PricingListProps> = ({ className }) => {
  
  return (
    <div className={`pricing-wrapper position-relative ${className || 'mt-n16 mt-md-n16'}`}>
      <div className="shape bg-dot primary rellax w-16 h-18" style={{ top: '2rem', right: '-2.4rem' }} />
      <div
        className="shape rounded-circle bg-line red rellax w-18 h-18 d-none d-lg-block"
        style={{ bottom: '0.5rem', left: '-2.5rem' }}
      />
    
      <div className="row gy-6 mt-3 mt-md-5">
        {pricingList.map((item, i) => (
          <div className={`col-md-6 col-lg-4 ${i === 1 && 'popular'}`} key={i}>
            <PricingCard {...item} activeYearly={false} roundedButton />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingList;
