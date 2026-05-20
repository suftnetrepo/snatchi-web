const dotenv = require('dotenv');
const { findPrice } = require('../../../src/data/pricing');
const { formatUnix } = require('../utils/date-format');
const { updateIntegratorStatus } = require('./integrator');
const { DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz, DATE_FORMAT_dd_MMM_YYYY } = require('../utils/date-constants');
const { sendBrevoEmail } = require('../../../lib/mail');
const { compileEmailTemplate } = require('../templates/compile-email-template');
const { logger } = require('../utils/logger');
import { emailTemplates } from '../../email';
import Stripe from 'stripe';
import { mapStripeStatusToSnatchi } from '../utils/stripe-status-mapper';
import { enrichSubscriptionWithTrialData, isInTrial, getDaysRemainingInTrial, formatTrialStatus } from '../utils/trial-period';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

dotenv.config();

const invoicePaymentSuccess = async (event) => {
  try {
    const { lines, hosted_invoice_url, amount_paid, period_end } = event.data.object;

    // Validate required fields
    if (!lines || !lines.data || lines.data.length === 0) {
      throw new Error('Invalid invoice data: missing lines array');
    }

    const invoice = lines.data[0];
    if (!invoice || !invoice.metadata) {
      throw new Error('Invalid invoice line: missing metadata');
    }

    const { contact, email, stripeCustomerId } = invoice.metadata;

    if (!stripeCustomerId) {
      throw new Error('Invalid invoice data: missing stripeCustomerId in metadata');
    }

    if (!email) {
      throw new Error('Invalid invoice data: missing email in metadata');
    }

    const amountPaidInDollars = amount_paid * 0.01;
    const periodEndFormatted = formatUnix(period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz);

    const html = await compileEmailTemplate(
      emailTemplates.invoicePaymentSuccess({
        hosted_invoice_url,
        email: email,
        amount_paid: amountPaidInDollars,
        periodEnd: periodEndFormatted,
        contact,
        contactEmail: process.env.CONTACT_EMAIL,
        contactMobile: process.env.CONTACT_MOBILE,
        team: process.env.TEAM
      })
    );

    // Update status to 'active' when payment succeeds
    const updated = await updateIntegratorStatus(stripeCustomerId, { status: 'active' });

    if (!updated) {
      throw new Error(`Failed to update integrator status for customer ${stripeCustomerId}`);
    }

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Invoice paid Successfully',
      textContent: html,
      htmlContent: html
    };

    await sendBrevoEmail(mailOptions);
    logger.info(`Invoice payment successful for ${stripeCustomerId}, status updated to 'active'`);
  } catch (error) {
    logger.error('Error in invoicePaymentSuccess handler:', error);
    throw error; // Re-throw so webhook handler can record failure
  }
};

const setDefaultPaymentMethod = async (event) => {
  try {
    if (event.data.object.billing_reason === 'subscription_create') {
      const subscription_id = event.data.object.subscription;
      const payment_intent_id = event.data.object.payment_intent;

      if (!subscription_id) {
        throw new Error('Missing subscription_id in invoice');
      }

      if (payment_intent_id != null) {
        const payment_intent = await stripe.paymentIntents.retrieve(payment_intent_id);
        
        if (!payment_intent) {
          throw new Error(`Payment intent not found: ${payment_intent_id}`);
        }

        if (!payment_intent.payment_method) {
          throw new Error('No payment method found in payment intent');
        }

        const updated = await stripe.subscriptions.update(subscription_id, {
          default_payment_method: payment_intent.payment_method
        });

        if (!updated) {
          throw new Error(`Failed to update subscription ${subscription_id}`);
        }

        logger.info(`Default payment method set for subscription ${subscription_id}`);
      }
    }
  } catch (error) {
    logger.error('Error in setDefaultPaymentMethod handler:', error);
    throw error; // Re-throw so webhook handler can record failure
  }
};

const invoicePaymentFailed = async (event) => {
  try {
    const { lines, hosted_invoice_url, period_end } = event.data.object;

    // Validate required fields
    if (!lines || !lines.data || lines.data.length === 0) {
      throw new Error('Invalid invoice data: missing lines array');
    }

    const invoice = lines.data[0];
    if (!invoice || !invoice.metadata) {
      throw new Error('Invalid invoice line: missing metadata');
    }

    const { contact, email, stripeCustomerId } = invoice.metadata;

    if (!stripeCustomerId) {
      throw new Error('Invalid invoice data: missing stripeCustomerId in metadata');
    }

    if (!email) {
      throw new Error('Invalid invoice data: missing email in metadata');
    }

    const html = await compileEmailTemplate(
      emailTemplates.invoicePaymentFailed({
        hosted_invoice_url,
        period_end: formatUnix(period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
        contact,
        team: process.env.TEAM
      })
    );

    // Update status to 'suspended' when payment fails
    const updated = await updateIntegratorStatus(stripeCustomerId, { status: 'suspended' });

    if (!updated) {
      throw new Error(`Failed to update integrator status for customer ${stripeCustomerId}`);
    }

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Invoice Payment Failed',
      textContent: html,
      htmlContent: html
    };

    await sendBrevoEmail(mailOptions);
    logger.info(`Invoice payment failed for ${stripeCustomerId}, status updated to 'suspended'`);
  } catch (error) {
    logger.error('Error in invoicePaymentFailed handler:', error);
    throw error; // Re-throw so webhook handler can record failure
  }
};

const trialWillEnd = async (event) => {
  try {
    const { metadata, current_period_end, trial_end } = event.data.object;

    // Validate required fields
    if (!metadata) {
      throw new Error('Missing metadata field in subscription object');
    }

    const { contact, email } = metadata;

    if (!email) {
      throw new Error('Missing email in metadata');
    }

    // Calculate days remaining in trial
    const daysRemaining = trial_end ? getDaysRemainingInTrial(trial_end) : 0;

    const html = await compileEmailTemplate(
      emailTemplates.trialWillEnd({
        periodEnd: formatUnix(current_period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
        daysRemaining: daysRemaining,
        contact,
        team: process.env.TEAM,
        renewalUrl: `${process.env.NEXTAUTH_URL}/checkout` // Link to renewal
      })
    );

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: `Your Trial Ends in ${daysRemaining} Days`,
      textContent: html,
      htmlContent: html
    };

    await sendBrevoEmail(mailOptions);
    logger.info(`Trial ending notification sent to ${email}, ${daysRemaining} days remaining`);
  } catch (error) {
    logger.error('Error in trialWillEnd handler:', error);
    throw error; // Re-throw so webhook handler can record failure
  }
};

const updateSubscription = async (event) => {
  try {
    const live = process.env.NODE_ENV === 'production';
    const { metadata, plan, current_period_end, current_period_start, id, status } = event.data.object;

    // Validate required fields with clear error messages
    if (!metadata) {
      throw new Error('Missing metadata field in subscription object');
    }

    const { email, contact, stripeCustomerId } = metadata;

    if (!stripeCustomerId) {
      throw new Error('Missing stripeCustomerId in metadata');
    }

    if (!plan || !plan.id) {
      throw new Error('Missing plan information in subscription');
    }

    const priceInfo = findPrice(plan.id, false);
    if (!priceInfo) {
      throw new Error(`Unknown price ID: ${plan.id}`);
    }

    const { price, billingCycle, planName } = priceInfo;

    // Map Stripe status to Snatchi status
    const mappedStatus = mapStripeStatusToSnatchi(status);

    const html = await compileEmailTemplate(
      emailTemplates.updateSubscription({
        contact,
        price,
        plan: planName,
        billingCycle,
        contactEmail: process.env.CONTACT_EMAIL,
        contactMobile: process.env.CONTACT_MOBILE,
        team: process.env.TEAM
      })
    );

    // Update all subscription fields safely
    const updateData = {
      plan: planName,
      startDate: formatUnix(current_period_start, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
      endDate: formatUnix(current_period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
      priceId: plan.id,
      status: mappedStatus, // Use mapped status
      subscriptionId: id,
      stripeCustomerId: stripeCustomerId
    };

    const updated = await updateIntegratorStatus(stripeCustomerId, updateData);

    if (!updated) {
      throw new Error(`Failed to update integrator for customer ${stripeCustomerId}`);
    }

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Subscription Update',
      textContent: html,
      htmlContent: html
    };

    // Send email only if subscription is active or trialing
    if (['active', 'trialing'].includes(mappedStatus)) {
      await sendBrevoEmail(mailOptions);
    }

    logger.info(`Successfully updated subscription for ${stripeCustomerId}: status=${mappedStatus}`);
  } catch (error) {
    logger.error('Error in updateSubscription handler:', error);
    throw error; // Re-throw so webhook handler can record failure
  }
};
const createSubscription = async (event) => {
  try {
    const live = process.env.NODE_ENV === 'production';
    const { metadata, plan, id, status, current_period_start, current_period_end, trial_start, trial_end } = event.data.object;

    // Validate required fields
    if (!metadata) {
      throw new Error('Missing metadata field in subscription object');
    }

    const { email, contact, stripeCustomerId } = metadata;

    if (!stripeCustomerId) {
      throw new Error('Missing stripeCustomerId in metadata');
    }

    if (!plan || !plan.id) {
      throw new Error('Missing plan information in subscription');
    }

    const priceInfo = findPrice(plan.id, false);
    if (!priceInfo) {
      throw new Error(`Unknown price ID: ${plan.id}`);
    }

    const { price, billingCycle, planName, duration } = priceInfo;

    // Map Stripe status to Snatchi status
    const mappedStatus = mapStripeStatusToSnatchi(status);

    const html = await compileEmailTemplate(
      emailTemplates.subscriptionWelcomeMessage({
        userName: email,
        contact,
        price,
        plan: planName,
        url: process.env.LOGIN_URL,
        billingCycle,
        contactEmail: process.env.CONTACT_EMAIL,
        team: process.env.TEAM,
        duration: duration,
        resetPasswordUrl: `${process.env.NEXTAUTH_URL}/reset-password`
      })
    );

    // Store all subscription details in integrator record
    const createData = {
      stripeCustomerId,
      subscriptionId: id,
      status: mappedStatus, // Use mapped status
      plan: planName,
      priceId: plan.id,
      startDate: current_period_start ? formatUnix(current_period_start, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz) : null,
      endDate: current_period_end ? formatUnix(current_period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz) : null,
      trial_start: trial_start ? formatUnix(trial_start, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz) : null,
      trial_end: trial_end ? formatUnix(trial_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz) : null
    };

    // Update integrator with subscription details
    const updated = await updateIntegratorStatus(stripeCustomerId, createData);

    if (!updated) {
      throw new Error(`Failed to create subscription record for customer ${stripeCustomerId}`);
    }

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Welcome to Snatchi',
      textContent: html,
      htmlContent: html
    };

    await sendBrevoEmail(mailOptions);
    logger.info(`Successfully created subscription for ${stripeCustomerId}: status=${mappedStatus}`);
  } catch (error) {
    logger.error('Error in createSubscription handler:', error);
    throw error; // Re-throw so webhook handler can record failure
  }
};
const cancelSubscription = async (event) => {
  try {
    const { metadata, current_period_end, current_period_start, id } = event.data.object;

    // Validate required fields
    if (!metadata) {
      throw new Error('Missing metadata field in subscription object');
    }

    const { contact, email, stripeCustomerId } = metadata;

    if (!stripeCustomerId) {
      throw new Error('Missing stripeCustomerId in metadata');
    }

    const html = await compileEmailTemplate(
      emailTemplates.subscriptionCancellation({
        contact,
        periodEnd: formatUnix(current_period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
        contactEmail: process.env.CONTACT_EMAIL,
        contactMobile: process.env.CONTACT_MOBILE,
        team: process.env.TEAM
      })
    );

    // Update integrator status to cancelled
    const updated = await updateIntegratorStatus(stripeCustomerId, {
      startDate: formatUnix(current_period_start, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
      endDate: formatUnix(current_period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
      status: 'cancelled', // Always 'cancelled' for canceled subscriptions
      subscriptionId: id
    });

    if (!updated) {
      throw new Error(`Failed to update integrator for customer ${stripeCustomerId}`);
    }

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Subscription Cancelled',
      textContent: html,
      htmlContent: html
    };

    await sendBrevoEmail(mailOptions);
    logger.info(`Successfully cancelled subscription for ${stripeCustomerId}`);
  } catch (error) {
    logger.error('Error in cancelSubscription handler:', error);
    throw error; // Re-throw so webhook handler can record failure
  }
};
const cancelTrial = async (event) => {
  try {
    const { metadata, current_period_end } = event.data.object;
    const { contact, email, stripeCustomerId } = metadata;

    const html = await compileEmailTemplate(
      emailTemplates.trialCancellation({
        contact,
        periodEnd: formatUnix(current_period_end, DATE_FORMAT_dd_MMM_YYYY),
        contactEmail: process.env.CONTACT_EMAIL,
        contactMobile: process.env.CONTACT_MOBILE,
        team: process.env.TEAM
      })
    );

    await updateIntegratorStatus(stripeCustomerId, {
      endDate: formatUnix(current_period_end, DATE_FORMAT_dd_MMM_YYYY),
      status: 'cancelled'
    });

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Trial Cancelled',
      textContent: html,
      htmlContent: html
    };

    await sendBrevoEmail(mailOptions);
  } catch (error) {
    logger.error(error);
  }
};

export {
  trialWillEnd,
  cancelTrial,
  cancelSubscription,
  createSubscription,
  updateSubscription,
  invoicePaymentFailed,
  setDefaultPaymentMethod,
  invoicePaymentSuccess
};
