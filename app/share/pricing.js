export const pricingList = [
  {
    monthlyPrice: 9,
    yearlyPrice: 99,   
    price: '£10',
    raw: '10',
    duration: '30 days',
    billingCycle: 'Monthly',
    index: 1,
    currency: '£',
    live_priceId: 'price_1JJEZ2LJUyk9CjU7Snxgf8Pa',
    priceId: 'price_1NOjSxIT5ljozdpimi188tO4',
    planName: 'Basic Plan',
    features: ['1 Project', '100K API Access', '100MB Storage', 'Weekly Reports', '7/24 Support']
  },
  {   
    monthlyPrice: 19,
    yearlyPrice: 199,
    price: '£50',
    raw: '50',
    duration: 'Every 6 months',
    billingCycle: 'Every 6 months',
    planName: 'Premium',
    currency: '£',
    index: 2,
    live_priceId: 'price_1JJEZ2LJUyk9CjU7hLsimtyH',
    priceId: 'price_1NOjTgIT5ljozdpiVuGC6Wo7',
    features: ['5 Projects', '100K API Access', '200MB Storage', 'Weekly Reports', '7/24 Support']
  },
  {
    monthlyPrice: 49,
    yearlyPrice: 499,   
    price: '£100',
    raw: '100',
    duration: 'Yearly',
    billingCycle: 'Yearly',
    planName: 'Premium Plus',
    currency: '£',
    index: 3,
    live_priceId: 'price_1JJEZ2LJUyk9CjU7WqYguOQ6',
    priceId: 'price_1NOjUEIT5ljozdpibTo9ZWFG',
    features: ['20 Projects', '300K API Access', '500MB Storage', 'Weekly Reports', '7/24 Support']
  }
];

const findPrice = (priceId, live) => {
  if (live) {
    return pricingList.find((x) => x.live_priceId === priceId) || {};
  }
  return pricingList.find((x) => x.priceId === priceId) || {};
};

export { findPrice }


