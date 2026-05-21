import { logger } from '../utils/logger';
import { pricingList } from '../../../src/data/pricing';

/**
 * Trial period configuration
 * Define trial days for each plan
 */
const TRIAL_CONFIG = {
  'Basic Plan': {
    trialDays: 7,           // 7-day trial
    autoTransitionToPaid: true,
    sendReminderDaysBefore: 2
  },
  'Premium': {
    trialDays: 14,          // 14-day trial
    autoTransitionToPaid: true,
    sendReminderDaysBefore: 3
  },
  'Enterprise': {
    trialDays: 30,          // 30-day trial
    autoTransitionToPaid: true,
    sendReminderDaysBefore: 5
  }
};

/**
 * Get trial configuration for a plan
 */
export function getTrialConfig(planName) {
  return TRIAL_CONFIG[planName] || {
    trialDays: 0,
    autoTransitionToPaid: false,
    sendReminderDaysBefore: 0
  };
}

/**
 * Calculate trial end date
 * @param trialDays Number of days for trial
 * @returns {Date} Date when trial ends
 */
export function calculateTrialEndDate(trialDays) {
  if (trialDays <= 0) return null;
  
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + trialDays);
  return trialEnd;
}

/**
 * Check if subscription is in trial
 * @param trialStart Trial start date
 * @param trialEnd Trial end date
 * @returns {boolean} True if currently in trial
 */
export function isInTrial(trialStart, trialEnd) {
  if (!trialStart || !trialEnd) return false;
  
  const now = new Date();
  return now >= new Date(trialStart) && now < new Date(trialEnd);
}

/**
 * Check if trial is ending soon
 * @param trialEnd Trial end date
 * @param daysThreshold Days before trial end to consider "ending soon"
 * @returns {boolean} True if trial ends within threshold days
 */
export function isTrialEndingSoon(trialEnd, daysThreshold = 2) {
  if (!trialEnd) return false;
  
  const now = new Date();
  const trialEndDate = new Date(trialEnd);
  const daysUntilEnd = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
  
  return daysUntilEnd > 0 && daysUntilEnd <= daysThreshold;
}

/**
 * Check if trial has ended
 * @param trialEnd Trial end date
 * @returns {boolean} True if trial has ended
 */
export function hasTrialEnded(trialEnd) {
  if (!trialEnd) return false;
  
  const now = new Date();
  return now >= new Date(trialEnd);
}

/**
 * Get days remaining in trial
 * @param trialEnd Trial end date
 * @returns {number} Days remaining (0 if ended or invalid)
 */
export function getDaysRemainingInTrial(trialEnd) {
  if (!trialEnd) return 0;
  
  const now = new Date();
  const trialEndDate = new Date(trialEnd);
  const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysRemaining);
}

/**
 * Determine subscription status including trial state
 * @param status Stripe subscription status
 * @param trialStart Trial start date
 * @param trialEnd Trial end date
 * @returns {object} { status, isTrialStatus, daysRemaining }
 */
export function getSubscriptionStatusWithTrial(status, trialStart, trialEnd) {
  const inTrial = isInTrial(trialStart, trialEnd);
  const daysRemaining = getDaysRemainingInTrial(trialEnd);
  
  return {
    status: status,
    isTrialStatus: inTrial,
    trialActive: inTrial,
    daysRemainingInTrial: daysRemaining,
    trialEnded: hasTrialEnded(trialEnd)
  };
}

/**
 * Format trial status for user display
 * @param status Subscription status
 * @param trialStart Trial start date
 * @param trialEnd Trial end date
 * @returns {string} Human-readable trial status
 */
export function formatTrialStatus(status, trialStart, trialEnd) {
  const inTrial = isInTrial(trialStart, trialEnd);
  const daysRemaining = getDaysRemainingInTrial(trialEnd);
  
  if (!inTrial && !hasTrialEnded(trialEnd)) {
    return `Subscription ${status}`;
  }
  
  if (inTrial) {
    if (daysRemaining === 1) {
      return 'Trial ending tomorrow';
    } else if (daysRemaining > 0) {
      return `Trial: ${daysRemaining} days remaining`;
    }
  }
  
  if (hasTrialEnded(trialEnd)) {
    return `Trial ended - Subscription ${status}`;
  }
  
  return `Subscription ${status}`;
}

/**
 * Create subscription with trial period
 * Used in webhook handlers when creating new subscription
 * @param subscriptionData Stripe subscription data
 * @returns {object} Updated subscription data with trial info
 */
export function enrichSubscriptionWithTrialData(subscriptionData) {
  if (!subscriptionData || !subscriptionData.plan) {
    return subscriptionData;
  }
  
  const planName = subscriptionData.plan;
  const trialConfig = getTrialConfig(planName);
  
  // Preserve existing trial dates if already set
  if (subscriptionData.trial_start && subscriptionData.trial_end) {
    return subscriptionData;
  }
  
  // Add trial dates if trial is configured for this plan
  if (trialConfig.trialDays > 0) {
    const trialStart = new Date();
    const trialEnd = calculateTrialEndDate(trialConfig.trialDays);
    
    return {
      ...subscriptionData,
      trial_start: trialStart,
      trial_end: trialEnd
    };
  }
  
  return subscriptionData;
}

/**
 * Check if subscription should auto-transition from trial to paid
 * @param planName Plan name
 * @returns {boolean} True if auto-transition is enabled for this plan
 */
export function shouldAutoTransitionToPaid(planName) {
  const config = getTrialConfig(planName);
  return config.autoTransitionToPaid;
}

/**
 * Get days before trial end to send reminder
 * @param planName Plan name
 * @returns {number} Days before trial end
 */
export function getDaysBeforeTrialEndReminder(planName) {
  const config = getTrialConfig(planName);
  return config.sendReminderDaysBefore;
}

/**
 * Validate trial dates consistency
 * @param trialStart Trial start date
 * @param trialEnd Trial end date
 * @returns {object} { valid: boolean, error: string }
 */
export function validateTrialDates(trialStart, trialEnd) {
  if (!trialStart || !trialEnd) {
    return { valid: true }; // No trial set is valid
  }
  
  const start = new Date(trialStart);
  const end = new Date(trialEnd);
  
  if (start >= end) {
    return {
      valid: false,
      error: 'Trial start date must be before trial end date'
    };
  }
  
  // Check if trial is in the future or within reasonable past
  const now = new Date();
  const daysSinceStart = (now - start) / (1000 * 60 * 60 * 24);
  
  if (daysSinceStart > 365) {
    return {
      valid: false,
      error: 'Trial started more than a year ago'
    };
  }
  
  return { valid: true };
}

export default {
  getTrialConfig,
  calculateTrialEndDate,
  isInTrial,
  isTrialEndingSoon,
  hasTrialEnded,
  getDaysRemainingInTrial,
  getSubscriptionStatusWithTrial,
  formatTrialStatus,
  enrichSubscriptionWithTrialData,
  shouldAutoTransitionToPaid,
  getDaysBeforeTrialEndReminder,
  validateTrialDates,
  TRIAL_CONFIG
};
