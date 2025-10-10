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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

dotenv.config();

const invoicePaymentSuccess = async (event) => {
  try {
    const { lines, hosted_invoice_url, amount_paid, period_end } = event.data.object;

    if (!lines || !lines.data[0] || !lines.data[0].metadata) {
      logger.error(new Error('Invalid invoice data'));
    }

    const { contact, email, stripeCustomerId } = lines.data[0].metadata;
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

    await updateIntegratorStatus(stripeCustomerId, { status: 'active' });

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Invoice paid Successfully',
      textContent: html,
      htmlContent: html
    };

    await sendBrevoEmail(mailOptions);
  } catch (error) {
    logger.error(error);
  }
};

const setDefaultPaymentMethod = async (event) => {
  try {
    if (event.data.object.billing_reason === 'subscription_create') {
      const subscription_id = event.data.object.subscription;
      const payment_intent_id = event.data.object.payment_intent;

      if (payment_intent_id != null) {
        const payment_intent = await stripe.paymentIntents.retrieve(payment_intent_id);
        await stripe.subscriptions.update(subscription_id, {
          default_payment_method: payment_intent.payment_method
        });
      }
    }
  } catch (error) {
    logger.error(error);
  }
};

const invoicePaymentFailed = async (event) => {
  try {
    const { lines, hosted_invoice_url, period_end } = event.data.object;
    if (!lines || !lines.data[0] || !lines.data[0].metadata) {
      logger.error(new Error('Invalid invoice data'));
    }

    const { contact, email, stripeCustomerId } = lines.data[0].metadata;

    const html = await compileEmailTemplate(
      emailTemplates.invoicePaymentFailed({
        hosted_invoice_url,
        period_end: formatUnix(period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
        contact,
        team: process.env.TEAM
      })
    );

    await updateIntegratorStatus(stripeCustomerId, { status: 'suspended' });

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Invoice Payment Failed',
      textContent: html,
      htmlContent: html
    };

    await sendBrevoEmail(mailOptions);
  } catch (error) {
    logger.error(error);
  }
};

const trialWillEnd = async (event) => {
  try {
    const { metadata, current_period_end } = event.data.object;
    const { contact, email } = metadata;

    const html = await compileEmailTemplate(
      emailTemplates.trialWillEnd({
        periodEnd: formatUnix(current_period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
        contact,
        team: process.env.TEAM
      })
    );

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Trial Will Soon End',
      textContent: html,
      htmlContent: html
    };

    await sendBrevoEmail(mailOptions);
  } catch (error) {
    logger.error(error);
  }
};

const updateSubscription = async (event) => {
  try {
    const live = process.env.NODE_ENV === 'production';
    const { metadata, plan, current_period_end, current_period_start, id, status } = event.data.object;
    const { email, contact, stripeCustomerId } = metadata;
    const { price, billingCycle, planName } = findPrice(plan.id, false);

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

    await updateIntegratorStatus(stripeCustomerId, {
      plan: planName,
      startDate: formatUnix(current_period_start, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
      endDate: formatUnix(current_period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
      priceId: plan?.id,
      status: status,
      subscriptionId: id
    });

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Subscription Update',
      textContent: html,
      htmlContent: html
    };

    if (status === 'active') {
      await sendBrevoEmail(mailOptions);
    }
  } catch (error) {
    logger.error(error);
  }
};
const createSubscription = async (event) => {
  try {
    const live = process.env.NODE_ENV === 'production';
    const { metadata, plan } = event.data.object;
    const { email, contact } = metadata;
    const { price, billingCycle, planName, duration } = findPrice(plan.id, false);

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
        password: '#12345!'
      })
    );

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Welcome to Snatchi',
      textContent: html,
      htmlContent: html
    };

    await sendBrevoEmail(mailOptions);
  } catch (error) {
    logger.error(error);
  }
};
const cancelSubscription = async (event) => {
  try {
    const { metadata, current_period_end, current_period_start } = event.data.object;
    const { contact, email, stripeCustomerId } = metadata;

    const html = await compileEmailTemplate(
      emailTemplates.subscriptionCancellation({
        contact,
        periodEnd: formatUnix(current_period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
        contactEmail: process.env.CONTACT_EMAIL,
        contactMobile: process.env.CONTACT_MOBILE,
        team: process.env.TEAM
      })
    );

    await updateIntegratorStatus(stripeCustomerId, {
      startDate: formatUnix(current_period_start, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
      endDate: formatUnix(current_period_end, DATE_FORMAT_DD_MM_YYYY_HH_mm_ss_sz),
      status: 'cancelled'
    });

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: email }],
      subject: 'Subscription Cancelled',
      textContent: html,
      htmlContent: html
    };

    await sendBrevoEmail(mailOptions);
  } catch (error) {
    logger.error(error);
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
