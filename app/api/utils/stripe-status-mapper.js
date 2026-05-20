/**
 * Map Stripe subscription statuses to Snatchi statuses
 * @param {string} stripeStatus - Status from Stripe (e.g., 'active', 'past_due')
 * @returns {string} Normalized status for MongoDB
 */
export function mapStripeStatusToSnatchi(stripeStatus) {
  const statusMap = {
    // Stripe -> Snatchi
    'active': 'active',           // Subscription is active and paid
    'trialing': 'trialing',       // In trial period - allowed
    'past_due': 'past_due',       // Payment overdue - restricted
    'unpaid': 'suspended',        // Unpaid - access suspended
    'incomplete': 'incomplete',   // Incomplete setup - restricted
    'incomplete_expired': 'suspended', // Expired incomplete - suspended
    'canceled': 'cancelled',      // Cancelled - access suspended
    'paused': 'suspended',        // Paused - access suspended (if applicable)
  };

  const normalized = (stripeStatus || '').toLowerCase().trim();
  return statusMap[normalized] || normalized; // Return mapped or original (normalized)
}

/**
 * Check if a subscription status allows access
 * @param {string} status - Subscription status
 * @returns {boolean} True if access should be allowed
 */
export function isSubscriptionStatusActive(status) {
  const activeStatuses = ['active', 'trialing'];
  const normalized = (status || '').toLowerCase();
  return activeStatuses.includes(normalized);
}

/**
 * Get a description of the subscription status for user communication
 * @param {string} status - Subscription status
 * @returns {string} User-friendly status message
 */
export function getStatusDescription(status) {
  const descriptions = {
    'active': 'Your subscription is active',
    'trialing': 'Your subscription is in trial period',
    'past_due': 'Your payment is overdue - please update your payment method',
    'suspended': 'Your subscription has been suspended - please update your payment method',
    'incomplete': 'Your subscription setup is incomplete - please complete the payment',
    'cancelled': 'Your subscription has been cancelled',
  };

  const normalized = (status || '').toLowerCase();
  return descriptions[normalized] || `Subscription status: ${status}`;
}
