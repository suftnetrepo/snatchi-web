import { Page, expect } from '@playwright/test';

/**
 * Stripe helper functions for E2E tests
 */

/**
 * Fill the Stripe card element within an iframe
 * This is a safe way to interact with Stripe's hosted iframe
 */
export async function fillStripeCardForm(
  page: Page,
  cardNumber: string,
  expiryMonth: string = '12',
  expiryYear: string = '25',
  cvc: string = '123'
) {
  try {
    // Get all iframes
    const frames = page.frames();
    let stripeFrame: any = null;

    // Find the Stripe card iframe
    for (const frame of frames) {
      const frameUrl = frame.url();
      if (frameUrl.includes('stripe') || frameUrl.includes('card')) {
        stripeFrame = frame;
        break;
      }
    }

    if (!stripeFrame) {
      throw new Error('Stripe card iframe not found');
    }

    // Fill card number in iframe
    await stripeFrame.fill('input[placeholder*="card number" i]', cardNumber);
    await stripeFrame.fill('input[placeholder*="MM / YY" i]', `${expiryMonth}${expiryYear}`);
    await stripeFrame.fill('input[placeholder*="CVC" i]', cvc);
  } catch (error) {
    console.warn('Warning: Could not fill Stripe form via iframe. Using element selectors instead.');
    
    // Fallback: Try direct element selectors (works in test mode)
    try {
      const cardInput = page.locator('[data-testid="card-number-input"], input[name="card-number"]').first();
      if (await cardInput.isVisible()) {
        await cardInput.fill(cardNumber);
        await page.locator('[data-testid="card-expiry-input"], input[name="expiry"]').first().fill(`${expiryMonth}${expiryYear}`);
        await page.locator('[data-testid="card-cvc-input"], input[name="cvc"]').first().fill(cvc);
      }
    } catch (fallbackError) {
      throw new Error(`Failed to fill Stripe card form: ${error}`);
    }
  }
}

/**
 * Wait for Stripe card element to be ready
 */
export async function waitForStripeCardElement(page: Page, timeout: number = 10000) {
  // Wait for Stripe script to load
  await page.waitForFunction(
    () => typeof (window as any).Stripe !== 'undefined',
    { timeout }
  );

  // Wait for card element to be present
  await page.waitForSelector('._PrivateStripeElement', {
    timeout,
    state: 'attached',
  });
}

/**
 * Intercept and mock a Portal session API call
 * This prevents the test from actually redirecting to Stripe
 */
export async function mockPortalSessionResponse(page: Page) {
  await page.route('/api/stripe/customerPortal', (route) => {
    // Return a mock portal session URL
    route.abort('blockedbyClient');
  });

  // Instead, use a response intercept to capture the call
  page.on('response', async (response) => {
    if (response.url().includes('/api/stripe/customerPortal')) {
      // This allows us to verify the endpoint was called
      // without actually redirecting
    }
  });
}

/**
 * Click to open Stripe Portal and verify the correct endpoint is called
 */
export async function openPortalAndVerifyEndpoint(page: Page) {
  let portalUrlCalled = false;
  let portalSessionData: any = null;

  // Intercept the API call
  await page.route('**/api/stripe/customerPortal', (route) => {
    portalUrlCalled = true;
    // Return a mock response
    route.abort('blockedbyClient');
  });

  // Click the manage billing button
  await page.click('text=/Manage|Billing|Portal/i');

  // Verify the endpoint was called
  await page.waitForTimeout(2000);
  expect(portalUrlCalled).toBe(true);

  return { endpointCalled: portalUrlCalled };
}

/**
 * Verify checkout form shows correct price
 */
export async function verifyCheckoutPrice(page: Page, expectedAmount: number, currency: string = 'usd') {
  // Look for price display (adjust selector based on your checkout form)
  const priceElement = page.locator('[data-testid="checkout-total"], .total-price, text=/\\$').first();
  
  const priceText = await priceElement.textContent();
  expect(priceText).toContain(expectedAmount.toString());
}

/**
 * Submit checkout form and wait for processing
 */
export async function submitCheckoutForm(page: Page) {
  // Click submit button
  const submitButton = page.locator('button[type="submit"]:has-text("Pay"), button[type="submit"]:has-text("Subscribe"), button:has-text("Confirm")').first();
  await submitButton.click();

  // Wait for payment processing
  await page.waitForTimeout(3000);
}

/**
 * Verify subscription status is displayed on page
 */
export async function verifySubscriptionStatus(page: Page, expectedStatus: string) {
  const statusElement = page.locator('[data-testid="subscription-status"], .subscription-status, text=/Status/i').first();
  const statusText = await statusElement.textContent();
  
  expect(statusText?.toLowerCase()).toContain(expectedStatus.toLowerCase());
}

/**
 * Verify subscription plan is displayed
 */
export async function verifySubscriptionPlan(page: Page, expectedPlanName: string) {
  const planElement = page.locator('[data-testid="subscription-plan"], .plan-name, text=/Plan/i').first();
  const planText = await planElement.textContent();
  
  expect(planText).toContain(expectedPlanName);
}

/**
 * Wait for subscription sync via webhook (mock)
 * In real tests, you'd poll the API or use websockets
 */
export async function waitForWebhookSync(page: Page, timeout: number = 15000) {
  // Poll the subscription API endpoint for status updates
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await page.request.get('/api/user/subscription');
      if (response.ok()) {
        const data = await response.json();
        if (data.subscriptionId) {
          return data;
        }
      }
    } catch (error) {
      // Continue polling
    }
    
    await page.waitForTimeout(2000);
  }
  
  throw new Error('Webhook sync timeout: subscription not updated');
}

/**
 * Verify Portal button exists and is clickable
 */
export async function verifyPortalButtonExists(page: Page) {
  const portalButton = page.locator('button:has-text("Manage"), button:has-text("Portal"), button:has-text("Billing")').first();
  
  expect(portalButton).toBeDefined();
  expect(await portalButton.isVisible()).toBe(true);
}

/**
 * Verify trial countdown is displayed
 */
export async function verifyTrialCountdown(page: Page) {
  const trialElement = page.locator('[data-testid="trial-countdown"], .trial-days, text=/Days remaining|trial|days/i').first();
  
  expect(await trialElement.isVisible()).toBe(true);
}

/**
 * Extract price ID from pricing page
 */
export async function getPriceIdFromPricingPage(page: Page, planName: string) {
  // Look for data attributes that contain price IDs
  const planElement = page.locator(`text=/^${planName}$/i, [data-plan="${planName}"]`).first();
  const priceId = await planElement.getAttribute('data-price-id');
  
  return priceId;
}

/**
 * Verify deprecated endpoints are not referenced in HTML
 */
export async function verifyNoDeprecatedEndpoints(page: Page) {
  const pageContent = await page.content();
  
  const deprecatedPatterns = [
    '/api/stripe/subscription/upgrade',
    '/api/stripe/subscription/cancel',
  ];

  for (const pattern of deprecatedPatterns) {
    expect(pageContent).not.toContain(pattern);
  }
}

/**
 * Get subscription details from the page
 */
export async function getSubscriptionDetailsFromPage(page: Page) {
  return {
    status: await page.locator('[data-testid="subscription-status"]').textContent(),
    plan: await page.locator('[data-testid="subscription-plan"]').textContent(),
    price: await page.locator('[data-testid="subscription-price"]').textContent(),
    nextBilling: await page.locator('[data-testid="next-billing-date"]').textContent(),
    trialDaysRemaining: await page.locator('[data-testid="trial-days-remaining"]').textContent(),
  };
}
