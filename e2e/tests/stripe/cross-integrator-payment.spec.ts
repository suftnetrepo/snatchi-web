/**
 * Playwright E2E Tests: Cross-Integrator Payments (Phase 1B)
 * 
 * Test Coverage:
 * - Happy path: Payment creation, confirmation, and transfer
 * - Failure cases: Invalid inputs, authorization, verification
 * - Payment history: Access control and data accuracy
 * - Security: Self-payment prevention, unauthorized access
 * 
 * Dependencies:
 * - npm run test:e2e -- --grep "@phase1b"
 * - Requires local Stripe test credentials
 * - Requires seeded test data (integrators, engineers, bookings)
 */

import { test, expect, Page } from '@playwright/test';

// Test fixtures
const STRIPE_TEST_CARD = '4242424242424242';
const STRIPE_TEST_CARD_DECLINED = '4000000000000002';
const STRIPE_TEST_EXPIRY = '12/25';
const STRIPE_TEST_CVC = '123';

/**
 * HAPPY PATH: Complete payment flow
 */
test.describe('@phase1b Happy Path', () => {
  let paymentIntentId: string;
  let paymentId: string;

  test('should create payment intent with valid data', async ({ page }) => {
    // Login as Integrator A (paying party)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'techcorp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/protected/integrator/**');

    // Navigate to booking from Integrator B's engineer
    await page.goto('/protected/integrator/projects/engineers');
    
    // Find booking for Engineer John (owned by Integrator B)
    await page.click('button:has-text("Book Engineer")');
    const bookingId = await page.getAttribute('[data-testid="booking-id"]', 'data-value');

    // Request payment
    await page.click('button[data-testid="pay-engineer-btn"]');
    await page.waitForSelector('[data-testid="payment-modal"]');

    // Verify payment breakdown
    const grossAmount = await page.textContent('[data-testid="payment-gross-amount"]');
    const platformFee = await page.textContent('[data-testid="payment-platform-fee"]');
    const netAmount = await page.textContent('[data-testid="payment-net-amount"]');

    expect(grossAmount).toContain('£500');
    expect(platformFee).toContain('£50'); // 10% fee
    expect(netAmount).toContain('£450');

    // Verify parties
    await expect(page.locator('[data-testid="payment-paying-integrator"]')).toContainText('TechCorp');
    await expect(page.locator('[data-testid="payment-receiving-integrator"]')).toContainText('EngineerCo');
    await expect(page.locator('[data-testid="payment-engineer-name"]')).toContainText('John Doe');

    // Get payment intent ID from API call
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/stripe/payment/create-intent') && response.status() === 200
    );

    // Submit payment form
    await page.click('button[data-testid="payment-submit"]');
    const apiResponse = await responsePromise;
    const apiData = await apiResponse.json();

    paymentIntentId = apiData.paymentIntentId;
    expect(paymentIntentId).toBeTruthy();
    expect(apiData.paymentStatus).toBe('pending');
  });

  test('should complete Stripe payment confirmation', async ({ page }) => {
    // Simulate Stripe iframe interaction (mocked in test environment)
    // In real environment, this would be handled by Stripe Elements

    // Confirm payment by polling status endpoint
    const statusResponse = await page.request.get(
      `/api/stripe/payment/status?paymentIntentId=${paymentIntentId}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    expect(statusResponse.ok()).toBeTruthy();
    const statusData = await statusResponse.json();

    // After webhook processing, should be succeeded
    expect(statusData.paymentStatus).toBe('succeeded');
    expect(statusData.transferStatus).toBe('paid');
    paymentId = statusData.paymentId;
  });

  test('should display payment in both integrators payment history', async ({ page }) => {
    // Check paying integrator's payment history
    await page.goto('/protected/integrator/payments/made');
    await page.waitForSelector('[data-testid="payment-history-table"]');

    const paymentRow = await page.locator(
      `[data-testid="payment-row-${paymentId}"]`
    );
    await expect(paymentRow).toBeVisible();
    await expect(paymentRow).toContainText('John Doe');
    await expect(paymentRow).toContainText('£500.00');
    await expect(paymentRow).toContainText('succeeded');

    // Logout and login as receiving integrator
    await page.click('[data-testid="logout-btn"]');
    await page.goto('/login');
    await page.fill('input[name="email"]', 'engineerco@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check receiving integrator's payment history
    await page.goto('/protected/integrator/payments/received');
    await page.waitForSelector('[data-testid="payment-history-table"]');

    const receivedPaymentRow = await page.locator(
      `[data-testid="payment-row-${paymentId}"]`
    );
    await expect(receivedPaymentRow).toBeVisible();
    await expect(receivedPaymentRow).toContainText('John Doe');
    await expect(receivedPaymentRow).toContainText('TechCorp');
    await expect(receivedPaymentRow).toContainText('£450.00'); // Net amount received
  });
});

/**
 * SECURITY: Failure cases and access control
 */
test.describe('@phase1b Security & Error Cases', () => {
  test('should return 401 for unauthenticated user', async ({ page }) => {
    const response = await page.request.post('/api/stripe/payment/create-intent', {
      data: {
        schedulerId: 'test-id',
        amount: 50000
      }
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('should prevent engineer from creating payment', async ({ page }) => {
    // Login as engineer (not integrator)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'engineer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Try to access payment creation
    const response = await page.request.post('/api/stripe/payment/create-intent', {
      data: {
        schedulerId: 'test-booking-id',
        amount: 50000
      }
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('integrators');
  });

  test('should block self-payment', async ({ page }) => {
    // Login as Integrator A
    await page.goto('/login');
    await page.fill('input[name="email"]', 'techcorp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Try to book an engineer owned by same company
    const response = await page.request.post('/api/stripe/payment/create-intent', {
      data: {
        schedulerId: 'booking-of-own-engineer',
        amount: 50000
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Cannot pay yourself');
  });

  test('should return 404 for missing scheduler', async ({ page }) => {
    // Login as Integrator A
    await page.goto('/login');
    await page.fill('input[name="email"]', 'techcorp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    const response = await page.request.post('/api/stripe/payment/create-intent', {
      data: {
        schedulerId: 'nonexistent-booking-id',
        amount: 50000
      }
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('not found');
  });

  test('should reject unverified receiving integrator', async ({ page }) => {
    // Create scenario where engineer's integrator is not verified on Stripe Connect
    // This requires test data setup - engineer owned by unverified integrator

    const response = await page.request.post('/api/stripe/payment/create-intent', {
      data: {
        schedulerId: 'booking-of-unverified-engineer',
        amount: 50000
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('verified');
  });

  test('should reject invalid amount', async ({ page }) => {
    // Login as Integrator A
    await page.goto('/login');
    await page.fill('input[name="email"]', 'techcorp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    const response = await page.request.post('/api/stripe/payment/create-intent', {
      data: {
        schedulerId: 'valid-booking-id',
        amount: -100 // Negative amount
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('greater than 0');
  });

  test('should prevent unrelated integrator from viewing payment', async ({ page }) => {
    // Integrator C (not involved in payment) tries to view
    await page.goto('/login');
    await page.fill('input[name="email"]', 'unrelated@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    const response = await page.request.get(
      '/api/stripe/payment/status?paymentId=payment-123',
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('Unauthorized');
  });
});

/**
 * PAYMENT HISTORY: API endpoints and pagination
 */
test.describe('@phase1b Payment History APIs', () => {
  test('should list payments made with correct data', async ({ page }) => {
    // Login as paying integrator
    await page.goto('/login');
    await page.fill('input[name="email"]', 'techcorp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    const response = await page.request.get(
      '/api/stripe/integrator/payments-made?status=succeeded&limit=20',
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.payments).toBeInstanceOf(Array);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.total).toBeGreaterThanOrEqual(0);
    expect(data.summary).toBeDefined();
    expect(data.summary.totalPaid).toBeGreaterThanOrEqual(0);

    if (data.payments.length > 0) {
      const payment = data.payments[0];
      expect(payment).toHaveProperty('paymentId');
      expect(payment).toHaveProperty('engineer');
      expect(payment).toHaveProperty('receivingIntegrator');
      expect(payment).toHaveProperty('amounts');
      expect(payment.amounts).toHaveProperty('gross');
      expect(payment.amounts).toHaveProperty('fee');
      expect(payment.amounts).toHaveProperty('net');
    }
  });

  test('should list payments received with correct data', async ({ page }) => {
    // Login as receiving integrator
    await page.goto('/login');
    await page.fill('input[name="email"]', 'engineerco@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    const response = await page.request.get(
      '/api/stripe/integrator/payments-received?status=succeeded&limit=20',
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.payments).toBeInstanceOf(Array);
    expect(data.pagination).toBeDefined();
    expect(data.summary).toBeDefined();
    expect(data.summary.totalReceived).toBeGreaterThanOrEqual(0);

    if (data.payments.length > 0) {
      const payment = data.payments[0];
      expect(payment).toHaveProperty('paymentId');
      expect(payment).toHaveProperty('payingIntegrator');
      expect(payment.amounts.net).toBeLessThan(payment.amounts.gross); // Net is after fee
    }
  });

  test('should paginate payments correctly', async ({ page }) => {
    // Login as paying integrator
    await page.goto('/login');
    await page.fill('input[name="email"]', 'techcorp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Get first page
    const page1Response = await page.request.get(
      '/api/stripe/integrator/payments-made?limit=5&offset=0'
    );
    const page1Data = await page1Response.json();

    // Get second page if available
    if (page1Data.pagination.hasMore) {
      const page2Response = await page.request.get(
        '/api/stripe/integrator/payments-made?limit=5&offset=5'
      );
      const page2Data = await page2Response.json();

      // Ensure different data
      const page1Ids = page1Data.payments.map((p: any) => p.paymentId);
      const page2Ids = page2Data.payments.map((p: any) => p.paymentId);
      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(intersection.length).toBe(0); // No duplicates between pages
    }
  });

  test('should filter payments by status', async ({ page }) => {
    // Login as paying integrator
    await page.goto('/login');
    await page.fill('input[name="email"]', 'techcorp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    const response = await page.request.get(
      '/api/stripe/integrator/payments-made?status=failed'
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // All payments should have failed status
    if (data.payments.length > 0) {
      data.payments.forEach((payment: any) => {
        expect(payment.status).toBe('failed');
      });
    }
  });
});

/**
 * UI INTEGRATION: Payment components and display
 */
test.describe('@phase1b UI Integration', () => {
  test('should display payment button only for valid bookings', async ({ page }) => {
    // Login as Integrator A
    await page.goto('/login');
    await page.fill('input[name="email"]', 'techcorp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/protected/integrator/projects/engineers');

    // Payment button should only appear for engineers from other companies
    const paymentButtons = await page.locator('[data-testid="pay-engineer-btn"]').count();
    expect(paymentButtons).toBeGreaterThan(0);

    // Verify amount breakdown visibility
    await page.click('[data-testid="pay-engineer-btn"]');
    await page.waitForSelector('[data-testid="payment-modal"]');

    await expect(page.locator('[data-testid="payment-gross-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-platform-fee"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-net-amount"]')).toBeVisible();
  });

  test('should show receiving integrator warning', async ({ page }) => {
    // Login as Integrator A
    await page.goto('/login');
    await page.fill('input[name="email"]', 'techcorp@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/protected/integrator/projects/engineers');
    await page.click('[data-testid="pay-engineer-btn"]');
    await page.waitForSelector('[data-testid="payment-modal"]');

    // Verify receiving integrator is clearly identified
    const receivingIntegratorText = await page.textContent('[data-testid="payment-receiving-integrator"]');
    expect(receivingIntegratorText).toContain('will receive');
    expect(receivingIntegratorText).toContain('£450'); // Net amount
  });

  test('should handle payment success feedback', async ({ page }) => {
    // After successful payment, should show confirmation
    // This requires completing the happy path test first

    // UI should show:
    // 1. Success message
    // 2. Payment ID
    // 3. Transfer status
    // 4. Link to payment details

    await page.click('[data-testid="payment-success-details"]');
    await page.waitForURL('**/payments/status/**');

    await expect(page.locator('[data-testid="payment-status-succeeded"]')).toBeVisible();
    await expect(page.locator('[data-testid="transfer-status-paid"]')).toBeVisible();
  });
});

/**
 * AMOUNT CALCULATIONS: Platform fee accuracy
 */
test.describe('@phase1b Amount Calculations', () => {
  test('should calculate platform fee correctly', async ({ page }) => {
    // Test multiple amounts to verify fee calculation

    const testCases = [
      { gross: 10000, expectedFee: 1000, expectedNet: 9000 }, // £100
      { gross: 50000, expectedFee: 5000, expectedNet: 45000 }, // £500
      { gross: 100000, expectedFee: 10000, expectedNet: 90000 } // £1000
    ];

    for (const testCase of testCases) {
      const response = await page.request.post('/api/stripe/payment/create-intent', {
        data: {
          schedulerId: 'booking-id',
          amount: testCase.gross
        }
      });

      const data = await response.json();
      expect(data.platformFeeAmount).toBe(testCase.expectedFee);
      expect(data.netAmount).toBe(testCase.expectedNet);
    }
  });
});
