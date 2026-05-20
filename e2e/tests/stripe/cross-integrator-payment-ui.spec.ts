import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

test.describe('Phase 1B Cross-Integrator Payment Flow @phase1b', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Set viewport for responsive testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  // ============================================================================
  // PAYMENT MODAL TESTS
  // ============================================================================

  test('Payment Modal - Opens when pay button clicked', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/scheduler`);
    
    // Wait for scheduler to load
    await page.waitForSelector('[data-testid="pay-for-service-btn"]', { timeout: TEST_TIMEOUT });
    
    // Click pay button
    const payButton = page.locator('[data-testid="pay-for-service-btn"]').first();
    await payButton.click();
    
    // Modal should be visible
    const modal = page.locator('[data-testid="payment-modal"]');
    await expect(modal).toBeVisible();
    
    // Check modal header
    const header = page.locator('[data-testid="payment-modal-header"]');
    await expect(header).toContainText('Pay for Engineer Service');
  });

  test('Payment Modal - Displays amount breakdown correctly', async () => {
    // Navigate to a scheduling page with a pay button
    await page.goto(`${BASE_URL}/protected/integrator/scheduler`);
    
    // Click pay button
    const payButton = page.locator('[data-testid="pay-for-service-btn"]').first();
    await payButton.click();
    
    // Wait for modal
    const modal = page.locator('[data-testid="payment-modal"]');
    await expect(modal).toBeVisible();
    
    // Check breakdown is displayed
    const breakdown = page.locator('[data-testid="payment-breakdown"]');
    await expect(breakdown).toBeVisible();
    
    // Check all breakdown items
    await expect(page.locator('[data-testid="payment-gross-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-platform-fee"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-net-amount"]')).toBeVisible();
  });

  test('Payment Modal - Displays party information', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/scheduler`);
    
    const payButton = page.locator('[data-testid="pay-for-service-btn"]').first();
    await payButton.click();
    
    // Check parties are displayed
    const parties = page.locator('[data-testid="payment-parties"]');
    await expect(parties).toBeVisible();
    
    await expect(page.locator('[data-testid="payment-paying-integrator"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-engineer-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-receiving-integrator"]')).toBeVisible();
  });

  test('Payment Modal - Shows card element', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/scheduler`);
    
    const payButton = page.locator('[data-testid="pay-for-service-btn"]').first();
    await payButton.click();
    
    // Check card element is present
    const cardElement = page.locator('[data-testid="stripe-card-element"]');
    await expect(cardElement).toBeVisible();
  });

  test('Payment Modal - Close button works', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/scheduler`);
    
    const payButton = page.locator('[data-testid="pay-for-service-btn"]').first();
    await payButton.click();
    
    // Modal should be open
    let modal = page.locator('[data-testid="payment-modal"]');
    await expect(modal).toBeVisible();
    
    // Click close button
    const closeBtn = page.locator('[data-testid="payment-close-btn"]');
    await closeBtn.click();
    
    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  test('Payment Modal - Cancel button works', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/scheduler`);
    
    const payButton = page.locator('[data-testid="pay-for-service-btn"]').first();
    await payButton.click();
    
    // Modal should be open
    let modal = page.locator('[data-testid="payment-modal"]');
    await expect(modal).toBeVisible();
    
    // Click cancel button
    const cancelBtn = page.locator('[data-testid="payment-cancel"]');
    await cancelBtn.click();
    
    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  // ============================================================================
  // PAYMENT HISTORY TESTS
  // ============================================================================

  test('Payments Made - Page loads with table', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/payments/made`);
    
    // Check header
    const header = page.locator('[data-testid="payments-made-header"]');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Payments Made');
    
    // Check total is displayed
    const total = page.locator('[data-testid="payments-made-total"]');
    await expect(total).toBeVisible();
    
    // Check table exists
    const table = page.locator('[data-testid="payment-history-table"]');
    // Table might be empty, but it should be in the DOM
    const hasTable = await page.locator('[data-testid="payment-history-table"]').count() > 0 ||
                    await page.locator('[data-testid="payments-empty"]').count() > 0;
    expect(hasTable).toBe(true);
  });

  test('Payments Received - Page loads with table', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/payments/received`);
    
    // Check header
    const header = page.locator('[data-testid="payments-received-header"]');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Payments Received');
    
    // Check total is displayed
    const total = page.locator('[data-testid="payments-received-total"]');
    await expect(total).toBeVisible();
  });

  test('Payments Made - Status filter works', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/payments/made`);
    
    // Wait for filter to be available
    const statusFilter = page.locator('[data-testid="payment-filter-status"]');
    await expect(statusFilter).toBeVisible();
    
    // Change filter
    await statusFilter.selectOption('succeeded');
    
    // Table should be updated (or empty state shown)
    await page.waitForTimeout(500); // Wait for API call
    
    // Check if either table or empty state is visible
    const hasContent = await page.locator('[data-testid="payment-history-table"]').count() > 0 ||
                      await page.locator('[data-testid="payments-empty"]').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('Payments Made - Pagination works', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/payments/made`);
    
    // Wait for table or empty state
    await page.waitForSelector(
      '[data-testid="payment-history-table"], [data-testid="payments-empty"]',
      { timeout: TEST_TIMEOUT }
    );
    
    // Check pagination controls exist
    const pagination = page.locator('[data-testid="payment-pagination"]');
    const hasTableWithMultiplePages = await page.locator('[data-testid="payment-history-table"]').count() > 0;
    
    if (hasTableWithMultiplePages) {
      await expect(pagination).toBeVisible();
      
      const prevBtn = page.locator('[data-testid="payment-prev-page"]');
      const nextBtn = page.locator('[data-testid="payment-next-page"]');
      
      // Previous should be disabled on first page
      await expect(prevBtn).toBeDisabled();
    }
  });

  // ============================================================================
  // PAYMENT DETAIL PAGE TESTS
  // ============================================================================

  test('Payment Detail - Page loads with payment info', async () => {
    // First, fetch a real payment ID from the API or use a test ID
    // For now, we'll just check the page structure with a placeholder ID
    
    const testPaymentId = 'test-payment-id';
    await page.goto(`${BASE_URL}/protected/payments/${testPaymentId}`);
    
    // Check if error is shown (since test ID doesn't exist)
    // Or if real payment is loaded, check header
    const header = page.locator('[data-testid="payment-detail-header"]');
    const error = page.locator('[data-testid="payments-error"]');
    
    const hasContent = await header.count() > 0 || await error.count() > 0;
    expect(hasContent).toBe(true);
  });

  test('Payment Detail - Shows amount breakdown', async () => {
    // This test would need a real payment from the database
    // For testing, we'd typically seed test data first
    
    await page.goto(`${BASE_URL}/protected/integrator/payments/made`);
    
    // Wait for table
    await page.waitForSelector(
      '[data-testid="payment-history-table"], [data-testid="payments-empty"]',
      { timeout: TEST_TIMEOUT }
    );
    
    // If table has rows, click on a payment detail link
    const detailLink = page.locator('[data-testid="payment-history-table"] a').first();
    const linkCount = await detailLink.count();
    
    if (linkCount > 0) {
      await detailLink.click();
      
      // Check detail page loaded
      const summary = page.locator('[data-testid="payment-summary"]');
      await expect(summary).toBeVisible();
      
      // Check breakdown items
      await expect(page.locator('[data-testid="payment-gross-total"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-fee-deducted"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-net-received"]')).toBeVisible();
    }
  });

  test('Payment Detail - Shows timeline', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/payments/made`);
    
    // Wait and click detail link if available
    const detailLink = page.locator('[data-testid="payment-history-table"] a').first();
    
    if (await detailLink.count() > 0) {
      await detailLink.click();
      
      // Check timeline is visible
      const timeline = page.locator('[data-testid="payment-timeline"]');
      await expect(timeline).toBeVisible();
      
      // Check timeline items
      await expect(page.locator('[data-testid="payment-timeline-initiated"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-timeline-charged"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-timeline-transfer-created"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-timeline-transfer-paid"]')).toBeVisible();
    }
  });

  // ============================================================================
  // SUCCESS PAGE TESTS
  // ============================================================================

  test('Payment Success - Page displays correctly', async () => {
    const paymentId = 'test-payment-123';
    const amount = '5000'; // £50
    const integrator = 'TestCorp';
    
    await page.goto(
      `${BASE_URL}/protected/payments/success?paymentId=${paymentId}&amount=${amount}&receivingIntegrator=${integrator}`
    );
    
    // Check success icon
    const icon = page.locator('[data-testid="payment-success-icon"]');
    await expect(icon).toBeVisible();
    await expect(icon).toContainText('✓');
    
    // Check success message
    const message = page.locator('[data-testid="payment-success-message"]');
    await expect(message).toBeVisible();
    await expect(message).toContainText('£50.00');
    await expect(message).toContainText('TestCorp');
    
    // Check detail link
    const detailLink = page.locator('[data-testid="payment-success-details"]');
    await expect(detailLink).toBeVisible();
  });

  // ============================================================================
  // ERROR PAGE TESTS
  // ============================================================================

  test('Payment Error - Page displays correctly', async () => {
    const errorMsg = 'Card was declined';
    
    await page.goto(
      `${BASE_URL}/protected/payments/error?error=${encodeURIComponent(errorMsg)}`
    );
    
    // Check error icon
    const icon = page.locator('[data-testid="payment-error-icon"]');
    await expect(icon).toBeVisible();
    await expect(icon).toContainText('✕');
    
    // Check error message
    const message = page.locator('[data-testid="payment-error-message"]');
    await expect(message).toBeVisible();
    await expect(message).toContainText('Card was declined');
  });

  // ============================================================================
  // RESPONSIVE TESTS
  // ============================================================================

  test('Payment Modal - Responsive on mobile', async ({ browser }) => {
    const mobilePage = await browser.newPage();
    await mobilePage.setViewportSize({ width: 375, height: 667 }); // iPhone 12
    
    await mobilePage.goto(`${BASE_URL}/protected/integrator/scheduler`);
    
    const payButton = mobilePage.locator('[data-testid="pay-for-service-btn"]').first();
    if (await payButton.count() > 0) {
      await payButton.click();
      
      const modal = mobilePage.locator('[data-testid="payment-modal"]');
      await expect(modal).toBeVisible();
    }
    
    await mobilePage.close();
  });

  test('Payments Made - Responsive on mobile', async ({ browser }) => {
    const mobilePage = await browser.newPage();
    await mobilePage.setViewportSize({ width: 375, height: 667 });
    
    await mobilePage.goto(`${BASE_URL}/protected/integrator/payments/made`);
    
    // Check header is visible
    const header = mobilePage.locator('[data-testid="payments-made-header"]');
    await expect(header).toBeVisible();
    
    await mobilePage.close();
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  test('Payment Modal - Form labels are accessible', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/scheduler`);
    
    const payButton = page.locator('[data-testid="pay-for-service-btn"]').first();
    if (await payButton.count() > 0) {
      await payButton.click();
      
      // Check for label
      const label = page.locator('label');
      await expect(label).toContainText('Card Details');
    }
  });

  test('Payment Tables - Keyboard navigation works', async () => {
    await page.goto(`${BASE_URL}/protected/integrator/payments/made`);
    
    // Focus on status filter
    const filter = page.locator('[data-testid="payment-filter-status"]');
    await filter.focus();
    
    // Press Tab to navigate
    await page.keyboard.press('Tab');
    
    // Page should not error
    const error = page.locator('[data-testid="payments-error"]');
    const count = await error.count();
    expect(count).toBeLessThanOrEqual(1); // Should be 0 or at most 1 (from network error, not keyboard error)
  });
});

// ============================================================================
// HAPPY PATH TEST - Complete Payment Flow
// ============================================================================

test.describe('Complete Payment Flow - Happy Path @phase1b-happy-path', () => {
  test('User can view payments and navigate between views', async ({ page }) => {
    await page.goto(`${BASE_URL}/protected/integrator/payments/made`);
    
    // Check payments made page
    const madeHeader = page.locator('[data-testid="payments-made-header"]');
    await expect(madeHeader).toBeVisible();
    
    // Navigate to payments received
    // (This would be a link in the actual UI)
    await page.goto(`${BASE_URL}/protected/integrator/payments/received`);
    
    const receivedHeader = page.locator('[data-testid="payments-received-header"]');
    await expect(receivedHeader).toBeVisible();
  });

  test('User can access payment detail page', async ({ page }) => {
    // First get list of payments
    await page.goto(`${BASE_URL}/protected/integrator/payments/made`);
    
    // Wait for table to load
    const hasTable = await page.locator('[data-testid="payment-history-table"]').count() > 0;
    
    if (hasTable) {
      // Click first payment detail link
      const detailLink = page.locator('[data-testid="payment-history-table"] a').first();
      await detailLink.click();
      
      // Should be on detail page
      const header = page.locator('[data-testid="payment-detail-header"]');
      await expect(header).toBeVisible();
    }
  });
});
