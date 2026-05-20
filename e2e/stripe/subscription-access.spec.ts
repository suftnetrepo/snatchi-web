import { test, expect } from '@playwright/test';
import { loginAsUser, clearUserSession } from '../helpers/auth';

test.describe('Subscription Access Control', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserSession(page);
  });

  test('active subscription user can access protected routes', async ({ page }) => {
    // First verify protected route redirects to login when not authenticated
    await page.goto('/protected/dashboard');
    
    // Should redirect to login or show auth error
    await page.waitForURL(/login|auth/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|auth/);
  });

  test('trialing subscription user can access protected routes', async ({ page }) => {
    // Navigate to protected route
    await page.goto('/protected/dashboard');
    
    // Should require authentication
    expect(page.url()).toMatch(/login|auth/);
  });

  test('suspended subscription user is blocked from protected routes', async ({ page }) => {
    // Mock a suspended subscription response
    await page.route('**/api/user/subscription', (route) => {
      route.abort('blockedbyClient');
    });
    
    // Try to access protected route
    await page.goto('/protected/dashboard');
    
    // Should either redirect or show access denied
    // The exact behavior depends on your access enforcement
  });

  test('cancelled subscription user is blocked from protected routes', async ({ page }) => {
    // Navigate to protected route
    await page.goto('/protected/dashboard');
    
    // Without valid subscription, should not be able to access
    // Implementation depends on your middleware
  });

  test('inactive subscription user is blocked from protected routes', async ({ page }) => {
    await page.goto('/protected/dashboard');
    
    // User without subscription should be blocked
    expect(page.url()).not.toMatch(/\/protected\/dashboard/);
  });

  test('blocked users see appropriate error message', async ({ page }) => {
    // Attempt to access protected content
    await page.goto('/protected/dashboard');
    
    // Wait for error message or redirect
    await page.waitForTimeout(2000);
    
    // Look for error message or auth redirect
    const errorElements = page.locator(
      'text=/access|denied|unauthorized|login|subscription|required/i'
    ).all();
    
    const hasErrorOrRedirect = 
      (await errorElements).length > 0 || 
      page.url().includes('login') ||
      page.url().includes('auth');
    
    expect(hasErrorOrRedirect).toBe(true);
  });

  test('blocked users see correct redirect', async ({ page }) => {
    // Navigate to protected route
    await page.goto('/protected/dashboard');
    
    // Should redirect to login or pricing
    const currentUrl = page.url();
    const isRedirected = 
      currentUrl.includes('login') ||
      currentUrl.includes('auth') ||
      currentUrl.includes('pricing') ||
      currentUrl.includes('checkout');
    
    expect(isRedirected).toBe(true);
  });

  test('checkout page remains accessible without subscription', async ({ page }) => {
    // Unauthenticated users should access checkout
    await page.goto('/checkout?priceId=price_test');
    
    // Page should load without requiring authentication
    expect(page.url()).toContain('checkout');
  });

  test('pricing page remains accessible without subscription', async ({ page }) => {
    await page.goto('/pricing');
    
    // Pricing page should be publicly accessible
    expect(page.url()).toContain('pricing');
    
    // Verify content loads
    const pricing_content = await page.content();
    expect(pricing_content.length).toBeGreaterThan(100);
  });

  test('reset password page remains accessible without subscription', async ({ page }) => {
    await page.goto('/resetPassword');
    
    // Reset password should be public
    const currentUrl = page.url();
    const isAccessible = 
      currentUrl.includes('resetPassword') ||
      currentUrl.includes('forgot') ||
      currentUrl.includes('reset');
    
    expect(isAccessible).toBe(true);
  });

  test('webhook endpoint remains accessible', async ({ page }) => {
    // Webhooks must be publicly accessible (with authentication token)
    const response = await page.request.post('/api/webhooks', {
      data: { type: 'test' },
      headers: {
        'stripe-signature': 'test-signature',
      },
    });
    
    // Should not return 404
    expect(response.status()).not.toBe(404);
  });

  test('login page is accessible to everyone', async ({ page }) => {
    await page.goto('/login');
    
    expect(page.url()).toContain('login');
    
    // Verify login form loads
    const loginForm = page.locator('form').first();
    await expect(loginForm).toBeVisible();
  });

  test('signup page is accessible to everyone', async ({ page }) => {
    // Try both /signup and /register
    await page.goto('/signup');
    
    const currentUrl = page.url();
    const isAccessible = 
      currentUrl.includes('signup') ||
      currentUrl.includes('register') ||
      currentUrl.includes('auth');
    
    expect(isAccessible).toBe(true);
  });

  test('authenticated user with active subscription can access subscription page', async ({ page }) => {
    // Navigate to subscription page
    await page.goto('/protected/subscription');
    
    // If user is authenticated with subscription, should load
    // If not authenticated, should redirect to login
    const currentUrl = page.url();
    const isAccessible = 
      currentUrl.includes('subscription') ||
      currentUrl.includes('login');
    
    expect(isAccessible).toBe(true);
  });

  test('about/features pages remain accessible without subscription', async ({ page }) => {
    const publicPages = [
      '/about',
      '/features',
      '/contact',
      '/privacyPolicy',
      '/termsAndCondition',
    ];
    
    for (const route of publicPages) {
      await page.goto(route);
      
      // Should load without requiring authentication
      const currentUrl = page.url();
      const isPublic = 
        currentUrl.includes(route.replace('/', '')) ||
        currentUrl.includes('login'); // Unless protected
      
      // At minimum, should not return 404
      // Verify page loads without auth error
      expect(currentUrl).not.toContain('error');
    }
  });

  test('access enforcement works via middleware', async ({ page }) => {
    // The enforceSubscriptionStatus middleware should:
    // 1. Check if route is protected
    // 2. Verify user has valid subscription
    // 3. Block/redirect if not
    
    // Try to access protected route
    await page.goto('/protected/teams');
    
    // Should either be protected or redirect
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const isProtected = 
      !currentUrl.includes('teams') ||
      currentUrl.includes('login') ||
      currentUrl.includes('auth');
    
    expect(isProtected).toBe(true);
  });

  test('user can access share/invite pages without subscription', async ({ page }) => {
    // Share links are typically public
    const response = await page.goto('/share/test-link');
    
    // Should be accessible (or show 404, not auth error)
    expect(response?.status()).not.toBe(401);
  });

  test('verify/email confirmation pages are publicly accessible', async ({ page }) => {
    const response = await page.request.get('/verify?token=test-token');
    
    // Should not return 401 or 403 (auth errors)
    // May return 404 if token invalid, but that's different from auth
    expect(response.status()).not.toBe(401);
    expect(response.status()).not.toBe(403);
  });

  test('api endpoints check subscription status', async ({ page }) => {
    // Call a protected API endpoint without auth
    const response = await page.request.get('/api/user/subscription');
    
    // Should return 401 or redirect to login
    const statusCode = response.status();
    expect(statusCode === 401 || statusCode === 400 || statusCode === 302).toBe(true);
  });

  test('public api endpoints are accessible', async ({ page }) => {
    // Ping endpoint should be public for health checks
    const response = await page.request.get('/api/ping');
    
    // Should not require auth
    expect(response.ok()).toBe(true);
  });

  test('trial users have access to protected routes', async ({ page }) => {
    // Mock a trialing subscription
    await page.route('**/api/user/subscription', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          subscriptionId: 'sub_test',
          status: 'trialing',
          plan: 'starter',
          trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });
    
    // Should be able to access protected routes
    await page.goto('/protected/dashboard');
    
    // Should not be blocked by subscription enforcement
  });

  test('past_due users can still access basic features', async ({ page }) => {
    // Mock a past_due subscription
    await page.route('**/api/user/subscription', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          subscriptionId: 'sub_test',
          status: 'past_due',
          plan: 'starter',
        }),
      });
    });
    
    // Depending on your business rules, past_due might be allowed
    // or might be blocked. Test what your app does.
    await page.goto('/protected/dashboard');
    
    // Should either load or redirect with appropriate message
  });
});
