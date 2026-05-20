import { mongoConnect } from '../../../utils/connectDb';
import Integrator from '../models/integrator';

mongoConnect();

/**
 * Check if a user's subscription is active
 * @param {string} userId - MongoDB user ID
 * @returns {object} { isActive: boolean, status: string, integrator: object }
 */
export async function isSubscriptionActive(userId) {
  try {
    const integrator = await Integrator.findOne({ _id: userId });
    
    if (!integrator) {
      return { isActive: false, status: 'not_found', integrator: null };
    }

    // Normalize status to lowercase
    const status = (integrator.status || '').toLowerCase();
    
    // Active statuses: 'active' or 'trialing'
    const isActive = ['active', 'trialing'].includes(status);
    
    return {
      isActive,
      status,
      integrator,
      message: isActive ? 'Subscription is active' : `Subscription status: ${status}`
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { isActive: false, status: 'error', integrator: null };
  }
}

/**
 * List of routes that bypass subscription check
 */
export const SUBSCRIPTION_EXEMPT_ROUTES = [
  '/api/auth',
  '/api/webhooks',
  '/api/stripe/customer',
  '/api/stripe/subscriber',
  '/api/stripe/customerPortal',
  '/api/subscriber',
  '/login',
  '/register',
  '/checkout',
  '/pricing',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/contact'
];

/**
 * Check if a route should bypass subscription enforcement
 */
export function isExemptFromSubscriptionCheck(pathname) {
  return SUBSCRIPTION_EXEMPT_ROUTES.some(exemptRoute => 
    pathname.startsWith(exemptRoute)
  );
}

/**
 * Normalize subscription status to lowercase
 */
export function normalizeSubscriptionStatus(status) {
  return (status || '').toLowerCase();
}
