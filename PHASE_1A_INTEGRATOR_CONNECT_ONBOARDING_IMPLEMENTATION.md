# Phase 1A: Integrator Stripe Connect Onboarding - Implementation Guide

**Date:** May 20, 2026  
**Status:** ✅ COMPLETE  
**Scope:** Integrator Stripe Connect Express account setup  

---

## 📋 Overview

This document describes the Phase 1A implementation: **Integrator Stripe Connect Onboarding**.

Integrators can now set up Stripe Connect Express accounts to receive payments when their engineers are booked by other integrators (Phase 1B payment feature, coming next).

**Key Point:** Only integrators get Stripe Connect accounts. Engineers do NOT have Stripe accounts and are NOT involved in payment processing.

---

## ✅ Files Changed

### Backend Files

#### 1. **Model: `/app/api/models/integrator.js`**
- **Added:** 9 new fields for Stripe Connect tracking
- **Fields:**
  - `stripeConnectAccountId` - Stripe account ID (string, sparse index)
  - `connectAccountStatus` - Status enum (not_started, onboarding_started, verified, restricted, requirements_pending, verification_failed)
  - `connectOnboardingStartedAt` - Timestamp when onboarding began
  - `connectOnboardingCompletedAt` - Timestamp when onboarding completed
  - `connectRejectReason` - String (max 500 chars) for rejection reasons
  - `chargesEnabled` - Boolean (default: false)
  - `payoutsEnabled` - Boolean (default: false)
  - `bankAccountOnFile` - Boolean (default: false)
  - `platformFeePercentage` - Number (default: 10, min: 0, max: 100)

#### 2. **Constants: `/app/api/constants/statuses.js`**
- **Added:** `INTEGRATOR_CONNECT_STATUS` enum
  - `NOT_STARTED` = 'not_started'
  - `ONBOARDING_STARTED` = 'onboarding_started'
  - `VERIFIED` = 'verified'
  - `RESTRICTED` = 'restricted'
  - `REQUIREMENTS_PENDING` = 'requirements_pending'
  - `VERIFICATION_FAILED` = 'verification_failed'

#### 3. **Service: `/app/api/services/stripeConnectService.js`** (NEW)
- **Purpose:** Stripe Connect account management service
- **Functions:**
  - `createIntegratorExpressAccount(integrator)` - Creates new Connect account
  - `createIntegratorAccountLink(stripeAccountId)` - Generates onboarding link (24-hour expiration)
  - `getIntegratorConnectStatus(stripeAccountId)` - Retrieves current account status from Stripe
  - `mapStripeConnectStatus(stripeAccount)` - Maps Stripe status to our enum
  - `rejectIntegratorConnect(stripeAccountId)` - Marks account as rejected

#### 4. **API Routes:** `/app/api/stripe/integrator/` (NEW DIRECTORY)

**Route 1: POST `/api/stripe/integrator/create-onboarding-link`**
- **Purpose:** Start Stripe Connect onboarding
- **Auth:** Requires authenticated integrator user
- **Security:** User can only create account for their own integrator
- **Request:** `{ integratorId?: string }`
- **Response:**
  ```json
  {
    "success": true,
    "accountId": "acct_...",
    "onboardingUrl": "https://connect.stripe.com/...",
    "expiresAt": 1234567890
  }
  ```
- **Error Cases:**
  - 401: Not authenticated
  - 403: Not an integrator / Creating account for other integrator
  - 404: Integrator not found
  - 500: Stripe API error
- **File:** `create-onboarding-link/route.js`

**Route 2: GET `/api/stripe/integrator/connect-status`**
- **Purpose:** Check current Connect account status
- **Auth:** Requires authenticated integrator user
- **Request:** None (uses session)
- **Response:**
  ```json
  {
    "status": "verified|onboarding_started|requirements_pending|...",
    "accountId": "acct_...",
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "bankAccountOnFile": true,
    "requirementsStatus": {
      "currentlyDue": ["individual.address"],
      "pastDue": [],
      "pendingVerification": []
    },
    "onboardingStartedAt": "2026-05-20T10:00:00.000Z",
    "onboardingCompletedAt": "2026-05-21T10:00:00.000Z",
    "rejectReason": null
  }
  ```
- **File:** `connect-status/route.js`

**Route 3: POST `/api/stripe/integrator/refresh-onboarding`**
- **Purpose:** Get a fresh onboarding link (in case user left mid-process)
- **Auth:** Requires authenticated integrator user
- **Request:** None
- **Response:**
  ```json
  {
    "success": true,
    "onboardingUrl": "https://connect.stripe.com/...",
    "expiresAt": 1234567890
  }
  ```
- **Error Cases:**
  - 400: No Connect account found to resume
- **File:** `refresh-onboarding/route.js`

**Route 4: POST `/api/stripe/integrator/retrieve-onboarding-link`**
- **Purpose:** Get the current onboarding link without creating a new account
- **Auth:** Requires authenticated integrator user
- **Request:** None
- **Response:**
  ```json
  {
    "success": true,
    "accountId": "acct_...",
    "onboardingUrl": "https://connect.stripe.com/...",
    "expiresAt": 1234567890
  }
  ```
- **File:** `retrieve-onboarding-link/route.js`

#### 5. **Webhook Handler: `/app/api/services/webHooksService.js`**
- **Added:** `handleConnectAccountUpdated` function
- **Purpose:** Process Stripe `account.updated` webhook events
- **Triggers:**
  - Account onboarding progress
  - Charges/payouts capability changes
  - Requirements updated
  - Account restrictions
- **Actions:**
  - Updates integrator Connect status fields
  - Captures requirements/rejection reasons
  - Marks onboarding as completed when verified
  - TODO: Send email notifications (Phase 2)

#### 6. **Webhook Route: `/app/api/webhooks/route.js`**
- **Modified:** Added handler import and registration
- **New Event:** `account.updated` → `handleConnectAccountUpdated`

### Frontend Files

#### 7. **Settings Page: `/app/protected/integrator/settings/page.jsx`**
- **Added:** New "Receive Payments" menu section
- **Features:**
  - Fetch and display Connect account status
  - Status badge showing current state (verified, pending, failed, etc.)
  - Conditional UI based on status:
    - **Not Started:** Show "Set Up Now" button
    - **Onboarding In Progress:** Show "Resume Setup" button
    - **Verified:** Show success message, charges/payouts enabled status, bank account status
    - **Requirements Pending:** List missing requirements, show "Resume Setup" button
    - **Verification Failed:** Show rejection reason, offer to try again
    - **Restricted:** Show restriction warning
  - Real-time status checking
  - Error handling with alerts
  - Loading states with spinners

---

## 🔒 Security Implementation

### Authentication Checks

All 4 API routes enforce:
1. **Session validation** - User must be logged in
2. **Role validation** - User must be an 'integrator' role
3. **Ownership validation** - User can only manage their own integrator's account

Example from `create-onboarding-link/route.js`:
```javascript
if (session.user.integrator_id !== integratorId.toString()) {
  return NextResponse.json(
    { error: 'Cannot create Connect account for other integrators' },
    { status: 403 }
  );
}
```

### Engineer Protection

**Engineers CANNOT access these routes:**
- Role check prevents non-integrators
- Only integrators have `integrator_id` in session
- API returns 403 Forbidden for engineers

### What's NOT Implemented (Phase 1B+)

- ❌ Engineer Stripe Connect accounts
- ❌ Engineer payout management
- ❌ Engineer earnings tracking
- ❌ Payment collection
- ❌ Transfers to engineer accounts

---

## 🔔 Webhook Integration

### Event: `account.updated`

**Triggered by Stripe when:**
- Onboarding steps completed
- Requirements submitted
- Account verified
- Account restricted
- Charges/payouts capabilities change

**Handler Actions:**
1. Verify account belongs to an integrator
2. Update integrator record:
   - `connectAccountStatus` (mapped from Stripe state)
   - `chargesEnabled` / `payoutsEnabled`
   - `bankAccountOnFile`
   - `connectOnboardingCompletedAt` (if verified)
   - `connectRejectReason` (if rejected)
3. Log status change
4. (TODO Phase 2) Send email notification

**Example Event:**
```json
{
  "type": "account.updated",
  "data": {
    "object": {
      "id": "acct_1234567890",
      "charges_enabled": true,
      "payouts_enabled": true,
      "requirements": {
        "currently_due": [],
        "past_due": [],
        "pending_verification": []
      },
      "external_accounts": {
        "data": [
          { "id": "ba_..." }
        ]
      }
    }
  }
}
```

**Testing:**
```bash
# Simulate account verified event
stripe trigger account.updated --account acct_... 

# View events
stripe events list
```

---

## 🧪 Local Testing

### Prerequisites

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login and get webhook signing secret
stripe login
stripe listen --forward-to localhost:3000/api/webhooks
```

### Test Scenario 1: Create Onboarding Link

**API Call:**
```bash
curl -X POST http://localhost:3000/api/stripe/integrator/create-onboarding-link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-session-token>"
```

**Expected Response:**
```json
{
  "success": true,
  "accountId": "acct_1234567890",
  "onboardingUrl": "https://connect.stripe.com/...",
  "expiresAt": 1706850000
}
```

**Manual Test:**
1. Log in as integrator
2. Go to `/protected/integrator/settings`
3. Click "Receive Payments" tab
4. Click "Set Up Now"
5. Should redirect to Stripe Connect onboarding
6. Complete onboarding steps (test data):
   - Email: use logged-in email
   - Address: Any UK/US address
   - Bank account: Use Stripe test account

### Test Scenario 2: Check Status

**API Call:**
```bash
curl http://localhost:3000/api/stripe/integrator/connect-status \
  -H "Authorization: Bearer <your-session-token>"
```

**Expected Responses:**

Not started:
```json
{
  "status": "not_started",
  "accountId": null,
  "chargesEnabled": false,
  "payoutsEnabled": false
}
```

Verified:
```json
{
  "status": "verified",
  "accountId": "acct_...",
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "bankAccountOnFile": true,
  "requirementsStatus": {
    "currentlyDue": [],
    "pastDue": [],
    "pendingVerification": []
  }
}
```

### Test Scenario 3: Resume Onboarding

**Prerequisites:**
- Start onboarding but don't complete
- Leave the page

**Manual Test:**
1. Go back to Settings → Receive Payments
2. Should show "Onboarding in Progress"
3. Click "Resume Setup"
4. Should get a new onboarding link
5. Complete remaining steps

### Test Scenario 4: Webhook Processing

**Using Stripe CLI:**
```bash
# Listen for webhooks
stripe listen --forward-to localhost:3000/api/webhooks

# Trigger account.updated (after completing onboarding in Stripe dashboard)
stripe trigger account.updated --account acct_1234567890
```

**Check Database:**
```javascript
// In MongoDB or via API
db.integrators.findOne({ stripeConnectAccountId: "acct_..." })
// Should show connectAccountStatus: 'verified'
```

**Check Logs:**
```bash
# Tail logs for webhook processing
tail -f logs/info.log | grep "Connect status"
# Expected: "Connect status updated successfully"
```

---

## 🚀 Stripe CLI Commands Reference

```bash
# List all test accounts you created
stripe accounts list --limit 10

# Retrieve a specific account
stripe accounts retrieve acct_1234567890

# Simulate account requiring additional info
stripe trigger account.updated --account acct_1234567890

# View webhooks received
stripe logs tail

# Test webhook signature locally
stripe trigger charge.succeeded
```

---

## ❌ What's NOT Implemented

### Phase 1A Scope (Complete ✅)
- ✅ Integrator Connect account onboarding
- ✅ Status tracking and display
- ✅ Webhook processing
- ✅ UI for setup/resume

### Phase 1B Scope (Next)
- ❌ Payment creation when engineer booked
- ❌ Cross-integrator payment flow
- ❌ Transfer to receiving integrator
- ❌ Payment confirmation UI

### Future Phases
- ❌ Refunds and disputes
- ❌ Payout release automation
- ❌ Payment history reports
- ❌ Multi-currency support
- ❌ Recurring bookings
- ❌ Email notifications to integrators

---

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] Test all 4 API routes with valid and invalid inputs
- [ ] Test webhook handler with `account.updated` event
- [ ] Test UI sections on Settings page
- [ ] Verify security checks prevent engineer access
- [ ] Check error messages are user-friendly
- [ ] Test on staging with test Stripe account
- [ ] Run database migration for Integrator model
- [ ] Verify constant values match Stripe enum

### Deployment

- [ ] Merge PR to main
- [ ] Deploy to staging
- [ ] Run E2E tests
- [ ] Deploy to production
- [ ] Register webhook in Stripe dashboard (if not already)
- [ ] Monitor logs for errors
- [ ] Test with real integrator account

### Post-Deployment

- [ ] Announce feature to integrators
- [ ] Monitor webhook processing
- [ ] Track onboarding completion rate
- [ ] Gather feedback for Phase 1B

---

## 🔍 Debugging Tips

### Issue: "Cannot create account for other integrators" (403)

**Cause:** User session `integrator_id` doesn't match request
**Fix:** Check that user is logged in with correct integrator account

### Issue: Webhook not received

**Cause 1:** Webhook secret not set in environment
```bash
# Check your env
echo $STRIPE_WEBHOOK_SECRET_LOCAL
```

**Cause 2:** Webhook endpoint not registered in Stripe dashboard
```bash
# Register in dashboard or use CLI
stripe trigger account.updated
```

### Issue: Status shows "not_started" after onboarding

**Cause 1:** Onboarding not completed in Stripe
**Fix:** Complete all steps in Stripe Connect dashboard

**Cause 2:** Webhook not processed
**Fix:** Check logs for webhook errors
```bash
stripe logs tail
```

**Cause 3:** Refresh before Stripe processed webhook
**Fix:** Webhook processing is eventually consistent (usually <5 seconds)

### Issue: Bank account not detected

**Cause:** External accounts API field empty
**Fix:** Verify bank account was successfully added in Stripe Dashboard

---

## 📊 Database Index

Added index in Integrator model:
```javascript
IntegratorSchema.index({ stripeConnectAccountId: 1 })
```

This allows fast lookups when processing `account.updated` webhooks.

---

## 🔗 Next Steps (Phase 1B)

### Payment Creation Flow
1. Engineer booking created with `payingIntegrator` (who pays)
2. System determines `receivingIntegrator` from `engineer.integrator`
3. Create PaymentIntent with Stripe
4. Route payment to receiving integrator's Connect account

### Webhook Events to Add
- `payment_intent.succeeded` → Create transfer to receiving integrator
- `payment_intent.payment_failed` → Update payment status
- `transfer.created` → Track payout release date

### Routes to Create
- POST `/api/stripe/payment/create-intent`
- POST `/api/stripe/payment/confirm`
- GET `/api/stripe/integrator/payments-received`
- GET `/api/stripe/integrator/payments-made`

---

## 📞 Support

**Questions?**
- Check logs: `tail -f logs/info.log`
- View webhook events: `stripe logs tail`
- Test Stripe docs: https://stripe.com/docs/connect/testing

**Phase 1B starts when:**
- [ ] Phase 1A fully tested and deployed
- [ ] Integrators have verified accounts (≥1 completed)
- [ ] Webhook integration confirmed working
- [ ] Product approval for payment flow

---

**Last Updated:** May 20, 2026  
**Status:** ✅ Complete and Ready for Testing
