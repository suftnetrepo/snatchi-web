import { NextResponse } from 'next/server';
import { mongoConnect } from '../../../utils/connectDb';
import Integrator from '../models/integrator';

mongoConnect();

/**
 * Middleware to enforce subscription status on protected routes
 * Usage in route handlers:
 *   const user = await getUserSession(req);
 *   const subscriptionCheck = await enforceSubscriptionStatus(user?.integrator);
 *   if (!subscriptionCheck.isActive) {
 *     return subscriptionCheck.response;
 *   }
 *   // Continue with route logic
 */
export async function enforceSubscriptionStatus(integratorId) {
  if (!integratorId) {
    return {
      isActive: false,
      response: NextResponse.json(
        { error: 'User not found', code: 'NO_USER' },
        { status: 401 }
      )
    };
  }

  try {
    const integrator = await Integrator.findById(integratorId);

    if (!integrator) {
      return {
        isActive: false,
        response: NextResponse.json(
          { error: 'Integrator not found', code: 'INTEGRATOR_NOT_FOUND' },
          { status: 404 }
        )
      };
    }

    // Normalize status to lowercase
    const status = (integrator.status || '').toLowerCase();
    
    // Active statuses: 'active' or 'trialing'
    const isActive = ['active', 'trialing'].includes(status);

    if (!isActive) {
      return {
        isActive: false,
        status,
        integrator,
        response: NextResponse.json(
          {
            error: 'Subscription required',
            message: `Your subscription status is: ${status}. Please update your subscription to continue.`,
            code: 'SUBSCRIPTION_INACTIVE',
            subscriptionStatus: status,
            upgradeUrl: '/checkout'
          },
          { status: 403 }
        )
      };
    }

    // Subscription is active
    return {
      isActive: true,
      status,
      integrator,
      response: null
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return {
      isActive: false,
      response: NextResponse.json(
        { error: 'Internal server error', code: 'SUBSCRIPTION_CHECK_ERROR' },
        { status: 500 }
      )
    };
  }
}

/**
 * Alternative: Higher-order function to wrap route handlers
 * Usage:
 *   const handler = requireSubscription(async (req, user) => {
 *     // route logic with guaranteed active subscription
 *   });
 *   export const GET = handler;
 *   export const POST = handler;
 */
export function requireSubscription(handler) {
  return async (req) => {
    try {
      const { getUserSession } = await import('@/utils/generateToken');
      const user = await getUserSession(req);

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'NO_AUTH' },
          { status: 401 }
        );
      }

      // Check subscription status
      const subscriptionCheck = await enforceSubscriptionStatus(user?.integrator);

      if (!subscriptionCheck.isActive) {
        return subscriptionCheck.response;
      }

      // User has active subscription, call handler
      return handler(req, user);
    } catch (error) {
      console.error('Subscription requirement check failed:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
