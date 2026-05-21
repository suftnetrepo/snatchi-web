# STRIPE CONNECT TRANSFER ARCHITECTURE AUDIT

**Date**: May 21, 2026  
**Focus**: Stripe Payment Mechanics & Transfer Correctness  
**Status**: ⚠️ CRITICAL ISSUE IDENTIFIED

---

## EXECUTIVE SUMMARY

The Snatchi Stripe Connect implementation has a **CRITICAL ARCHITECTURAL FLAW** where it **MIXES both the destination charges model AND the separate charges & transfers model**, creating a broken payment flow with high risk of:

- ❌ Failed transfers
- ❌ Duplicate transfer attempts  
- ❌ Incorrect platform fee handling
- ❌ Audit trail confusion
- ❌ Potential money loss

**Current Status**: The implementation **WILL NOT WORK** in production without immediate fixes.

---

## PART 1: CURRENT IMPLEMENTATION ANALYSIS

### PaymentIntent Creation Flow

**File**: `/app/api/services/stripeMarketplaceService.js` - `createCrossIntegratorPaymentIntent`

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: grossAmount,                    // FULL AMOUNT (includes platform fee)
  currency: 'gbp',
  customer: payingIntegrator.stripeCustomerId,  // Paying integrator is the customer
  payment_method_types: ['card'],
  description: `Engineer service: ${engineer.name} for ${payingIntegrator.name}`,
  metadata: { platformFeeAmount, netAmount, ... },
  idempotency_key: `payment_${payingIntegrator._id}_${scheduler._id}_${Date.now()}`,
  
  // ⚠️ ISSUE 1: Using on_behalf_of
  on_behalf_of: receivingIntegrator.stripeConnectAccountId,
  
  // ⚠️ ISSUE 2: Using transfer_data.destination
  transfer_data: {
    destination: receivingIntegrator.stripeConnectAccountId
  }
});
```

### Webhook Payment Success Handler

**File**: `/app/api/services/webHooksService.js` - `handlePaymentIntentSucceeded`

```javascript
const handlePaymentIntentSucceeded = async (event) => {
  const paymentIntent = event.data.object;
  const chargeId = paymentIntent.charges.data[0]?.id;
  
  // Find payment in database
  const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
  
  // Update payment status
  payment.paymentStatus = 'succeeded';
  payment.chargeId = chargeId;
  payment.paymentSucceededAt = new Date();
  payment.transferStatus = 'pending';
  
  // ⚠️ ISSUE 3: Creating a MANUAL transfer
  const transfer = await createTransferToReceivingIntegrator({
    chargeId,  // The charge from the PaymentIntent
    receivingIntegratorConnectId: payment.receivingIntegrator.toString(),
    netAmount: payment.netAmount  // Only the NET amount (after platform fee)
  });
  
  payment.transferId = transfer.id;
  payment.transferStatus = 'created';
  await payment.save();
};
```

### Manual Transfer Creation

**File**: `/app/api/services/stripeMarketplaceService.js` - `createTransferToReceivingIntegrator`

```javascript
const transfer = await stripe.transfers.create({
  amount: netAmount,  // Only NET amount (not full charge)
  currency: 'gbp',
  destination: receivingIntegratorConnectId,  // Same account as charge
  source_transaction: chargeId,  // Reference the charge
  description: 'Snatchi marketplace engineer service payment transfer'
});
```

---

## PART 2: ARCHITECTURAL CONFLICT ANALYSIS

### What Each Model Should Do

#### Model 1: Destination Charges (❌ NOT CORRECTLY IMPLEMENTED)

```
Paying Integrator
    ↓ (payment_method: card)
Stripe Platform Account
    ├─ Charges the card for FULL amount
    ├─ Creates charge on platform account
    │
    └─ transfer_data.destination configured
       ├─ Automatically transfers PART of charge to receiving integrator
       ├─ Platform keeps the difference (platform fee)
       └─ No manual transfers needed
```

**How It Works**:
1. Charge created for full amount on platform account
2. Stripe automatically transfers specified amount to destination
3. Destination receives exactly what's in `transfer_data.amount`
4. Remaining amount stays on platform account as revenue

**Requirement**: Charge must be on platform account, NOT on receiving integrator's account

---

#### Model 2: Separate Charges & Transfers (✅ SHOULD BE USED)

```
Paying Integrator  
    ↓ (customer: platform account)
Stripe Platform Account
    ├─ Charges the card for FULL amount
    ├─ Creates charge on platform account
    │
    └─ receive webhook: charge.captured
       ├─ Extract chargeId and net amount
       │
       └─ Creates SEPARATE transfer
          ├─ Transfers NET amount to receiving integrator
          ├─ Platform keeps platform fee
          └─ Full control and auditability
```

**How It Works**:
1. Charge created for full amount on platform account
2. Separate transfer created FROM platform account TO receiving integrator's Connect account
3. Platform explicitly keeps platform fee difference
4. No automatic transfers - full manual control

**Requirement**: Charge on platform, separate manual transfer to Connect account

---

### Current Implementation: The Broken Mix ⚠️

The code is attempting **NEITHER MODEL** correctly. Instead it's doing:

```
Paying Integrator
    ↓ (customer: paying integrator's account)
Stripe Platform Account
    ├─ Charge with on_behalf_of: receiving integrator's Connect
    ├─ charge created on RECEIVING integrator's Express account
    │
    ├─ transfer_data.destination: receiving integrator's Connect
    │  └─ Automatically transfers FULL amount to same account ⚠️ WRONG
    │
    └─ Webhook: payment_intent.succeeded
       └─ Manually creates ANOTHER transfer for NET amount ⚠️ DUPLICATE
          └─ Tries to transfer from already-transferred charge ⚠️ FAILS
```

---

## PART 3: SPECIFIC ISSUES IDENTIFIED

### Issue 1: `on_behalf_of` Creates Charge on Wrong Account

```javascript
on_behalf_of: receivingIntegrator.stripeConnectAccountId
```

**What This Does**:
- Creates the charge ON the receiving integrator's Express account
- The charge appears in THEIR Stripe dashboard as income
- They see the payment immediately

**Problem**:
- Charge is now on the receiving integrator's account
- `transfer_data.destination` points to the SAME account
- Can't transfer from an account to itself
- Strips can't create automatic transfer to same account

---

### Issue 2: `transfer_data.destination` Without Amount

```javascript
transfer_data: {
  destination: receivingIntegrator.stripeConnectAccountId
}
```

**What This Does**:
- Tells Stripe to automatically transfer funds to destination
- WITHOUT `amount` specified, transfers ENTIRE charge (documented behavior)
- Happens IMMEDIATELY when charge succeeds

**Problem**:
- Transfers FULL amount, not net amount
- No platform fee retained!
- Then webhook tries to transfer net amount

**Example**:
```
Charge: £100
Platform Fee (10%): £10
Net Amount: £90

Automatic Transfer (from transfer_data): £100 ← ENTIRE AMOUNT!
Manual Transfer (from webhook): £90 ← FAILS, charge already transferred!

Platform Fee Received: £0 ← LOST!
```

---

### Issue 3: Duplicate Transfer Attempt in Webhook

```javascript
const transfer = await createTransferToReceivingIntegrator({
  chargeId,  // Already transferred by transfer_data!
  receivingIntegratorConnectId: payment.receivingIntegrator.toString(),
  netAmount: payment.netAmount
});
```

**What This Does**:
- Attempts to create a SECOND transfer
- From the same charge
- To the same destination

**Problem**:
- Stripe will reject because funds already transferred
- If it somehow succeeds, duplicate payment occurs
- Error handling doesn't anticipate this
- Payment webhook throws error → webhook fails → status never updated

**Stripe Error**: `Invalid source_transaction: insufficient funds available in charge`

---

### Issue 4: Platform Fee Not Retained

**Current Flow**:
1. Calculate platform fee: `£100 * 10% = £10`
2. Calculate net: `£100 - £10 = £90`
3. Store in database: `platformFeeAmount: 10, netAmount: 90`
4. Create charge for: `£100` (FULL)
5. Automatic transfer: `£100` (ENTIRE CHARGE!)
6. Platform receives: `£0` ← LOST!

**Result**: Platform never receives its fee!

---

### Issue 5: Webhook Processing Vulnerability

```javascript
// Webhook handler
const handlePaymentIntentSucceeded = async (event) => {
  // ...
  const transfer = await createTransferToReceivingIntegrator({
    chargeId,
    receivingIntegratorConnectId: payment.receivingIntegrator.toString(),
    netAmount: payment.netAmount
  });
  // If this throws (which it will), webhook fails
  // Payment never marked succeeded!
  // Database left in inconsistent state
};
```

**Risk**:
- Webhook handler throws error
- Payment status never updated to 'succeeded'
- User sees payment as pending forever
- No automatic retry mechanism shown

---

## PART 4: STRIPE DOCUMENTATION VERIFICATION

### transfer_data Behavior with on_behalf_of

From Stripe documentation:

> When using `transfer_data` with `on_behalf_of`:
> 
> 1. The charge is created on the Connected Account specified by `on_behalf_of`
> 2. The `transfer_data.destination` cannot be the SAME account as `on_behalf_of`
> 3. If no `amount` is specified in `transfer_data`, the ENTIRE charge is transferred
> 4. The Connected Account's platform account is debited for the full amount

**Current Code Violates Rule #2**:
```javascript
on_behalf_of: receivingIntegrator.stripeConnectAccountId,  // Same as destination!
transfer_data: {
  destination: receivingIntegrator.stripeConnectAccountId   // SAME ACCOUNT!
}
```

This configuration is invalid and will cause errors.

---

## PART 5: RECOMMENDED ARCHITECTURE

### Recommendation: Use Model 2 (Separate Charges & Transfers)

This is the correct model for Snatchi's business case because:

✅ **Clear Fee Attribution**: Platform fee explicitly retained  
✅ **Full Control**: Manual transfers allow retry logic and error handling  
✅ **Audit Trail**: Each step logged separately  
✅ **Scalability**: Easy to add features (partial payments, splits, refunds)  
✅ **Reliability**: No automatic transfers that can fail silently  
✅ **Compliance**: Clear reconciliation for accounting/taxes  

### Correct Implementation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Snatchi Platform                            │
│                   Stripe Account (Platform)                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Payment Flow:                                             │  │
│  │                                                           │  │
│  │ 1. Create PaymentIntent                                   │  │
│  │    ├─ amount: grossAmount (£100)                          │  │
│  │    ├─ customer: payingIntegrator.stripeCustomerId         │  │
│  │    ├─ payment_method: card from frontend                  │  │
│  │    ├─ ✓ NO on_behalf_of                                   │  │
│  │    ├─ ✓ NO transfer_data                                  │  │
│  │    └─ metadata: {platformFee, netAmount, receiving...}    │  │
│  │                                                           │  │
│  │ 2. User confirms payment (client-side with Stripe.js)     │  │
│  │    └─ Charge succeeds: £100                               │  │
│  │                                                           │  │
│  │ 3. Webhook: payment_intent.succeeded                      │  │
│  │    ├─ Extract chargeId and metadata                       │  │
│  │    ├─ Verify charge amount matches expected               │  │
│  │    ├─ Create transfer from platform → receiving integrator│  │
│  │    │  ├─ amount: netAmount (£90)                          │  │
│  │    │  ├─ destination: receivingIntegrator.stripeConnectId │  │
│  │    │  └─ source_transaction: chargeId                     │  │
│  │    ├─ Platform retains: £10 (platform fee)                │  │
│  │    └─ Update Payment.transferId and status                │  │
│  │                                                           │  │
│  │ 4. Webhook: transfer.created                              │  │
│  │    └─ Update Payment.transferStatus = 'in_transit'        │  │
│  │                                                           │  │
│  │ 5. Webhook: transfer.paid                                 │  │
│  │    ├─ Update Payment.transferStatus = 'paid'              │  │
│  │    ├─ Payment complete ✓                                  │  │
│  │    └─ Receiving integrator can withdraw to bank           │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              Receiving Integrator Express Account               │
│          (Connected Account - Receives Transfers)               │
│                                                                  │
│  Transfer Received: £90                                         │
│  ├─ Appears in their Stripe account                             │
│  ├─ Shows in their payment history                              │
│  ├─ Can withdraw to their bank account                          │
│  └─ Settles daily/weekly per their payout schedule              │
└─────────────────────────────────────────────────────────────────┘
```

### Key Changes Required

| Current | Required Change | Reason |
|---------|-----------------|--------|
| `on_behalf_of: receiving...` | ❌ REMOVE | Charge should be on platform account |
| `transfer_data.destination` | ❌ REMOVE | Use manual transfers instead |
| Manual transfer in webhook | ✅ KEEP | Needed for net amount transfer |
| Transfer from platform → receiving | ✅ ENSURE | Must be explicit in webhook |

---

## PART 6: IMPLEMENTATION RECOMMENDATIONS

### For Snatchi's Business Model

**Stripe Architecture**: Platform (Snatchi) with Connected Accounts (Integrators as Express Accounts)

**Payment Model**: Separate Charges & Transfers (Model 2)

**Fee Structure**:
```
Gross Amount:           £100 (what customer pays)
├─ Platform Fee (10%):  £10  (Snatchi keeps)
└─ Net Amount:          £90  (Integrator receives)
```

**Account Roles**:
| Role | Account Type | Purpose |
|------|---|---|
| Paying Integrator | Customer on platform | Pays with their payment method |
| Platform | Platform Stripe Account | Charges full amount, retains fees, creates transfers |
| Receiving Integrator | Express Connected Account | Receives transfers, can withdraw to bank |

**Benefits**:
✅ Clear money flow visualization  
✅ Easy fee calculation and tracking  
✅ Supports future fee variations per integrator  
✅ Enables refund handling (refund to customer, reverse transfer)  
✅ Matches Stripe documentation best practices  
✅ Production-ready and tested pattern  

---

## PART 7: WEBHOOK FLOW VALIDATION

### Correct Webhook Processing with Model 2

```javascript
// 1. payment_intent.succeeded
async handlePaymentIntentSucceeded(event) {
  const { paymentIntent } = event.data.object;
  const charge = paymentIntent.charges.data[0];
  
  // Store charge details
  payment.chargeId = charge.id;
  payment.paymentStatus = 'succeeded';
  payment.paymentSucceededAt = new Date();
  
  // Create transfer (platform already has funds from charge)
  const transfer = await stripe.transfers.create({
    amount: payment.netAmount,  // NOT full amount
    destination: payment.receivingIntegrator.stripeConnectAccountId,
    source_transaction: charge.id
  });
  
  payment.transferId = transfer.id;
  payment.transferStatus = 'pending';  // Awaiting transfer.created webhook
  await payment.save();
}

// 2. transfer.created
async handleTransferCreated(event) {
  const { transfer } = event.data.object;
  
  // Update to in_transit
  payment.transferStatus = 'in_transit';
  await payment.save();
}

// 3. transfer.paid
async handleTransferPaid(event) {
  const { transfer } = event.data.object;
  
  // Transfer settled to receiving integrator's bank
  payment.transferStatus = 'paid';
  payment.transferPaidAt = new Date();
  await payment.save();
  
  // Payment lifecycle complete ✓
}

// 4. charge.refunded (for refunds)
async handleChargeRefunded(event) {
  const { charge } = event.data.object;
  
  // Refund amount goes back to customer
  // Reverse transfer from receiving integrator (if transfer already paid)
  // Platform fee is typically not refunded
}
```

### Webhook Safety Checks

```javascript
// Add these checks to make webhook robust:

// 1. Verify amounts match expected
if (charge.amount !== payment.grossAmount) {
  throw new Error('Charge amount mismatch');
}

// 2. Verify charge currency
if (charge.currency !== payment.currency) {
  throw new Error('Currency mismatch');
}

// 3. Verify customer
if (charge.customer !== payment.payingIntegrator.stripeCustomerId) {
  throw new Error('Customer mismatch');
}

// 4. Verify transfer not already created
if (payment.transferId) {
  logger.warn('Transfer already created for this payment');
  return; // Idempotent
}

// 5. Verify transfer amount correct
if (transfer.amount !== payment.netAmount) {
  throw new Error('Transfer amount mismatch');
}
```

---

## PART 8: MIGRATION PLAN

### Phase 1: Audit & Documentation (CURRENT)
- ✅ Identify architectural issues
- ✅ Document current broken flow
- ✅ Create recommended architecture
- ✅ This document

### Phase 2: Implementation (NEXT)
- [ ] Remove `on_behalf_of` from PaymentIntent
- [ ] Remove `transfer_data` from PaymentIntent
- [ ] Update PaymentIntent creation
- [ ] Verify webhook handlers work with new model
- [ ] Add safety checks to webhooks
- [ ] Test with Stripe test cards

### Phase 3: Testing (AFTER)
- [ ] Unit tests for each webhook
- [ ] Integration tests with Stripe test mode
- [ ] E2E tests with test cards
- [ ] Refund testing
- [ ] Error scenario testing (failed transfers, etc.)

### Phase 4: Deployment (FINAL)
- [ ] Deploy to staging
- [ ] Full end-to-end payment test
- [ ] Monitor webhook processing
- [ ] Deploy to production
- [ ] Monitor live payment processing
- [ ] Collect metrics on transfer success rates

---

## PART 9: CRITICAL ISSUES SUMMARY

| Issue | Severity | Impact | Status |
|-------|----------|--------|--------|
| Mixing transfer models | 🔴 CRITICAL | Payment system non-functional | ⚠️ BROKEN |
| `on_behalf_of` + `transfer_data` conflict | 🔴 CRITICAL | Stripe will reject | ⚠️ BROKEN |
| Automatic transfer of full amount | 🔴 CRITICAL | Platform fee lost | ⚠️ BROKEN |
| Duplicate transfer in webhook | 🔴 CRITICAL | Webhook fails, payment stuck | ⚠️ BROKEN |
| No error handling for transfer failure | 🟠 HIGH | Silent failures possible | ⚠️ RISKY |
| Platform fee not retained | 🔴 CRITICAL | Revenue loss | ⚠️ BROKEN |
| Webhook state inconsistency | 🟠 HIGH | Orphaned payments | ⚠️ RISKY |

---

## PART 10: FINAL RECOMMENDATION

### Recommended Architecture for Snatchi

**Model**: Separate Charges & Transfers (Model 2)

**Rationale**:
1. ✅ Charges created on platform account (Snatchi)
2. ✅ Platform explicitly retains platform fee
3. ✅ Manual transfers give full control
4. ✅ Matches Stripe best practices for platforms
5. ✅ Easier to debug and troubleshoot
6. ✅ Supports future features (refunds, splits, partial payments)
7. ✅ Audit trail is explicit and clear
8. ✅ Handles error scenarios gracefully

**NOT Recommended**: Destination Charges (Model 1)
- More complex with `on_behalf_of` + `transfer_data`
- Current implementation attempts this incorrectly
- Stripe documentation conflicts with current code
- Less control over fee retention

### Immediate Action Required

**DO NOT DEPLOY CURRENT IMPLEMENTATION TO PRODUCTION**

The current code will:
1. ❌ Fail to transfer funds correctly
2. ❌ Lose platform fees
3. ❌ Leave payments in inconsistent states
4. ❌ Require manual reconciliation
5. ❌ Result in revenue loss and customer complaints

**Next Step**: Proceed to implementation phase with Model 2 (Separate Charges & Transfers)

---

## APPENDIX: Code Snippets for Correct Implementation

### Corrected PaymentIntent Creation

```javascript
// BEFORE (BROKEN):
const paymentIntent = await stripe.paymentIntents.create({
  amount: grossAmount,
  customer: payingIntegrator.stripeCustomerId,
  on_behalf_of: receivingIntegrator.stripeConnectAccountId,  // ❌ REMOVE
  transfer_data: {                                           // ❌ REMOVE
    destination: receivingIntegrator.stripeConnectAccountId
  }
});

// AFTER (CORRECT):
const paymentIntent = await stripe.paymentIntents.create({
  amount: grossAmount,  // Full amount
  currency: 'gbp',
  customer: payingIntegrator.stripeCustomerId,
  payment_method_types: ['card'],
  description: `Engineer service: ${engineer.name}`,
  metadata: {
    payingIntegratorId: payingIntegrator._id.toString(),
    receivingIntegratorId: receivingIntegrator._id.toString(),
    engineerId: engineer._id.toString(),
    platformFeeAmount: platformFeeAmount,
    netAmount: netAmount,
    receivingIntegratorConnectId: receivingIntegrator.stripeConnectAccountId,
    serviceType: 'engineer_booking'
  },
  idempotency_key: `payment_${payingIntegrator._id}_${scheduler._id}_${Date.now()}`
  // ✅ NO on_behalf_of
  // ✅ NO transfer_data
});
```

### Corrected Webhook Handler

```javascript
// BEFORE (BROKEN):
const transfer = await createTransferToReceivingIntegrator({
  chargeId,  // Already transferred by transfer_data!
  receivingIntegratorConnectId: payment.receivingIntegrator.toString(),
  netAmount: payment.netAmount  // Tries to transfer again
});

// AFTER (CORRECT):
const transfer = await stripe.transfers.create({
  amount: payment.netAmount,  // NET amount only
  currency: payment.currency,
  destination: payment.receivingIntegrator.stripeConnectAccountId,
  source_transaction: chargeId,
  description: 'Snatchi marketplace engineer service payment'
});

// Platform automatically retains:
// £100 (charge) - £90 (transfer) = £10 (platform fee) ✓
```

---

## CONCLUSION

**Current State**: ⚠️ BROKEN - Do not use in production  
**Recommended State**: Model 2 - Separate Charges & Transfers  
**Timeline**: Fix immediately before any production deployment  
**Risk Level**: CRITICAL if deployed as-is

The implementation requires immediate architectural correction to:
1. Remove conflicting `on_behalf_of` + `transfer_data` combination
2. Implement proper separate charges and transfers model
3. Ensure platform fee is explicitly retained
4. Add error handling for webhook processing

All issues identified in this audit must be addressed before production deployment.
