import { Page, expect } from '@playwright/test';

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
 */
export async function clearUserSession(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => sessionStorage.clear());
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
