/**
 * Test data helpers and user generators
 * These helpers create consistent test users with various subscription states
 */

export const STRIPE_TEST_CARDS = {
  SUCCESS: '4242424242424242',
  THREE_DS: '4000002500003155',
  DECLINE: '4000000000000002',
};

export const TEST_USER_DATA = {
  valid: {
    email: 'test+valid@example.com',
    password: 'TestPass123!',
    name: 'Test User',
    phone: '+1234567890',
  },
  invalidEmail: {
    email: 'not-an-email',
    password: 'TestPass123!',
    name: 'Test User',
  },
  invalidPhone: {
    email: 'test+phone@example.com',
    password: 'TestPass123!',
    name: 'Test User',
    phone: 'invalid-phone',
  },
  missingEmail: {
    password: 'TestPass123!',
    name: 'Test User',
  },
  missingPassword: {
    email: 'test+missing@example.com',
    name: 'Test User',
  },
};

/**
 * Generate unique test user with timestamp to avoid conflicts
 */
export function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `test+${timestamp}@example.com`,
    password: 'TestPass123!',
    name: 'E2E Test User',
    phone: '+1234567890',
  };
}

/**
 * Generate unique email for testing
 */
export function generateTestEmail(prefix = 'test') {
  const timestamp = Date.now();
  return `${prefix}+${timestamp}@example.com`;
}

/**
 * Test checkout data
 */
export const TEST_CHECKOUT_DATA = {
  validCheckout: {
    email: 'checkout+valid@example.com',
    phone: '+1234567890',
    fullName: 'John Doe',
    country: 'US',
    city: 'New York',
    zipCode: '10001',
    address: '123 Main St',
    acceptTerms: true,
  },
  missingEmail: {
    phone: '+1234567890',
    fullName: 'John Doe',
  },
  missingPhone: {
    email: 'checkout+phone@example.com',
    fullName: 'John Doe',
  },
  invalidEmail: {
    email: 'not-an-email',
    phone: '+1234567890',
    fullName: 'John Doe',
  },
  invalidPhone: {
    email: 'checkout+invalid@example.com',
    phone: 'invalid',
    fullName: 'John Doe',
  },
};

/**
 * Pricing plans used in tests
 * These should match the actual pricing plans in the app
 */
export const TEST_PRICING_PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter_test',
    amount: 2900, // $29.00 in cents
    currency: 'usd',
  },
  professional: {
    name: 'Professional',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_test',
    amount: 7900, // $79.00 in cents
    currency: 'usd',
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_test',
    amount: 19900, // $199.00 in cents
    currency: 'usd',
  },
};

/**
 * Wait times for async operations
 */
export const WAIT_TIMES = {
  SHORT: 1000,
  MEDIUM: 3000,
  LONG: 5000,
  WEBHOOK: 10000, // Webhooks can take a bit longer
};

/**
 * Subscription statuses for testing
 */
export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
};
