/**
 * Test Utilities for Phase 1B Cross-Integrator Payments
 * Shared mocking and test helpers
 */

import { Types } from 'mongoose';

/**
 * Create mock integrator with verified Stripe Connect
 */
export const createMockIntegratorA = () => ({
  _id: new Types.ObjectId('111111111111111111111111'),
  name: 'TechCorp',
  email: 'admin@techcorp.com',
  stripeCustomerId: 'cus_techcorp_123',
  stripeConnectAccountId: 'acct_techcorp_verified',
  connectAccountStatus: 'verified',
  chargesEnabled: true,
  payoutsEnabled: true,
  platformFeePercentage: 10,
  currency: 'gbp'
});

/**
 * Create mock integrator B that owns engineers
 */
export const createMockIntegratorB = () => ({
  _id: new Types.ObjectId('222222222222222222222222'),
  name: 'EngineerCo',
  email: 'admin@engineerco.com',
  stripeCustomerId: 'cus_engineerco_123',
  stripeConnectAccountId: 'acct_engineerco_verified',
  connectAccountStatus: 'verified',
  chargesEnabled: true,
  payoutsEnabled: true,
  platformFeePercentage: 10,
  currency: 'gbp'
});

/**
 * Create mock integrator without verified Connect
 */
export const createMockIntegratorUnverified = () => ({
  _id: new Types.ObjectId('333333333333333333333333'),
  name: 'UnverifiedCorp',
  email: 'admin@unverified.com',
  stripeCustomerId: 'cus_unverified_123',
  stripeConnectAccountId: undefined,
  connectAccountStatus: 'not_started',
  chargesEnabled: false,
  payoutsEnabled: false,
  platformFeePercentage: 10,
  currency: 'gbp'
});

/**
 * Create mock engineer owned by integrator
 */
export const createMockEngineer = (integratorId = null) => ({
  _id: new Types.ObjectId('444444444444444444444444'),
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@engineerco.com',
  integrator: integratorId || new Types.ObjectId('222222222222222222222222'),
  role: 'engineer'
});

/**
 * Create mock scheduler booking
 */
export const createMockScheduler = (engineerId, integratorId) => ({
  _id: new Types.ObjectId('555555555555555555555555'),
  title: 'React Development',
  engineer: engineerId || new Types.ObjectId('444444444444444444444444'),
  integrator: integratorId || new Types.ObjectId('222222222222222222222222'),
  project: new Types.ObjectId('666666666666666666666666'),
  status: 'Accepted',
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
  startTime: '09:00',
  endTime: '17:00'
});

/**
 * Create mock Stripe PaymentIntent
 */
export const createMockPaymentIntent = (amount = 50000) => ({
  id: 'pi_test_' + Math.random().toString(36).substr(2, 9),
  object: 'payment_intent',
  amount,
  amount_capturable: 0,
  amount_details: { tip: 0 },
  amount_received: 0,
  application: null,
  application_fee_amount: null,
  automatic_payment_methods: null,
  canceled_at: null,
  cancellation_reason: null,
  capture_method: 'automatic',
  charges: {
    object: 'list',
    data: [
      {
        id: 'ch_test_' + Math.random().toString(36).substr(2, 9),
        object: 'charge',
        amount,
        amount_captured: amount,
        amount_refunded: 0,
        balance_transaction: 'txn_test_' + Math.random().toString(36).substr(2, 9),
        billing_details: {},
        captured: true,
        created: Math.floor(Date.now() / 1000),
        currency: 'gbp',
        customer: 'cus_techcorp_123',
        description: null,
        destination: null,
        dispute: null,
        disputed: false,
        failure_balance_transaction: null,
        failure_code: null,
        failure_message: null,
        fraud_details: null,
        invoice: null,
        livemode: false,
        metadata: {},
        on_behalf_of: null,
        order: null,
        outcome: {
          network_status: 'approved_by_network',
          reason: null,
          risk_level: 'normal',
          risk_score: 32,
          seller_message: 'Payment complete.',
          type: 'authorized'
        },
        paid: true,
        payment_intent: 'pi_test_' + Math.random().toString(36).substr(2, 9),
        payment_method: 'card_test_' + Math.random().toString(36).substr(2, 9),
        payment_method_details: {
          card: {
            brand: 'visa',
            checks: { address_line1_check: null, address_postal_code_check: null, cvc_check: 'pass' },
            country: 'US',
            exp_month: 8,
            exp_year: 2025,
            fingerprint: 'test_fingerprint',
            funding: 'credit',
            generated_from: null,
            installments: null,
            last4: '4242',
            mandate: null,
            network: 'visa',
            three_d_secure: null,
            wallet: null
          },
          type: 'card'
        },
        receipt_email: null,
        receipt_number: null,
        receipt_url: 'https://receipts.stripe.com/test',
        refunded: false,
        refunds: { object: 'list', data: [], has_more: false, total_count: 0, url: '/v1/charges/ch_test/refunds' },
        review: null,
        shipping: null,
        source: {
          id: 'card_test',
          object: 'card',
          address_city: null,
          address_country: null,
          address_line1: null,
          address_line1_check: null,
          address_line2: null,
          address_state: null,
          address_zip: null,
          address_zip_check: null,
          brand: 'Visa',
          country: 'US',
          customer: 'cus_techcorp_123',
          exp_month: 8,
          exp_year: 2025,
          fingerprint: 'test_fingerprint',
          funding: 'credit',
          last4: '4242',
          metadata: {},
          name: null,
          tokenization_method: null
        },
        source_transfer: null,
        statement_descriptor: null,
        statement_descriptor_suffix: null,
        status: 'succeeded',
        transfer_data: null,
        transfer_group: null
      }
    ],
    has_more: false,
    total_count: 1,
    url: '/v1/charges'
  },
  client_secret: 'pi_test_secret_' + Math.random().toString(36).substr(2, 9),
  confirmation_method: 'automatic',
  created: Math.floor(Date.now() / 1000),
  currency: 'gbp',
  customer: 'cus_techcorp_123',
  description: 'Engineer service: John Doe for TechCorp',
  flow_directions: null,
  livemode: false,
  metadata: {},
  next_action: null,
  on_behalf_of: 'acct_engineerco_verified',
  payment_method: 'card_test_' + Math.random().toString(36).substr(2, 9),
  payment_method_types: ['card'],
  processing: null,
  receipt_email: null,
  review: null,
  setup_future_usage: null,
  shipping: null,
  source: null,
  statement_descriptor: null,
  statement_descriptor_suffix: null,
  status: 'succeeded',
  transfer_data: {
    destination: 'acct_engineerco_verified'
  },
  transfer_group: null
});

/**
 * Create mock Stripe Charge
 */
export const createMockCharge = (paymentIntentId, amount = 50000) => ({
  id: 'ch_test_' + Math.random().toString(36).substr(2, 9),
  object: 'charge',
  amount,
  amount_captured: amount,
  amount_refunded: 0,
  balance_transaction: 'txn_test_' + Math.random().toString(36).substr(2, 9),
  billing_details: {},
  captured: true,
  created: Math.floor(Date.now() / 1000),
  currency: 'gbp',
  customer: 'cus_techcorp_123',
  payment_intent: paymentIntentId,
  status: 'succeeded'
});

/**
 * Create mock Stripe Transfer
 */
export const createMockTransfer = (chargeId, amount, destination) => ({
  id: 'tr_test_' + Math.random().toString(36).substr(2, 9),
  object: 'transfer',
  amount,
  amount_reversed: 0,
  balance_transaction: 'txn_test_' + Math.random().toString(36).substr(2, 9),
  created: Math.floor(Date.now() / 1000),
  currency: 'gbp',
  description: 'Snatchi marketplace engineer service payment transfer',
  destination,
  destination_payment: 'py_test_' + Math.random().toString(36).substr(2, 9),
  livemode: false,
  metadata: {},
  object: 'transfer',
  recipient: null,
  reversals: {
    object: 'list',
    data: [],
    has_more: false,
    total_count: 0,
    url: '/v1/transfers/tr_test/reversals'
  },
  reversed: false,
  source_transaction: chargeId,
  source_type: 'card',
  statement_descriptor: null,
  status: 'paid',
  type: 'card'
});

/**
 * Mock NextAuth session
 */
export const createMockSession = (integratorId, role = 'integrator') => ({
  user: {
    id: new Types.ObjectId().toString(),
    email: 'user@example.com',
    name: 'Test User',
    integrator_id: integratorId.toString(),
    role
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
});

/**
 * Helper to extract charge ID from payment intent
 */
export const getChargeIdFromPaymentIntent = (paymentIntent) => {
  return paymentIntent.charges?.data?.[0]?.id || null;
};

/**
 * Stripe webhook event mocks
 */
export const createPaymentIntentSucceededEvent = (paymentIntent) => ({
  id: 'evt_test_' + Math.random().toString(36).substr(2, 9),
  object: 'event',
  api_version: '2024-04-10',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: paymentIntent,
    previous_attributes: {}
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null
  },
  type: 'payment_intent.succeeded'
});

export const createPaymentIntentFailedEvent = (paymentIntentId, failureCode = 'card_declined') => ({
  id: 'evt_test_' + Math.random().toString(36).substr(2, 9),
  object: 'event',
  api_version: '2024-04-10',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: paymentIntentId,
      object: 'payment_intent',
      amount: 50000,
      currency: 'gbp',
      status: 'requires_payment_method',
      client_secret: 'pi_secret_test',
      last_payment_error: {
        code: failureCode,
        message: 'Your card was declined',
        type: 'card_error'
      }
    },
    previous_attributes: {
      status: 'processing'
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null
  },
  type: 'payment_intent.payment_failed'
});

export const createTransferCreatedEvent = (transfer) => ({
  id: 'evt_test_' + Math.random().toString(36).substr(2, 9),
  object: 'event',
  api_version: '2024-04-10',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      ...transfer,
      status: 'in_transit'
    },
    previous_attributes: {}
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null
  },
  type: 'transfer.created'
});

export const createTransferPaidEvent = (transfer) => ({
  id: 'evt_test_' + Math.random().toString(36).substr(2, 9),
  object: 'event',
  api_version: '2024-04-10',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      ...transfer,
      status: 'paid'
    },
    previous_attributes: {
      status: 'in_transit'
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null
  },
  type: 'transfer.paid'
});
