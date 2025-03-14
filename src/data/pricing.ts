// -------- icons -------- //
import Home from '@/icons/lineal/Home';
import BriefcaseTwo from '@/icons/lineal/BriefcaseTwo';
import ShoppingBasket from '@/icons/lineal/ShoppingBasket';

export const pricingList = [
  {
    monthlyPrice: 9,
    yearlyPrice: 992,
    Icon: ShoppingBasket,
    price: '£50',
    raw_price: 50,
    duration: '30 days',
    billingCycle: 'Monthly',
    index: 1,
    currency: '£',
    live_priceId: 'price_1JJEZ2LJUyk9CjU7Snxgf8Pa',
    priceId: 'price_1QhYEZIMOhOpzENNyrrY8MZr',
    planName: 'Basic Plan',
    features: [
      'Manage up to 10 projects with basic tracking.',
      'Collaborate with up to 5 engineers.',
      'Stay updated on task progress in real-time.',
      'Share and attach files easily.',
      'Access essential features via the mobile app.',
      'Chat with up to 5 team members in real time.',
      'Get email support during business hours.'
    ]
  },
  {
    Icon: Home,
    monthlyPrice: 19,
    yearlyPrice: 199,
    price: '£250',
    raw_price: 250,
    duration: '6 months',
    billingCycle: 'Every 6 months',
    planName: 'Premium',
    currency: '£',
    index: 2,
    live_priceId: 'price_1JJEZ2LJUyk9CjU7hLsimtyH',
    priceId: 'price_1QhYG5IMOhOpzENN2Q4ZemIe',
    features: [
      'Manage unlimited projects.',
      'Collaborate with up to 20 engineers.',
      'Visualize timelines with Gantt charts.',
      'Get 1TB of cloud storage for file sharing.',
      'Full access to features via the mobile app.',
      'Chat with your entire team freely.',
      'Enjoy priority email and live chat support.'
    ]
  },
  {
    monthlyPrice: 49,
    yearlyPrice: 499,
    Icon: BriefcaseTwo,
    price: '£500',
    raw_price: 500,
    duration: '1 Year',
    billingCycle: 'Yearly',
    planName: 'Premium Plus',
    currency: '£',
    index: 3,
    live_priceId: 'price_1JJEZ2LJUyk9CjU7WqYguOQ6',
    priceId: 'price_1QhYLgIMOhOpzENNbP4n8MX6',
    features: [
      'Manage unlimited projects and engineers.',
      'Set advanced roles for large teams.',
      'Coordinate multiple projects on one dashboard.',
      'Provide clients secure portal access.',
      'Add custom branding to your platform.',
      'Get help from a dedicated account manager.',
      'Access 24/7 support for any issues.',
      'Enjoy unlimited chat for teams and clients.',
      'Use premium mobile app features.',
      'Store files without limits in the cloud.'
    ]
  }
];

const findPrice = (priceId : string, live : boolean) => {
  if (live) {
    return pricingList.find((x) => x.live_priceId === priceId) || {};
  }
  return pricingList.find((x) => x.priceId === priceId) || {};
};

export { findPrice };


