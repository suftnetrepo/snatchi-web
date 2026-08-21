export const PLAN_KEYS = Object.freeze({
  BASIC: 'basic',
  PREMIUM: 'premium',
  PREMIUM_PLUS: 'premium_plus'
});

export const PLAN_CATALOG = Object.freeze({
  [PLAN_KEYS.BASIC]: Object.freeze({
    key: PLAN_KEYS.BASIC,
    name: 'Basic Plan',
    price: '£50',
    billingCycle: 'Monthly',
    duration: '30 days',
    testPriceId: 'price_1QhYEZIMOhOpzENNyrrY8MZr',
    livePriceId: 'price_1JJEZ2LJUyk9CjU7Snxgf8Pa',
    limits: Object.freeze({ activeProjects: 25, activeMembers: 10, monthlyDocumentUploads: 100, maximumFileSizeMb: 10 })
  }),
  [PLAN_KEYS.PREMIUM]: Object.freeze({
    key: PLAN_KEYS.PREMIUM,
    name: 'Premium',
    price: '£250',
    billingCycle: 'Every 6 months',
    duration: '6 months',
    testPriceId: 'price_1QhYG5IMOhOpzENN2Q4ZemIe',
    livePriceId: 'price_1JJEZ2LJUyk9CjU7hLsimtyH',
    limits: Object.freeze({ activeProjects: 75, activeMembers: 30, monthlyDocumentUploads: 500, maximumFileSizeMb: 25 })
  }),
  [PLAN_KEYS.PREMIUM_PLUS]: Object.freeze({
    key: PLAN_KEYS.PREMIUM_PLUS,
    name: 'Premium Plus',
    price: '£500',
    billingCycle: 'Yearly',
    duration: '1 Year',
    testPriceId: 'price_1QhYLgIMOhOpzENNbP4n8MX6',
    livePriceId: 'price_1JJEZ2LJUyk9CjU7WqYguOQ6',
    limits: Object.freeze({ activeProjects: 250, activeMembers: 100, monthlyDocumentUploads: 2000, maximumFileSizeMb: 50 })
  })
});

export const getPlanByKey = (key) => PLAN_CATALOG[key] || null;

export const getPlanByName = (name) =>
  Object.values(PLAN_CATALOG).find((plan) => plan.name === name) || null;

export const getPlanByPriceId = (priceId, { live = process.env.NODE_ENV === 'production' } = {}) =>
  Object.values(PLAN_CATALOG).find((plan) =>
    (live ? plan.livePriceId : plan.testPriceId) === priceId
  ) || null;

export const getPlanByAnyPriceId = (priceId) =>
  Object.values(PLAN_CATALOG).find((plan) => plan.livePriceId === priceId || plan.testPriceId === priceId) || null;

export const isPriceIdAllowedForEnvironment = (priceId) => Boolean(getPlanByPriceId(priceId));
