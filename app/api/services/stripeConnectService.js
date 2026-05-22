/* eslint-disable linebreak-style */
/**
 * Stripe Connect service for integrator account management
 * Handles onboarding, status retrieval, and account link generation
 */

import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { INTEGRATOR_CONNECT_STATUS } from '../constants/statuses';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

/**
 * Create a new Stripe Connect Express account for an integrator
 * @param {Object} integrator - Integrator document from database
 * @returns {Promise<Object>} Created Stripe account object
 */
export const createIntegratorExpressAccount = async (integrator) => {
  try {
    logger.info('Creating Stripe Connect Express account for integrator', {
      integratorId: integrator._id,
      integratorName: integrator.name
    });

    const account = await stripe.accounts.create({
      type: 'express',
      country: integrator.country || integrator.address?.country_code || 'GB',
      email: integrator.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'company',
      business_profile: {
        name: integrator.name,
        product_description: 'Engineer service marketplace payments'
      },
      metadata: {
        integratorId: integrator._id.toString(),
        platform: 'snatchi'
      }
    });

    logger.info('Stripe Express account created successfully', {
      accountId: account.id,
      integratorId: integrator._id
    });

    return account;
  } catch (error) {
    logger.error('Failed to create Stripe Express account', {
      error: error.message,
      integratorId: integrator._id
    });

    const stripeError = new Error('Stripe Connect account creation failed');
    stripeError.details = error.message;
    stripeError.cause = error;
    throw stripeError;
  }
};

/**
 * Create an account link for onboarding an integrator to Stripe Connect
 * @param {string} stripeAccountId - Stripe Connect account ID
 * @returns {Promise<Object>} Account link with URL and expiration
 */
export const createIntegratorAccountLink = async (stripeAccountId) => {
  try {
    logger.info('Creating account link for Stripe Connect onboarding', {
      accountId: stripeAccountId
    });

    const baseUrl = (
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
    ).trim().replace(/\/+$/, '');

    if (!/^https?:\/\//.test(baseUrl)) {
      throw new Error('Invalid app base URL. NEXTAUTH_URL or NEXT_PUBLIC_APP_URL must start with http:// or https://');
    }

    const refreshUrl = `${baseUrl}/protected/integrator/settings?tab=receive-payments&connect=refresh`;
    const returnUrl = `${baseUrl}/protected/integrator/settings?tab=receive-payments&connect=return`;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      type: 'account_onboarding',
      refresh_url: refreshUrl,
      return_url: returnUrl
    });

    logger.info('Account link created successfully', {
      accountId: stripeAccountId,
      refreshUrl,
      returnUrl,
      expiresAt: accountLink.expires_at
    });

    return accountLink;
  } catch (error) {
    logger.error('Failed to create account link', {
      error: error.message,
      accountId: stripeAccountId
    });
    throw error;
  }
};

/**
 * Retrieve current Stripe Connect account status
 * @param {string} stripeAccountId - Stripe Connect account ID
 * @returns {Promise<Object>} Account object with current status
 */
export const getIntegratorConnectStatus = async (stripeAccountId) => {
  try {
    logger.info('Retrieving Stripe Connect account status', {
      accountId: stripeAccountId
    });

    const account = await stripe.accounts.retrieve(stripeAccountId);

    logger.info('Account status retrieved', {
      accountId: stripeAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });

    return account;
  } catch (error) {
    logger.error('Failed to retrieve account status', {
      error: error.message,
      accountId: stripeAccountId
    });
    throw error;
  }
};

/**
 * Map Stripe account object to database status enum
 * Determines the current onboarding status based on Stripe account state
 * @param {Object} stripeAccount - Stripe account object from API
 * @returns {string} Status enum value matching INTEGRATOR_CONNECT_STATUS
 */
export const mapStripeConnectStatus = (stripeAccount) => {
  try {
    // Account fully onboarded and verified
    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      return INTEGRATOR_CONNECT_STATUS.VERIFIED;
    }

    // Account restricted - cannot process charges
    if (stripeAccount.requirements?.pending_verification?.includes('individual.address')) {
      return INTEGRATOR_CONNECT_STATUS.RESTRICTED;
    }

    // Account has requirements that need to be completed
    if (stripeAccount.requirements?.currently_due?.length > 0) {
      return INTEGRATOR_CONNECT_STATUS.REQUIREMENTS_PENDING;
    }

    // Account was rejected during onboarding
    if (stripeAccount.future_requirements?.past_due?.length > 0) {
      return INTEGRATOR_CONNECT_STATUS.VERIFICATION_FAILED;
    }

    // Account in onboarding process
    if (!stripeAccount.charges_enabled || !stripeAccount.payouts_enabled) {
      return INTEGRATOR_CONNECT_STATUS.ONBOARDING_STARTED;
    }

    return INTEGRATOR_CONNECT_STATUS.NOT_STARTED;
  } catch (error) {
    logger.error('Error mapping Stripe Connect status', {
      error: error.message
    });
    return INTEGRATOR_CONNECT_STATUS.NOT_STARTED;
  }
};

/**
 * Delete a Stripe Connect account (reject onboarding)
 * Note: Can only be called while account is in onboarding
 * @param {string} stripeAccountId - Stripe Connect account ID
 * @returns {Promise<boolean>} Success status
 */
export const rejectIntegratorConnect = async (stripeAccountId) => {
  try {
    logger.info('Rejecting Stripe Connect onboarding', {
      accountId: stripeAccountId
    });

    // Stripe doesn't support direct deletion, but we can update metadata
    // to mark as rejected in our system
    await stripe.accounts.update(stripeAccountId, {
      metadata: {
        rejected_at: new Date().toISOString()
      }
    });

    logger.info('Account marked as rejected', {
      accountId: stripeAccountId
    });

    return true;
  } catch (error) {
    logger.error('Failed to reject account', {
      error: error.message,
      accountId: stripeAccountId
    });
    throw error;
  }
};

export default {
  createIntegratorExpressAccount,
  createIntegratorAccountLink,
  getIntegratorConnectStatus,
  mapStripeConnectStatus,
  rejectIntegratorConnect
};
