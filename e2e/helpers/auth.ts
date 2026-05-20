import { Page, expect } from '@playwright/test';

/**
 * Defensive helper to ensure page is ready for storage access
 * 
 * Playwright blocks localStorage/sessionStorage access on about:blank origin.
 * This helper navigates to the app's base URL if needed, ensuring we can
 * safely access browser storage APIs.
 * 
 * @param page - The Playwright page object
 * @param baseUrl - Optional base URL (defaults to process.env.PLAYWRIGHT_TEST_BASE_URL)
 */
export async function ensurePageReadyForStorage(page: Page, baseUrl?: string): Promise<void> {
  try {
    // Check current page URL
    const currentUrl = page.url();
    
    // If page is on about:blank or similar non-origin URLs, navigate to base URL
    if (!currentUrl || currentUrl === 'about:blank' || !currentUrl.startsWith('http')) {
      const url = baseUrl || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
      await page.goto(url);
      // Wait for page to be ready for DOM interactions
      await page.waitForLoadState('domcontentloaded');
    }
  } catch (error) {
    console.warn(`Warning: ensurePageReadyForStorage encountered an error: ${error}`);
    // Continue anyway - the page might still be usable for storage access
  }
}

/**
 * Helper to create a test user via signup API
 * Useful for creating users with specific subscription states
 */
export async function createTestUser(page: Page, email: string, password: string = 'TestPass123!') {
  const response = await page.request.post('/api/auth/register', {
    data: {
      email,
      password,
      name: 'Test User',
    },
  });
  
  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to create test user: ${response.status()} - ${text}`);
  }

  return {
    email,
    password,
  };
}

/**
 * Helper to log in as a test user
 */
export async function loginAsUser(page: Page, email: string, password: string = 'TestPass123!') {
  await page.goto('/login');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard or protected route
  await page.waitForURL(/\/(protected|dashboard|app)/, { timeout: 10000 });
}

/**
 * Helper to clear cookies and local storage for a test user
 * 
 * IMPORTANT: This helper safely clears authentication state without triggering
 * SecurityError from Playwright. It ensures the page is on a valid origin before
 * accessing storage APIs.
 * 
 * Flow:
 * 1. Clear cookies via context (safe - doesn't require valid origin)
 * 2. Ensure page is ready for storage access (navigate to base URL if on about:blank)
 * 3. Clear localStorage and sessionStorage via evaluate (now safe with valid origin)
 * 
 * @param page - The Playwright page object
 */
export async function clearUserSession(page: Page): Promise<void> {
  // Step 1: Clear cookies at context level (safe - doesn't require origin)
  try {
    await page.context().clearCookies();
  } catch (error) {
    console.warn(`Warning: Failed to clear cookies: ${error}`);
  }

  // Step 2: Ensure page is on a valid origin before accessing storage
  await ensurePageReadyForStorage(page);

  // Step 3: Clear browser storage (now safe with valid origin)
  try {
    // Clear localStorage
    await page.evaluate(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    });
  } catch (error) {
    console.warn(`Warning: Failed to clear localStorage: ${error}`);
  }

  try {
    // Clear sessionStorage
    await page.evaluate(() => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    });
  } catch (error) {
    console.warn(`Warning: Failed to clear sessionStorage: ${error}`);
  }
}

/**
 * Helper to get current auth session
 */
export async function getSession(page: Page) {
  const sessionCookie = (await page.context().cookies()).find((c) => c.name === 'next-auth.session-token');
  return sessionCookie;
}

/**
 * Helper to verify user is authenticated
 */
export async function expectUserAuthenticated(page: Page) {
  const session = await getSession(page);
  expect(session).toBeDefined();
}

/**
 * Helper to verify user is NOT authenticated
 */
export async function expectUserNotAuthenticated(page: Page) {
  const session = await getSession(page);
  expect(session).toBeUndefined();
}
