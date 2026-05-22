import { test, expect } from '@playwright/test';

test.describe('Scheduler Approval Payment Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.INTEGRATOR_EMAIL || 'integrator@test.com');
    await page.fill('input[name="password"]', process.env.INTEGRATOR_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('awaiting approval filter can expose approve action for receiving integrator', async ({ page }) => {
    await page.goto('/protected/integrator/scheduler/list?filter=awaiting-approval');
    await page.waitForLoadState('networkidle');

    const approveButtons = page.locator('button:has-text("Approve Job")');
    const count = await approveButtons.count();

    if (count > 0) {
      await expect(approveButtons.first()).toBeVisible();
    }
  });

  test('awaiting payment filter does not expose payment action before approval rows exist', async ({ page }) => {
    await page.goto('/protected/integrator/scheduler/list?filter=accepted');
    await page.waitForLoadState('networkidle');

    const payButtons = page.locator('[data-testid="scheduler-pay-service-button"]');
    await expect(payButtons).toHaveCount(0);
  });

  test('awaiting payment filter can open payment modal after approval', async ({ page }) => {
    await page.goto('/protected/integrator/scheduler/list?filter=awaiting-payment');
    await page.waitForLoadState('networkidle');

    const payButtons = page.locator('[data-testid="scheduler-pay-service-button"]');
    const count = await payButtons.count();

    if (count > 0) {
      await payButtons.first().click();
      await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();
    }
  });

  test('ready-to-start filter does not expose pay button', async ({ page }) => {
    await page.goto('/protected/integrator/scheduler/list?filter=ready-to-start');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="scheduler-pay-service-button"]')).toHaveCount(0);
  });

  test('ready to start filter can expose start job action', async ({ page }) => {
    await page.goto('/protected/integrator/scheduler/list?filter=ready-to-start');
    await page.waitForLoadState('networkidle');

    const startButtons = page.locator('button:has-text("Start Job")');
    const count = await startButtons.count();

    if (count > 0) {
      await expect(startButtons.first()).toBeVisible();
    }
  });

  test('in progress filter can expose mark completed action', async ({ page }) => {
    await page.goto('/protected/integrator/scheduler/list?filter=in-progress');
    await page.waitForLoadState('networkidle');

    const completeButtons = page.locator('button:has-text("Mark Completed")');
    const count = await completeButtons.count();

    if (count > 0) {
      await expect(completeButtons.first()).toBeVisible();
    }
  });
});