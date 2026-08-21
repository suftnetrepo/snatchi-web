// -------- icons -------- //
import Home from '@/icons/lineal/Home';
import BriefcaseTwo from '@/icons/lineal/BriefcaseTwo';
import ShoppingBasket from '@/icons/lineal/ShoppingBasket';

export const pricingList = [
  {
    monthlyPrice: 50,
    yearlyPrice: 600,
    Icon: ShoppingBasket,
    price: '£50',
    raw_price: 50,
    duration: 'month',
    billingCycle: 'Monthly',
    index: 1,
    currency: '£',
    live_priceId: 'price_1JJEZ2LJUyk9CjU7Snxgf8Pa',
    priceId: 'price_1QhYEZIMOhOpzENNyrrY8MZr',
    planName: 'Basic Plan',
    planKey: 'basic',
    limits: { activeProjects: 25, activeMembers: 10, monthlyDocumentUploads: 100, maximumFileSizeMb: 10 },
    features: [
      'Manage up to 25 active projects.',
      'Collaborate with up to 10 active organisation members.',
      'Upload up to 100 documents per billing period.',
      'Upload files up to 10MB each.',
      'Includes all core Snatchi workflow features.',
      'Get email support during business hours.'
    ]
  },
  {
    Icon: Home,
    monthlyPrice: 42,
    yearlyPrice: 500,
    price: '£250',
    raw_price: 250,
    duration: '6 months',
    billingCycle: 'Every 6 months',
    planName: 'Premium',
    planKey: 'premium',
    limits: { activeProjects: 75, activeMembers: 30, monthlyDocumentUploads: 500, maximumFileSizeMb: 25 },
    currency: '£',
    index: 2,
    live_priceId: 'price_1JJEZ2LJUyk9CjU7hLsimtyH',
    priceId: 'price_1QhYG5IMOhOpzENN2Q4ZemIe',
    features: [
      'Manage up to 75 active projects.',
      'Collaborate with up to 30 active organisation members.',
      'Upload up to 500 documents per billing period.',
      'Upload files up to 25MB each.',
      'Includes all core Snatchi workflow features.',
      'Get priority email support.'
    ]
  },
  {
    monthlyPrice: 42,
    yearlyPrice: 500,
    Icon: BriefcaseTwo,
    price: '£500',
    raw_price: 500,
    duration: 'year',
    billingCycle: 'Yearly',
    planName: 'Premium Plus',
    planKey: 'premium_plus',
    limits: { activeProjects: 250, activeMembers: 100, monthlyDocumentUploads: 2000, maximumFileSizeMb: 50 },
    currency: '£',
    index: 3,
    live_priceId: 'price_1JJEZ2LJUyk9CjU7WqYguOQ6',
    priceId: 'price_1QhYLgIMOhOpzENNbP4n8MX6',
    features: [
      'Manage up to 250 active projects.',
      'Collaborate with up to 100 active organisation members.',
      'Upload up to 2,000 documents per billing period.',
      'Upload files up to 50MB each.',
      'Includes all core Snatchi workflow features.',
      'Get priority email support.'
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
