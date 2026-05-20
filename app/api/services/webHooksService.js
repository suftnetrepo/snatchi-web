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

/**
 * Handle Stripe Connect account.updated events
 * Updates integrator's Connect account status based on Stripe account state
 * Called when account onboarding progresses or requirements change
 */
const handleConnectAccountUpdated = async (event) => {
  try {
    const Integrator = require('../models/integrator').default || require('../models/integrator');
    const { mapStripeConnectStatus } = await import('../services/stripeConnectService');
    
    const account = event.data.object;
    const accountId = account.id;

    if (!accountId) {
      throw new Error('Missing account ID in Connect account update');
    }

    logger.info('Processing account.updated webhook', {
      accountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });

    // Find integrator by Connect account ID
    const integrator = await Integrator.findOne({ stripeConnectAccountId: accountId });

    if (!integrator) {
      logger.warn('Integrator not found for Connect account update', {
        accountId
      });
      // Still return success - don't want Stripe to retry
      return;
    }

    // Map Stripe status to our enum
    const mappedStatus = await mapStripeConnectStatus(account);

    // Update integrator Connect fields
    integrator.connectAccountStatus = mappedStatus;
    integrator.chargesEnabled = account.charges_enabled;
    integrator.payoutsEnabled = account.payouts_enabled;
    integrator.bankAccountOnFile = account.external_accounts?.data?.length > 0 || false;

    // Mark onboarding as completed if verified
    if (mappedStatus === 'verified' && !integrator.connectOnboardingCompletedAt) {
      integrator.connectOnboardingCompletedAt = new Date();
    }

    // Capture rejection or restriction reasons
    if (account.requirements?.past_due?.length > 0) {
      integrator.connectRejectReason = account.requirements.past_due.join(', ');
      integrator.connectAccountStatus = 'verification_failed';
    }

    if (account.requirements?.currently_due?.length > 0) {
      integrator.connectAccountStatus = 'requirements_pending';
    }

    // Save updated integrator
    await integrator.save();

    logger.info('Integrator Connect status updated successfully', {
      integratorId: integrator._id,
      accountId,
      status: integrator.connectAccountStatus,
      chargesEnabled: integrator.chargesEnabled,
      payoutsEnabled: integrator.payoutsEnabled
    });

    // TODO: Send email to integrator when status changes
    // (in Phase 2, add email notifications)

  } catch (error) {
    logger.error('Error handling Connect account update', {
      error: error.message,
      accountId: event.data.object?.id,
      stack: error.stack
    });
    throw error; // Re-throw so webhook handler can record failure
  }
};

/**
 * Handle payment_intent.succeeded webhook
 * Called when charge succeeds
 * Creates transfer to receiving integrator
 */
const handlePaymentIntentSucceeded = async (event) => {
  try {
    const Payment = require('../models/payment');
    const Scheduler = require('../models/scheduler');
    const { createTransferToReceivingIntegrator } = await import('../services/stripeMarketplaceService');

    const paymentIntent = event.data.object;
    const chargeId = paymentIntent.charges.data[0]?.id;

    if (!chargeId) {
      logger.warn('Payment intent succeeded but no charge found', {
        paymentIntentId: paymentIntent.id
      });
      return;
    }

    logger.info('Processing payment_intent.succeeded event', {
      paymentIntentId: paymentIntent.id,
      chargeId,
      amount: paymentIntent.amount
    });

    // Find payment in database
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });

    if (!payment) {
      logger.warn('Payment not found for succeeded intent', {
        paymentIntentId: paymentIntent.id
      });
      return;
    }

    // Update payment status
    payment.paymentStatus = 'succeeded';
    payment.chargeId = chargeId;
    payment.paymentSucceededAt = new Date();
    payment.transferStatus = 'pending';

    // Create transfer to receiving integrator
    try {
      const transfer = await createTransferToReceivingIntegrator({
        chargeId,
        receivingIntegratorConnectId: payment.receivingIntegrator.toString(),
        netAmount: payment.netAmount
      });

      payment.transferId = transfer.id;
      payment.transferStatus = 'created';
      payment.transferInitiatedAt = new Date();

      logger.info('Transfer created for succeeded payment', {
        paymentIntentId: paymentIntent.id,
        transferId: transfer.id,
        netAmount: payment.netAmount
      });
    } catch (transferError) {
      logger.error('Failed to create transfer for succeeded payment', {
        error: transferError.message,
        paymentIntentId: paymentIntent.id
      });
      // Don't throw - we want to mark payment as succeeded even if transfer fails initially
      // Transfer can be manually triggered later
    }

    await payment.save();

    // Update scheduler status
    if (payment.scheduler) {
      await Scheduler.findByIdAndUpdate(
        payment.scheduler,
        {
          paymentStatus: 'succeeded',
          paymentSucceededAt: new Date(),
          transferStatus: payment.transferStatus,
          transferId: payment.transferId,
          transferInitiatedAt: payment.transferInitiatedAt
        }
      );
    }

    logger.info('Payment marked as succeeded', {
      paymentId: payment._id,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    logger.error('Error handling payment_intent.succeeded', {
      error: error.message,
      paymentIntentId: event.data.object?.id,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Handle payment_intent.payment_failed webhook
 * Called when charge fails
 */
const handlePaymentIntentFailed = async (event) => {
  try {
    const Payment = require('../models/payment');
    const Scheduler = require('../models/scheduler');

    const paymentIntent = event.data.object;

    logger.info('Processing payment_intent.payment_failed event', {
      paymentIntentId: paymentIntent.id,
      lastPaymentError: paymentIntent.last_payment_error
    });

    // Find payment in database
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });

    if (!payment) {
      logger.warn('Payment not found for failed intent', {
        paymentIntentId: paymentIntent.id
      });
      return;
    }

    // Update payment with failure info
    payment.paymentStatus = 'failed';
    payment.chargeFailureCode = paymentIntent.last_payment_error?.code;
    payment.chargeFailureMessage = paymentIntent.last_payment_error?.message;
    payment.chargeFailureAttempts = (payment.chargeFailureAttempts || 0) + 1;
    payment.chargeLastFailureAt = new Date();
    payment.failedAt = new Date();

    await payment.save();

    // Update scheduler
    if (payment.scheduler) {
      await Scheduler.findByIdAndUpdate(
        payment.scheduler,
        {
          paymentStatus: 'failed',
          status: 'Declined' // Set booking back to declined
        }
      );
    }

    logger.info('Payment marked as failed', {
      paymentId: payment._id,
      failureCode: payment.chargeFailureCode,
      failureAttempts: payment.chargeFailureAttempts
    });

    // TODO: Send email to paying integrator about payment failure
  } catch (error) {
    logger.error('Error handling payment_intent.payment_failed', {
      error: error.message,
      paymentIntentId: event.data.object?.id,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Handle transfer.created webhook
 * Called when transfer is created
 */
const handleTransferCreated = async (event) => {
  try {
    const Payment = require('../models/payment');
    const transfer = event.data.object;

    logger.info('Processing transfer.created event', {
      transferId: transfer.id,
      destination: transfer.destination,
      amount: transfer.amount
    });

    // Find payment by transfer ID
    const payment = await Payment.findOne({ transferId: transfer.id });

    if (!payment) {
      logger.warn('Payment not found for created transfer', {
        transferId: transfer.id
      });
      return;
    }

    payment.transferStatus = 'in_transit';
    await payment.save();

    logger.info('Transfer status updated to in_transit', {
      paymentId: payment._id,
      transferId: transfer.id
    });
  } catch (error) {
    logger.error('Error handling transfer.created', {
      error: error.message,
      transferId: event.data.object?.id,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Handle transfer.paid webhook
 * Called when transfer is paid to receiving integrator
 */
const handleTransferPaid = async (event) => {
  try {
    const Payment = require('../models/payment');
    const Scheduler = require('../models/scheduler');
    const Integrator = require('../models/integrator');

    const transfer = event.data.object;

    logger.info('Processing transfer.paid event', {
      transferId: transfer.id,
      destination: transfer.destination,
      amount: transfer.amount
    });

    // Find payment by transfer ID
    const payment = await Payment.findOne({ transferId: transfer.id });

    if (!payment) {
      logger.warn('Payment not found for paid transfer', {
        transferId: transfer.id
      });
      return;
    }

    payment.transferStatus = 'paid';
    payment.transferPaidAt = new Date();
    await payment.save();

    // Update scheduler
    if (payment.scheduler) {
      await Scheduler.findByIdAndUpdate(
        payment.scheduler,
        {
          transferStatus: 'paid',
          transferPaidAt: new Date()
        }
      );
    }

    // Update receiving integrator totals
    const receivingIntegrator = await Integrator.findById(payment.receivingIntegrator);
    if (receivingIntegrator) {
      receivingIntegrator.totalPaymentsReceived = (receivingIntegrator.totalPaymentsReceived || 0) + 1;
      receivingIntegrator.totalAmountReceived = (receivingIntegrator.totalAmountReceived || 0) + payment.netAmount;
      await receivingIntegrator.save();
    }

    // Update paying integrator totals
    const payingIntegrator = await Integrator.findById(payment.payingIntegrator);
    if (payingIntegrator) {
      payingIntegrator.totalPaymentsMade = (payingIntegrator.totalPaymentsMade || 0) + 1;
      payingIntegrator.totalAmountPaid = (payingIntegrator.totalAmountPaid || 0) + payment.grossAmount;
      payingIntegrator.totalPlatformFeesDeducted = (payingIntegrator.totalPlatformFeesDeducted || 0) + payment.platformFeeAmount;
      await payingIntegrator.save();
    }

    logger.info('Transfer paid and integrator totals updated', {
      paymentId: payment._id,
      transferId: transfer.id,
      netAmount: payment.netAmount
    });

    // TODO: Send confirmation emails to both integrators
  } catch (error) {
    logger.error('Error handling transfer.paid', {
      error: error.message,
      transferId: event.data.object?.id,
      stack: error.stack
    });
    throw error;
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
  invoicePaymentSuccess,
  handleConnectAccountUpdated,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleTransferCreated,
  handleTransferPaid
};
