import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import 'dotenv/config';

const RECOVERY_PATH = '/protected/integrator/billing-recovery';
const DASHBOARD_PATH = '/protected/integrator/dashboard';
const GUEST_DASHBOARD_PATH = '/protected/guest/dashboard';

type Role = 'integrator' | 'manager' | 'guest';

type EntitlementOverrides = {
  status?: string;
  role?: Role;
  hasAccess?: boolean;
  hasStripeCustomer?: boolean;
  isAdminSuspended?: boolean;
  suspensionReason?: string;
};

async function authenticate(context: BrowserContext, role: Role = 'integrator') {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET must be set to run subscription access tests');

  const token = await encode({
    secret,
    token: {
      id: '000000000000000000000001',
      email: `${role}@subscription-test.example`,
      role,
      integrator: '000000000000000000000002',
      first_name: 'Subscription',
      last_name: 'Tester'
    }
  });

  await context.addCookies([{
    name: 'next-auth.session-token',
    value: token,
    url: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3000',
    httpOnly: true,
    sameSite: 'Lax'
  }]);
}

async function mockEntitlement(page: Page, overrides: EntitlementOverrides = {}) {
  const data = {
    organisationName: 'Example AV Ltd',
    plan: 'Premium',
    status: 'expired',
    role: 'integrator' as Role,
    hasAccess: false,
    hasStripeCustomer: true,
    isAdminSuspended: false,
    suspensionReason: '',
    ...overrides
  };

  await page.route('**/api/stripe/entitlement', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data })
  }));
}

test.describe('Expired subscription login and recovery', () => {
  test.describe.configure({ mode: 'serial', timeout: 60_000 });

  test('unauthenticated entitlement requests are rejected', async ({ request }) => {
    const response = await request.get('/api/stripe/entitlement');

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  test('an expired integrator is redirected from the workspace to recovery', async ({ page, context }) => {
    await authenticate(context);
    await mockEntitlement(page);

    await page.goto(DASHBOARD_PATH);

    await expect(page).toHaveURL(new RegExp(`${RECOVERY_PATH}$`), { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Your subscription has expired' })).toBeVisible();
    await expect(page.getByText('Example AV Ltd')).toBeVisible();
    await expect(page.getByText('Premium', { exact: true })).toBeVisible();
    await expect(page.getByText('Expired', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Manage billing/i })).toBeVisible();

    await expect(page.locator('#sidebar')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Projects' })).toHaveCount(0);
  });

  test('Manage billing opens the Stripe portal returned by the server', async ({ page, context }) => {
    await authenticate(context, 'manager');
    await mockEntitlement(page, { role: 'manager', status: 'past_due' });

    let portalRequested = false;
    await page.route('**/api/stripe/customerPortal', async (route) => {
      portalRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: `${page.url().split('/protected')[0]}/billing-portal-test` })
      });
    });

    await page.goto(DASHBOARD_PATH);
    await expect(page.getByRole('heading', { name: 'Your payment is overdue' })).toBeVisible();
    await page.getByRole('button', { name: /Manage billing/i }).click();

    await expect.poll(() => portalRequested).toBe(true);
    await expect(page).toHaveURL(/\/billing-portal-test$/);
  });

  test('I have updated billing returns an active account to its dashboard', async ({ page, context }) => {
    await authenticate(context);

    let billingUpdated = false;
    await page.route('**/api/stripe/entitlement', (route) => {
      const hasAccess = billingUpdated;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            organisationName: 'Example AV Ltd',
            plan: 'Premium',
            status: hasAccess ? 'active' : 'expired',
            role: 'integrator',
            hasAccess,
            hasStripeCustomer: true,
            isAdminSuspended: false
          }
        })
      });
    });

    await page.goto(DASHBOARD_PATH);
    await expect(page).toHaveURL(new RegExp(`${RECOVERY_PATH}$`));
    billingUpdated = true;
    await page.getByRole('button', { name: /I’ve updated billing/i }).click();

    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_PATH}$`), { timeout: 15_000 });
    await expect(page.locator('#sidebar')).toBeVisible({ timeout: 15_000 });
  });

  test('an active account cannot remain on the recovery page', async ({ page, context }) => {
    await authenticate(context);
    await mockEntitlement(page, { status: 'active', hasAccess: true });

    await page.goto(RECOVERY_PATH);

    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_PATH}$`), { timeout: 15_000 });
    await expect(page.locator('#sidebar')).toBeVisible({ timeout: 15_000 });
  });

  test('a guest is blocked with an administrator contact action instead of billing access', async ({ page, context }) => {
    await authenticate(context, 'guest');
    await mockEntitlement(page, { role: 'guest' });

    await page.goto(GUEST_DASHBOARD_PATH);

    await expect(page).toHaveURL(new RegExp(`${RECOVERY_PATH}$`));
    await expect(page.getByRole('button', { name: /Contact your administrator/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Manage billing/i })).toHaveCount(0);
  });

  test('an administrative suspension shows its reason and does not offer billing recovery', async ({ page, context }) => {
    await authenticate(context);
    await mockEntitlement(page, {
      status: 'suspended',
      isAdminSuspended: true,
      suspensionReason: 'Please contact support to verify the organisation account.'
    });

    await page.goto(DASHBOARD_PATH);

    await expect(page.getByRole('heading', { name: 'Your organisation has been suspended' })).toBeVisible();
    await expect(page.getByText('Please contact support to verify the organisation account.')).toBeVisible();
    await expect(page.getByRole('button', { name: /Contact your administrator/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Manage billing/i })).toHaveCount(0);
  });

  test('a temporary entitlement failure can be retried', async ({ page, context }) => {
    await authenticate(context);

    let requests = 0;
    await page.route('**/api/stripe/entitlement', (route) => {
      requests += 1;
      if (requests === 1) {
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Subscription service is temporarily unavailable.' })
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            organisationName: 'Example AV Ltd',
            plan: 'Premium',
            status: 'active',
            role: 'integrator',
            hasAccess: true,
            hasStripeCustomer: true,
            isAdminSuspended: false
          }
        })
      });
    });

    await page.goto(DASHBOARD_PATH);
    await expect(page.getByRole('heading', { name: 'We couldn’t verify your subscription' })).toBeVisible();
    await expect(page.getByText('Subscription service is temporarily unavailable.')).toBeVisible();
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_PATH}$`));
  });
});
