import { expect, test } from '@playwright/test';

test.describe('Admin access control', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects an unauthenticated admin page request to login', async ({ page }) => {
    await page.goto('/protected/admin/dashboard');

    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fprotected%2Fadmin%2Fdashboard$/);
  });

  test('returns 401 JSON for an unauthenticated admin API request', async ({ request }) => {
    const response = await request.get('/api/admin/health');

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  test('rejects unauthenticated privileged mutations before parsing input', async ({ request }) => {
    const responses = await Promise.all([
      request.patch('/api/admin/organisations/000000000000000000000000/status', {
        data: { suspended: true, reason: 'Automated access-control verification' }
      }),
      request.post('/api/admin/payments/retry-transfer', {
        data: { paymentId: '000000000000000000000000', reason: 'Automated access-control verification' }
      })
    ]);

    for (const response of responses) expect(response.status()).toBe(401);
  });
});
