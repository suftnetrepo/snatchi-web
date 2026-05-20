import { NextResponse } from 'next/server';
import { logger } from '../../utils/logger';

// Simple in-memory rate limiter for checkout endpoint
// Key: customerId:endpoint, Value: { count, resetTime }
const rateLimitStore = new Map();

// Configuration
const RATE_LIMIT_CONFIG = {
  checkout: {
    maxAttempts: 5,        // Max 5 attempts
    windowMs: 60 * 60 * 1000  // Per 60 minutes (3600000ms)
  },
  checkoutFailed: {
    maxAttempts: 3,        // Max 3 failed attempts
    windowMs: 30 * 60 * 1000   // Per 30 minutes (1800000ms)
  }
};

/**
 * Check if request should be rate limited
 * Returns { allowed: boolean, remainingAttempts: number, resetTime: Date }
 */
export function checkRateLimit(customerId, endpoint = 'checkout', isFailed = false) {
  if (!customerId) {
    return {
      allowed: false,
      error: 'Missing customer ID',
      remainingAttempts: 0,
      resetTime: null
    };
  }

  const config = isFailed ? RATE_LIMIT_CONFIG.checkoutFailed : RATE_LIMIT_CONFIG.checkout;
  const key = `${customerId}:${endpoint}:${isFailed ? 'failed' : 'normal'}`;
  
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!record || now > record.resetTime) {
    const resetTime = new Date(now + config.windowMs);
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
      resetTime: resetTime
    };
  }

  // Window still active - check if limit exceeded
  if (record.count >= config.maxAttempts) {
    const resetTime = new Date(record.resetTime);
    return {
      allowed: false,
      error: `Too many ${isFailed ? 'failed' : ''} checkout attempts. Try again in ${Math.ceil((record.resetTime - now) / 60000)} minutes.`,
      remainingAttempts: 0,
      resetTime: resetTime
    };
  }

  // Increment and allow
  record.count += 1;
  const resetTime = new Date(record.resetTime);
  
  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - record.count,
    resetTime: resetTime
  };
}

/**
 * Record a failed checkout attempt
 * Increments failed attempt counter
 */
export function recordFailedCheckout(customerId, error) {
  const failedResult = checkRateLimit(customerId, 'checkout', true);
  
  logger.warn(`Failed checkout for customer ${customerId}: ${error}. Remaining attempts: ${failedResult.remainingAttempts}`);
  
  return failedResult;
}

/**
 * Clear rate limit for customer (on successful payment)
 */
export function clearRateLimit(customerId) {
  rateLimitStore.delete(`${customerId}:checkout:normal`);
  rateLimitStore.delete(`${customerId}:checkout:failed`);
  logger.info(`Rate limit cleared for customer ${customerId}`);
}

/**
 * Middleware function to apply rate limiting to requests
 * Usage: const result = rateLimitMiddleware(customerId, 'checkout');
 *        if (!result.allowed) return NextResponse.json(..., { status: 429 });
 */
export function rateLimitMiddleware(customerId, endpoint = 'checkout', isFailed = false) {
  const result = checkRateLimit(customerId, endpoint, isFailed);
  
  if (!result.allowed) {
    logger.warn(`Rate limit exceeded for ${customerId} on ${endpoint}`);
  }
  
  return result;
}

/**
 * Cleanup old entries periodically (run every hour)
 * This prevents memory leaks in the rate limiter
 */
export function cleanupExpiredLimits() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} expired rate limit records`);
  }
  
  return cleaned;
}

// Schedule cleanup every hour
if (typeof setInterval !== 'undefined') {
  // Only run in Node.js environment, not in browser
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  setInterval(cleanupExpiredLimits, CLEANUP_INTERVAL);
}

export const rateLimitConfig = RATE_LIMIT_CONFIG;
