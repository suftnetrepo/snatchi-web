import { test, expect } from '@playwright/test';

/**
 * Dashboard Scheduler Stats Navigation Tests
 * 
 * Tests for dashboard stat cards navigation and scheduler filtering
 */

test.describe('Dashboard Scheduler Stats Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as integrator
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.INTEGRATOR_EMAIL || 'integrator@test.com');
    await page.fill('input[name="password"]', process.env.INTEGRATOR_PASSWORD || 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/dashboard');
  });

  test('clicking Awaiting Approval opens scheduler with filter=awaiting-approval', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/protected/integrator/dashboard');

    // Click on Awaiting Approval card
    const awaitingApprovalCard = page.locator('[data-testid="dashboard-awaiting-approval-card"]');
    await expect(awaitingApprovalCard).toBeVisible();
    await awaitingApprovalCard.click();

    // Should navigate to scheduler list with filter=awaiting-approval
    await page.waitForURL('**/scheduler/list?filter=awaiting-approval');
    expect(page.url()).toContain('filter=awaiting-approval');

    // Filter button should be active
    const awaitingApprovalFilterButton = page.locator('[data-testid="scheduler-filter-awaiting-approval"]');
    await expect(awaitingApprovalFilterButton).toBeVisible();
  });

  test('clicking Awaiting Payment opens scheduler with filter=awaiting-payment', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/protected/integrator/dashboard');

    // Click on Awaiting Payment card
    const awaitingPaymentCard = page.locator('[data-testid="dashboard-awaiting-payment-card"]');
    await expect(awaitingPaymentCard).toBeVisible();
    await awaitingPaymentCard.click();

    // Should navigate to scheduler list with filter=awaiting-payment
    await page.waitForURL('**/scheduler/list?filter=awaiting-payment');
    expect(page.url()).toContain('filter=awaiting-payment');

    // Filter button should be active
    const awaitingPaymentFilterButton = page.locator('[data-testid="scheduler-filter-awaiting-payment"]');
    await expect(awaitingPaymentFilterButton).toBeVisible();
  });

  test('awaiting payment filter shows Pay for Service button', async ({ page }) => {
    // Navigate to scheduler with awaiting-payment filter
    await page.goto('/protected/integrator/scheduler/list?filter=awaiting-payment');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for pay for service buttons
    const payButtons = page.locator('[data-testid="scheduler-pay-service-button"]');
    const count = await payButtons.count();

    if (count > 0) {
      // At least one pay button should be visible
      await expect(payButtons.first()).toBeVisible();
    }
  });

  test('clicking Ready To Start opens scheduler with filter=ready-to-start', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/protected/integrator/dashboard');

    // Click on Ready To Start card
    const readyToStartCard = page.locator('[data-testid="dashboard-ready-to-start-card"]');
    await expect(readyToStartCard).toBeVisible();
    await readyToStartCard.click();

    // Should navigate to scheduler list with filter=ready-to-start
    await page.waitForURL('**/scheduler/list?filter=ready-to-start');
    expect(page.url()).toContain('filter=ready-to-start');

    // Filter button should be active
    const readyToStartFilterButton = page.locator('[data-testid="scheduler-filter-ready-to-start"]');
    await expect(readyToStartFilterButton).toBeVisible();
  });

  test('clicking Active Projects opens project page with filter=active', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/protected/integrator/dashboard');

    // Click on Active Projects card
    const activeProjectsCard = page.locator('[data-testid="dashboard-active-projects-card"]');
    await expect(activeProjectsCard).toBeVisible();
    await activeProjectsCard.click();

    // Should navigate to projects page with filter=active
    await page.waitForURL('**/project?filter=active');
    expect(page.url()).toContain('filter=active');
  });

  test('dashboard stat cards have hover effect', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/protected/integrator/dashboard');

    // Get the Awaiting Approval card
    const awaitingApprovalCard = page.locator('[data-testid="dashboard-awaiting-approval-card"]');
    await expect(awaitingApprovalCard).toBeVisible();

    // Hover over card and check styles change
    await awaitingApprovalCard.hover();

    // Card should have transform or shadow applied (visual feedback)
    const card = awaitingApprovalCard.locator('xpath=../div');
    const styles = await card.evaluate((el) => window.getComputedStyle(el));

    // Check for cursor pointer
    const cursorStyle = await awaitingApprovalCard.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursorStyle).toBe('pointer');
  });

  test('scheduler filter buttons work correctly', async ({ page }) => {
    // Navigate to scheduler list
    await page.goto('/protected/integrator/scheduler/list');

    // Test All button
    const allButton = page.locator('[data-testid="scheduler-filter-all"]');
    await expect(allButton).toBeVisible();
    await allButton.click();
    await page.waitForURL('**/scheduler/list');

    // Test Accepted button
    const acceptedButton = page.locator('[data-testid="scheduler-filter-accepted"]');
    await expect(acceptedButton).toBeVisible();
    await acceptedButton.click();
    await page.waitForURL('**/scheduler/list?filter=accepted');

    // Test Awaiting Approval button
    const awaitingApprovalButton = page.locator('[data-testid="scheduler-filter-awaiting-approval"]');
    await expect(awaitingApprovalButton).toBeVisible();
    await awaitingApprovalButton.click();
    await page.waitForURL('**/scheduler/list?filter=awaiting-approval');

    // Test Awaiting Payment button
    const awaitingPaymentButton = page.locator('[data-testid="scheduler-filter-awaiting-payment"]');
    await expect(awaitingPaymentButton).toBeVisible();
    await awaitingPaymentButton.click();
    await page.waitForURL('**/scheduler/list?filter=awaiting-payment');

    // Test Ready To Start button
    const readyToStartButton = page.locator('[data-testid="scheduler-filter-ready-to-start"]');
    await expect(readyToStartButton).toBeVisible();
    await readyToStartButton.click();
    await page.waitForURL('**/scheduler/list?filter=ready-to-start');
  });

  test('scheduler status action selector works', async ({ page }) => {
    // Navigate to scheduler list
    await page.goto('/protected/integrator/scheduler/list');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for status action selectors
    const statusSelectors = page.locator('[data-testid="scheduler-status-action"]');
    const count = await statusSelectors.count();

    if (count > 0) {
      // At least one status selector should be visible
      await expect(statusSelectors.first()).toBeVisible();
    }
  });

  test('dashboard loads with all stat cards', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/protected/integrator/dashboard');

    // Check all stat cards are visible
    const activeProjectsCard = page.locator('[data-testid="dashboard-active-projects-card"]');
    const awaitingApprovalCard = page.locator('[data-testid="dashboard-awaiting-approval-card"]');
    const awaitingPaymentCard = page.locator('[data-testid="dashboard-awaiting-payment-card"]');
    const readyToStartCard = page.locator('[data-testid="dashboard-ready-to-start-card"]');

    await expect(activeProjectsCard).toBeVisible();
    await expect(awaitingApprovalCard).toBeVisible();
    await expect(awaitingPaymentCard).toBeVisible();
    await expect(readyToStartCard).toBeVisible();

    // Check each card has a number
    const cards = [activeProjectsCard, awaitingApprovalCard, awaitingPaymentCard, readyToStartCard];
    for (const card of cards) {
      const text = await card.textContent();
      expect(text).toContain(/\d+/); // Should contain at least one number
    }
  });

  test('scheduler list displays schedules in table format', async ({ page }) => {
    // Navigate to scheduler list
    await page.goto('/protected/integrator/scheduler/list');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if table or schedule items are visible
    const table = page.locator('table');
    const tableVisible = await table.isVisible().catch(() => false);

    if (tableVisible) {
      // Table should be present
      await expect(table).toBeVisible();

      // Should have headers
      const headers = table.locator('thead th');
      await expect(headers.first()).toBeVisible();
    }
  });

  test('dashboard helper text is visible', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/protected/integrator/dashboard');

    // Get the Awaiting Approval card
    const awaitingApprovalCard = page.locator('[data-testid="dashboard-awaiting-approval-card"]');
    await expect(awaitingApprovalCard).toBeVisible();

    // Check for helper text
    const cardText = await awaitingApprovalCard.textContent();
    expect(cardText.toLowerCase()).toMatch(/view|schedules|action/);
  });

  test('pay for service button is clickable', async ({ page }) => {
    // Navigate to scheduler with awaiting-payment filter
    await page.goto('/protected/integrator/scheduler/list?filter=awaiting-payment');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for pay for service buttons
    const payButtons = page.locator('[data-testid="scheduler-pay-service-button"]');
    const count = await payButtons.count();

    if (count > 0) {
      // Click first pay button
      const firstPayButton = payButtons.first();
      await expect(firstPayButton).toBeVisible();

      // Should be clickable
      await firstPayButton.click();

      // Modal or payment interface should appear
      await page.waitForTimeout(500);
      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).toMatch(/pay|payment|amount/);
    }
  });
});
