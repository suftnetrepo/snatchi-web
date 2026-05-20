import { NextResponse } from 'next/server';
import { mongoConnect } from '../../../utils/connectDb';
import Integrator from '../models/integrator';

mongoConnect();

/**
 * Wrapper to protect API routes by checking subscription status
 * Usage: 
 *   const handler = withSubscriptionCheck(async (req, res) => { ... })
 *   export { handler as POST };
 */
export function withSubscriptionCheck(handler) {
  return async (req) => {
    try {
      // Get integrator ID from query, body, or headers
      let integratorId = null;

      // Try to extract from query parameters
      if (req.nextUrl.searchParams) {
        integratorId = req.nextUrl.searchParams.get('integratorId');
      }

      // Try to extract from request body
      if (!integratorId && req.body) {
        try {
          const body = await req.json();
          integratorId = body.integratorId || body.integrator;
        } catch (e) {
          // Body might not be JSON
        }
      }

      // Try to extract from x-integrator-id header (for API clients)
      if (!integratorId) {
        integratorId = req.headers.get('x-integrator-id');
      }

      // If no integrator ID found, allow request to proceed
      // (might be handled by route-level authentication)
      if (!integratorId) {
        return handler(req);
      }

      // Check subscription status
      const integrator = await Integrator.findById(integratorId);

      if (!integrator) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Normalize status
      const status = (integrator.status || '').toLowerCase();

      // Check if subscription is active or trialing
      const activeStatuses = ['active', 'trialing'];
      const isSubscriptionActive = activeStatuses.includes(status);

      if (!isSubscriptionActive) {
        return NextResponse.json(
          {
            error: 'Subscription required',
            message: `Your subscription status is: ${status}. Please update your subscription to continue.`,
            subscriptionStatus: status
          },
          { status: 403 }
        );
      }

      // Subscription is active, proceed with handler
      return handler(req);
    } catch (error) {
      console.error('Subscription check error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to check subscription status from session/token
 * This should be called from route handlers after authentication
 */
export async function checkSubscriptionStatus(integratorId) {
  if (!integratorId) {
    return { isActive: false, reason: 'No integrator ID' };
  }

  try {
    const integrator = await Integrator.findById(integratorId);

    if (!integrator) {
      return { isActive: false, reason: 'Integrator not found' };
    }

    const status = (integrator.status || '').toLowerCase();
    const activeStatuses = ['active', 'trialing'];
    const isActive = activeStatuses.includes(status);

    return {
      isActive,
      status,
      integrator
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { isActive: false, reason: 'Error checking subscription' };
  }
}
