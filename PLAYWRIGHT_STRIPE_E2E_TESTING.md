# Playwright Stripe E2E Testing Guide

## Overview

This document describes how Playwright E2E testing is configured for the Snatchi Next.js Stripe subscription application. All tests use Stripe Test Mode and verify critical subscription workflows without requiring real payments.

## Installation

Playwright was installed as a dev dependency:

```bash
npm install -D @playwright/test --legacy-peer-deps
```

(The `--legacy-peer-deps` flag is required due to existing project dependency conflicts.)

## Configuration

### `playwright.config.ts`

The main configuration file includes:

- **Test directory**: `./e2e` — where all E2E test files live
- **Base URL**: `http://localhost:3000` — development server (configurable via `PLAYWRIGHT_TEST_BASE_URL`)
- **Web server**: Automatically starts `npm run dev` before tests
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile viewports**: Pixel 5 (Android), iPhone 12 (iOS)
- **Reporters**: HTML with screenshots and videos on failure
- **Retry logic**: 0 retries locally, 2 on CI

## Commands

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests with UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui
```

Opens an interactive Playwright UI where you can:
- Run individual tests
- Step through them with debugging
- Inspect elements and network requests
- View test results in real-time

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

Runs tests with the browser visible for observation.

### Debug Mode (Step Through Code)

```bash
npm run test:e2e:debug
```

Opens debugger where you can set breakpoints and step through test code.

### Run Specific Test Suites

```bash
# Stripe checkout tests only
npm run test:e2e:checkout

# Customer Portal tests only
npm run test:e2e:portal

# Subscription access tests only
npm run test:e2e:access

# All Stripe tests
npm run test:e2e:stripe
```

### Run Single Test File

```bash
npx playwright test e2e/stripe/checkout.spec.ts
```

### Run Single Test

```bash
npx playwright test -g "user can select a pricing plan"
```

## Environment Variables

### Required for Tests

Create `.env.test` based on `.env.test.example`:

```bash
cp .env.test.example .env.test
```

**Key Variables:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `PLAYWRIGHT_TEST_BASE_URL` | Test server URL | `http://localhost:3000` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test key (published) | `pk_test_...` |
| `STRIPE_SECRET_KEY` | Stripe test key (secret) | `sk_test_...` |
| `NEXTAUTH_SECRET` | Session encryption key | `test_secret_123` |
| `NEXTAUTH_URL` | Auth callback URL | `http://localhost:3000` |
| `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID` | Test Starter plan price ID | `price_test_...` |
| `NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID` | Test Professional plan | `price_test_...` |
| `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID` | Test Enterprise plan | `price_test_...` |

### Getting Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Test Mode** (toggle in top left)
3. Go to **Developers → API Keys**
4. Copy your **Publishable Key** (starts with `pk_test_`)
5. Copy your **Secret Key** (starts with `sk_test_`)

### Getting Test Price IDs

1. In Stripe Dashboard (Test Mode)
2. Go to **Products → Products**
3. Create test products if needed with test prices
4. Copy the Price IDs for use in `.env.test`

## Stripe Test Cards

Use these test card numbers for checkout tests:

| Card Type | Number | Result |
|-----------|--------|--------|
| **Success** | `4242 4242 4242 4242` | Payment succeeds |
| **3DS/SCA Required** | `4000 0025 0000 3155` | Authentication required |
| **Decline** | `4000 0000 0000 0002` | Payment declines |

**Note**: Use any future expiry date, any 3-digit CVC

### Why Real Stripe Keys?

Tests use real Stripe Test Mode keys because:
- ✅ Tests verify actual Stripe integration, not mocks
- ✅ Test Mode is completely separate from Production
- ✅ No real charges ever occur
- ✅ Webhooks work in Test Mode
- ✅ More realistic test scenarios

**Safety**: Test Mode never processes real money or touches production data.

## Test Structure

### Folder Layout

```
e2e/
├── helpers/
│   ├── auth.ts              # Login, signup, session helpers
│   ├── test-users.ts        # Test data, card numbers, plan IDs
│   └── stripe.ts            # Stripe-specific helpers
└── stripe/
    ├── checkout.spec.ts     # Pricing & checkout flow
    ├── customer-portal.spec.ts  # Portal integration
    └── subscription-access.spec.ts  # Access control
```

### Helper Functions

#### `auth.ts`

- `createTestUser()` — Register a new test user
- `loginAsUser()` — Log in with email/password
- `clearUserSession()` — Log out and clear session data
- `getSession()` — Get current auth session
- `expectUserAuthenticated()` — Assert user is logged in
- `expectUserNotAuthenticated()` — Assert user is logged out

#### `test-users.ts`

- `STRIPE_TEST_CARDS` — Card numbers for checkout tests
- `TEST_USER_DATA` — User data (valid, invalid, missing fields)
- `generateTestUser()` — Create unique test user per run
- `TEST_CHECKOUT_DATA` — Checkout form data
- `TEST_PRICING_PLANS` — Plan info (names, prices, IDs)
- `SUBSCRIPTION_STATUSES` — Valid subscription states

#### `stripe.ts`

- `fillStripeCardForm()` — Fill card details safely in iframe
- `waitForStripeCardElement()` — Wait for Stripe to load
- `openPortalAndVerifyEndpoint()` — Click Portal button
- `verifyCheckoutPrice()` — Verify amount displayed
- `submitCheckoutForm()` — Submit payment
- `verifySubscriptionStatus()` — Check subscription state
- `verifyPortalButtonExists()` — Verify Portal button present
- `verifyTrialCountdown()` — Check trial display
- `verifyNoDeprecatedEndpoints()` — Ensure cleanup completed

## Test Coverage

### Checkout Flow (`checkout.spec.ts`)

Tests pricing page, plan selection, form validation, Stripe integration, and successful/failed payments.

**Scenarios:**
- ✅ Pricing page loads with all plans
- ✅ User selects plan and goes to checkout
- ✅ Checkout displays correct price
- ✅ Form requires email and phone
- ✅ Invalid email shows error
- ✅ Invalid phone shows error
- ✅ Stripe card element loads
- ✅ Payment with success card succeeds
- ✅ Payment with decline card fails
- ✅ Successful payment redirects to dashboard
- ✅ Subscription becomes active after payment

**Test Cards Used:**
- `4242 4242 4242 4242` — Success
- `4000 0000 0000 0002` — Decline

### Customer Portal (`customer-portal.spec.ts`)

Tests that Portal is configured and that deprecated custom buttons are removed.

**Scenarios:**
- ✅ Authenticated user can access subscription page
- ✅ Subscription displays status, plan, trial info
- ✅ "Manage Billing" button exists and is clickable
- ✅ Clicking button calls `/api/stripe/customerPortal`
- ✅ Portal session returns valid URL
- ✅ URL redirects to Stripe Billing Portal
- ✅ No custom "Change Plan" button exists
- ✅ No custom "Cancel Subscription" button exists
- ✅ No references to deprecated endpoints in HTML
- ✅ Subscription page displays only Portal button for changes
- ✅ Status, plan, and trial info display correctly
- ✅ Page is responsive on mobile

**Key Verifications:**
- Deprecated endpoints (`/api/stripe/subscription/upgrade`, `cancel`) are NOT referenced
- Only the Portal button exists for subscription changes
- All subscription data displays correctly

### Subscription Access (`subscription-access.spec.ts`)

Tests that access enforcement works correctly based on subscription status.

**Scenarios:**
- ✅ Active user can access protected routes
- ✅ Trialing user can access protected routes
- ✅ Suspended user is blocked
- ✅ Cancelled user is blocked
- ✅ Inactive user is blocked
- ✅ Blocked users see error message
- ✅ Blocked users are redirected appropriately
- ✅ Checkout/pricing/login remain public
- ✅ Webhooks endpoint is accessible
- ✅ API endpoints require authentication
- ✅ Ping endpoint is public (health check)
- ✅ Trial users are NOT blocked
- ✅ Past-due users can access (business rule dependent)

## Mocking vs. Real

### What's REAL (Not Mocked)

✅ **Stripe Test Mode Integration**
- Real Stripe API calls (Test Mode only)
- Real test card processing
- Real webhook event delivery
- Real Portal session creation

✅ **App Backend**
- Real Next.js API routes
- Real database (test instance)
- Real NextAuth session
- Real subscription enforcement

### What's MOCKED

🔄 **Browser Interactions**
- Stripe.js iframe card input (tests provide card details safely)
- External redirects (Portal URLs intercepted to avoid leaving test context)
- Email delivery (no Brevo calls, just verifies request)
- Analytics/logging (captured but not verified)

## Known Limitations

1. **Stripe Hosted UI**: Tests don't deeply verify Stripe's own UI (e.g., Portal buttons). We verify only that the Portal URL is generated and accessible.

2. **3DS/SCA Auth**: Tests for `4000 0025 0000 3155` (3DS card) require additional approval flow that may be skipped in Test Mode.

3. **Webhook Timing**: Real webhooks take a few seconds to deliver. Tests use polling or timeouts. Consider using [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhook testing.

4. **Mobile Testing**: Tests include mobile viewports but some Stripe components may behave differently on mobile.

5. **Email Verification**: Email confirmation tests don't verify actual email content, just that the endpoint is called.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_TEST_BASE_URL: http://localhost:3000
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_TEST_PUBLISHABLE_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: http://localhost:3000
          NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID: ${{ secrets.STRIPE_STARTER_PRICE_ID }}
          NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID: ${{ secrets.STRIPE_PROFESSIONAL_PRICE_ID }}
          NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID: ${{ secrets.STRIPE_ENTERPRISE_PRICE_ID }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

**Setup**:
1. Add secrets to GitHub repo settings for all test environment variables
2. Add Playwright install step (downloads browsers)
3. Run tests in CI with secrets passed via environment

## Troubleshooting

### Tests Time Out

**Problem**: Tests wait too long for Stripe or server

**Solution**:
```bash
# Increase timeouts
npx playwright test --timeout=30000

# Or in code:
test.setTimeout(30000);
```

### Stripe Element Not Found

**Problem**: Test can't find Stripe card iframe

**Solution**:
- Use `waitForStripeCardElement()` helper
- Verify Stripe.js is loaded: `page.waitForFunction(() => typeof window.Stripe !== 'undefined')`
- Check browser console for Stripe errors

### Portal Redirect Issues

**Problem**: Test redirects to real Stripe Portal unexpectedly

**Solution**:
- Tests intercept `/api/stripe/customerPortal` calls to prevent actual redirects
- Verify the mock is set up before clicking button
- Check that your Portal endpoint returns a valid session object

### "Could not find test server"

**Problem**: Playwright can't connect to dev server

**Solution**:
```bash
# Ensure dev server is running
npm run dev

# Or let Playwright start it
npx playwright test
```

### Database State Issues

**Problem**: Tests fail due to leftover data from previous runs

**Solution**:
- Use unique emails: `generateTestUser()` includes timestamp
- Clear test data before tests: Add `test.beforeEach()` hooks
- Reset test database between runs: Add in CI script

### Session Not Persisting

**Problem**: Tests log in but session disappears

**Solution**:
- Check NextAuth configuration
- Verify cookies are enabled in Playwright: `storageState` option
- Check session TTL in `.env`

## Performance Tips

1. **Run in Parallel** (default in `playwright.config.ts`)
   ```bash
   npx playwright test --workers=4
   ```

2. **Filter Tests Locally**
   ```bash
   npm run test:e2e:checkout  # Only checkout tests
   ```

3. **Use UI Mode for Debugging**
   ```bash
   npm run test:e2e:ui
   ```

4. **Headed Mode Slower but Useful**
   ```bash
   npm run test:e2e:headed
   ```

## Further Reading

- [Playwright Docs](https://playwright.dev)
- [Stripe Test Mode](https://stripe.com/docs/testing)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Support

For issues:
1. Check test output and screenshots in `test-results/`
2. View HTML report: `npx playwright show-report`
3. Run with `--debug` flag to step through
4. Check Stripe dashboard (Test Mode) for events and logs
5. Review `.env.test` configuration

---

**Last Updated**: May 20, 2026
**Test Framework**: Playwright v1.42+
**Node.js**: 18+
