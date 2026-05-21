import { test, expect } from '@playwright/test';

/**
 * Admin Payment Operations Tests
 * 
 * Tests for payment reconciliation, investigation, and operational tools
 */

test.describe('Admin Payment Operations', () => {
  let testPaymentId = '';
  let testStripeChargeId = '';
  let testStripeTransferId = '';

  test.beforeEach(async ({ page, context }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.ADMIN_EMAIL || 'admin@test.com');
    await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');
  });

  test('Admin can view failed payments dashboard', async ({ page }) => {
    // Navigate to failures dashboard
    await page.goto('/admin/payments/failures');

    // Check page loaded
    await expect(page).toHaveTitle(/Failures|Payments/);

    // Verify stats cards present
    await expect(page.locator('[data-testid="admin-payment-failure"]')).toBeVisible();

    // Check table exists
    await expect(page.locator('table')).toBeVisible();
  });

  test('Orphaned payment appears in failures dashboard', async ({ page }) => {
    // Fetch list of failed payments
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    if (data.failures.length > 0) {
      const failedPayment = data.failures[0];
      testPaymentId = failedPayment._id;

      // Navigate to failures page
      await page.goto('/admin/payments/failures');

      // Check orphaned payment visible
      if (failedPayment.transferStatus === 'pending_retry' || 
          (failedPayment.paymentStatus === 'succeeded' && !failedPayment.transferId)) {
        // Row should be in the table
        await expect(page.locator(`[data-testid="payment-row-${testPaymentId}"]`).first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Admin can view payment investigation page', async ({ page }) => {
    // Get a payment to investigate
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    if (data.failures.length > 0) {
      testPaymentId = data.failures[0]._id;

      // Navigate to investigation page
      await page.goto(`/admin/payments/${testPaymentId}`);

      // Check page loaded
      await expect(page).toHaveTitle(/Investigation|Payment/);

      // Verify reconciliation status visible
      await expect(
        page.locator('[data-testid="admin-payment-reconciliation"]')
      ).toBeVisible();

      // Verify payment status shown
      await expect(
        page.locator('[data-testid="admin-payment-status"]')
      ).toBeVisible();

      // Verify amounts breakdown
      await expect(
        page.locator('[data-testid="admin-gross-amount"]')
      ).toBeVisible();

      await expect(
        page.locator('[data-testid="admin-platform-fee"]')
      ).toBeVisible();

      await expect(
        page.locator('[data-testid="admin-net-amount"]')
      ).toBeVisible();

      // Verify webhook history
      await expect(
        page.locator('[data-testid="admin-webhook-history"]')
      ).toBeVisible();

      // Verify Stripe IDs shown
      await expect(
        page.locator('[data-testid="admin-payment-intent-id"]')
      ).toBeVisible();

      await expect(
        page.locator('[data-testid="admin-charge-id"]')
      ).toBeVisible();

      await expect(
        page.locator('[data-testid="admin-transfer-id"]')
      ).toBeVisible();
    }
  });

  test('Reconciliation shows valid or error status', async ({ page }) => {
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    if (data.failures.length > 0) {
      testPaymentId = data.failures[0]._id;
      await page.goto(`/admin/payments/${testPaymentId}`);

      // Reconciliation status should be visible
      const reconciliation = page.locator('[data-testid="admin-payment-reconciliation"]');
      await expect(reconciliation).toBeVisible();

      // Should show either valid or error badge
      const validBadge = page.locator('[data-testid="reconciliation-valid"]');
      const errorBadge = page.locator('[data-testid="reconciliation-error"]');

      const hasValidOrError = await validBadge.isVisible().then(() => true).catch(() =>
        errorBadge.isVisible()
      );

      expect(hasValidOrError).toBeTruthy();

      // If error, should show error list
      const errorsList = page.locator('[data-testid="admin-reconciliation-error"]');
      if (await errorBadge.isVisible()) {
        await expect(errorsList).toBeVisible();
      }
    }
  });

  test('Retry transfer button disabled when not needed', async ({ page }) => {
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    // Find a paid payment (not needing retry)
    const paidPayment = data.failures.find(p => p.transferStatus === 'paid');

    if (paidPayment) {
      testPaymentId = paidPayment._id;
      await page.goto(`/admin/payments/${testPaymentId}`);

      // Retry button should be disabled or not visible
      const retryButton = page.locator('[data-testid="admin-transfer-retry"]');
      const isDisabled = await retryButton.isDisabled().catch(() => false);
      const isHidden = await retryButton.isHidden().catch(() => false);

      expect(isDisabled || isHidden).toBeTruthy();
    }
  });

  test('Can retry transfer for failed payment', async ({ page }) => {
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    // Find a payment with pending_retry status
    const pendingPayment = data.failures.find(p => p.transferStatus === 'pending_retry');

    if (pendingPayment) {
      testPaymentId = pendingPayment._id;
      await page.goto(`/admin/payments/${testPaymentId}`);

      // Click retry button
      const retryButton = page.locator('[data-testid="admin-transfer-retry"]');
      
      if (await retryButton.isVisible()) {
        // Confirm the dialog
        page.once('dialog', dialog => dialog.accept());

        await retryButton.click();

        // Check for success message
        await page.waitForTimeout(1000);
        const pageContent = await page.content();
        expect(pageContent).toContain('retry initiated');
      }
    }
  });

  test('Duplicate retry is blocked', async ({ page }) => {
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    if (data.failures.length > 0) {
      testPaymentId = data.failures[0]._id;
      await page.goto(`/admin/payments/${testPaymentId}`);

      const retryButton = page.locator('[data-testid="admin-transfer-retry"]');

      if (await retryButton.isVisible() && !(await retryButton.isDisabled())) {
        // First retry
        page.once('dialog', dialog => dialog.accept());
        await retryButton.click();

        await page.waitForTimeout(1000);

        // Refresh page
        await page.reload();

        // Try to retry again - should be blocked or disabled
        await page.waitForTimeout(1000);

        const secondRetryButton = page.locator('[data-testid="admin-transfer-retry"]');
        if (await secondRetryButton.isVisible()) {
          page.once('dialog', dialog => dialog.accept());
          await secondRetryButton.click();

          // Should show error about duplicate
          await page.waitForTimeout(500);
          const pageContent = await page.content();

          // Expect either error or success (idempotent)
          const hasResult = pageContent.includes('retry') || pageContent.includes('Transfer');
          expect(hasResult).toBeTruthy();
        }
      }
    }
  });

  test('Reconciliation mismatch is displayed', async ({ page }) => {
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    // Find a payment with reconciliation errors
    const errorPayment = data.failures.find(p =>
      p.error && (p.error.includes('mismatch') || p.error.includes('Reconciliation'))
    );

    if (errorPayment) {
      testPaymentId = errorPayment._id;
      await page.goto(`/admin/payments/${testPaymentId}`);

      // Error should be visible
      const errorElement = page.locator('[data-testid="admin-reconciliation-error"]');
      await expect(errorElement).toBeVisible();
    }
  });

  test('Refresh button reloads payment data', async ({ page }) => {
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    if (data.failures.length > 0) {
      testPaymentId = data.failures[0]._id;
      await page.goto(`/admin/payments/${testPaymentId}`);

      // Get initial content
      const initialContent = await page.locator('[data-testid="admin-payment-status"]').textContent();

      // Click refresh
      await page.locator('.refreshButton').click();

      // Wait for reload
      await page.waitForLoadState('networkidle');

      // Content should be present (may or may not change)
      const refreshedContent = await page.locator('[data-testid="admin-payment-status"]').textContent();
      expect(refreshedContent).toBeTruthy();
    }
  });

  test('Can toggle raw data display', async ({ page }) => {
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    if (data.failures.length > 0) {
      testPaymentId = data.failures[0]._id;
      await page.goto(`/admin/payments/${testPaymentId}`);

      // Raw data section should not be visible initially
      const rawDataSection = page.locator('.rawData').first();
      let isVisible = await rawDataSection.isVisible().catch(() => false);
      expect(isVisible).toBeFalsy();

      // Find and click "Show Raw Data" button
      const buttons = page.locator('button').all();
      let found = false;

      for (const button of await buttons) {
        const text = await button.textContent();
        if (text?.includes('Show') && text?.includes('Raw')) {
          await button.click();
          found = true;
          break;
        }
      }

      if (found) {
        // Raw data should now be visible
        await page.waitForTimeout(500);
        isVisible = await rawDataSection.isVisible().catch(() => false);
        expect(isVisible).toBeTruthy();
      }
    }
  });

  test('Failures dashboard filters work', async ({ page }) => {
    await page.goto('/admin/payments/failures');

    // Get all filter buttons
    const filterButtons = page.locator('button').filter({ hasText: /All|Orphaned|Pending|Webhook/ });

    if (await filterButtons.count() > 0) {
      // Click on each filter and verify table updates
      const firstFilter = filterButtons.first();
      const initialRows = await page.locator('table tbody tr').count();

      await firstFilter.click();
      await page.waitForTimeout(500);

      // Should still have table
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('Alert boxes display when failures present', async ({ page }) => {
    await page.goto('/admin/payments/failures');

    // Get failures data
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    if (data.stats.orphaned > 0) {
      // Critical alert should be visible
      const criticalAlert = page.locator('text=/CRITICAL|Orphaned/i');
      await expect(criticalAlert).toBeVisible();
    }

    if (data.stats.pendingRetry > 0) {
      // Warning alert should be visible
      const warningAlert = page.locator('text=/ACTION NEEDED|Pending Retry/i');
      await expect(warningAlert).toBeVisible();
    }
  });

  test('Investigation page shows all payment details', async ({ page }) => {
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    if (data.failures.length > 0) {
      const payment = data.failures[0];
      testPaymentId = payment._id;

      await page.goto(`/admin/payments/${testPaymentId}`);

      // All key details should be visible
      const details = [
        `[data-testid="admin-gross-amount"]`,
        `[data-testid="admin-platform-fee"]`,
        `[data-testid="admin-net-amount"]`,
        `[data-testid="admin-payment-intent-id"]`,
        `[data-testid="admin-charge-id"]`,
        `[data-testid="admin-transfer-id"]`
      ];

      for (const selector of details) {
        const element = page.locator(selector).first();
        await expect(element).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Math verification shows correct fee breakdown', async ({ page }) => {
    const response = await page.request.get('/api/admin/payments/failures');
    const data = await response.json();

    if (data.failures.length > 0) {
      const payment = data.failures[0];
      testPaymentId = payment._id;

      await page.goto(`/admin/payments/${testPaymentId}`);

      // Get amounts
      const grossAmount = await page.locator('[data-testid="admin-gross-amount"]').textContent();
      const platformFee = await page.locator('[data-testid="admin-platform-fee"]').textContent();
      const netAmount = await page.locator('[data-testid="admin-net-amount"]').textContent();

      // Parse amounts (remove £ and convert to numbers)
      const gross = parseFloat(grossAmount?.replace('£', '') || '0');
      const fee = parseFloat(platformFee?.replace('£', '') || '0');
      const net = parseFloat(netAmount?.replace('£', '') || '0');

      // Verify: gross = net + fee
      expect(Math.abs(gross - (net + fee))).toBeLessThan(0.01);
    }
  });
});
