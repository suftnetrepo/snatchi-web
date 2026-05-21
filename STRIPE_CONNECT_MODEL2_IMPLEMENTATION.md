# STRIPE CONNECT MODEL 2 IMPLEMENTATION SUMMARY

**Date**: May 21, 2026  
**Status**: ✅ IMPLEMENTED - Model 2 (Separate Charges & Transfers) Architecture  
**Files Modified**: 2  

---

## CHANGES IMPLEMENTED

### ✅ 1. PaymentIntent Creation Fixed
**File**: `/app/api/services/stripeMarketplaceService.js` - `createCrossIntegratorPaymentIntent`

**Changes**:
- ❌ Removed: `on_behalf_of: receivingIntegrator.stripeConnectAccountId`
- ❌ Removed: `transfer_data: { destination: receivingIntegrator.stripeConnectAccountId }`
- ✅ Added: Documentation explaining Model 2 architecture

**Result**:
```
Before (BROKEN):
- Charge created on receiving integrator's account
- Automatic transfer of FULL amount (100%)
- Manual transfer attempt in webhook fails
- Platform fee LOST

After (CORRECT):
- Charge created on PLATFORM account (Snatchi)
- NO automatic transfers
- Manual transfer via webhook (NET amount only)
- Platform retains fee automatically (100% - 90% = 10%)
```

---

### ✅ 2. Payment Success Webhook Enhanced
**File**: `/app/api/services/webHooksService.js` - `handlePaymentIntentSucceeded`

**Changes Added**:
- ✅ Safety Check 1: Verify charge amount matches expected
- ✅ Safety Check 2: Verify currency matches
- ✅ Safety Check 3: Verify transfer not already created (idempotency)
- ✅ Enhanced logging with fee information
- ✅ Better error handling with retry state
- ✅ Clear comments explaining Model 2 architecture

**Example of Enhanced Output**:
```javascript
logger.info('Transfer created for succeeded payment', {
  paymentIntentId: 'pi_xxx',
  chargeId: 'ch_xxx',
  transferId: 'tr_xxx',
  grossAmount: 10000,           // £100
  platformFeeAmount: 1000,      // £10
  netAmount: 9000,              // £90
  platformRetained: 1000        // £10 ✓
});
```

---

### ✅ 3. Transfer Creation Function Documented
**File**: `/app/api/services/stripeMarketplaceService.js` - `createTransferToReceivingIntegrator`

**Changes**:
- ✅ Added comprehensive documentation
- ✅ Added example flow diagram
- ✅ Explained Model 2 architecture
- ✅ Clarified fee retention mechanism

---

### ✅ 4. Transfer.Created Webhook Enhanced
**File**: `/app/api/services/webHooksService.js` - `handleTransferCreated`

**Changes Added**:
- ✅ Safety Check: Verify transfer amount matches expected
- ✅ Safety Check: Verify transfer destination is correct
- ✅ Better logging and error tracking
- ✅ Handles partial transfers gracefully

---

### ✅ 5. Transfer.Paid Webhook Enhanced  
**File**: `/app/api/services/webHooksService.js` - `handleTransferPaid`

**Changes**:
- ✅ Added documentation explaining payment lifecycle completion
- ✅ Enhanced logging showing full payment breakdown
- ✅ Shows platform fee retained
- ✅ Shows receiving integrator details

**Example Logging**:
```javascript
logger.info('Payment lifecycle complete - transfer paid', {
  paymentId: '...',
  transferId: '...',
  amount: 9000,                 // Transferred to integrator
  platformFeeRetained: 1000,    // Platform keeps this
  receivingIntegratorId: '...'
});
```

---

## ARCHITECTURE VERIFICATION

### Before (BROKEN - Mixed Models)
```
PaymentIntent Creation:
  on_behalf_of: receiving_integrator ❌
  transfer_data.destination: receiving_integrator ❌
  └─ Invalid: Can't transfer to same account
  
Charge Created: £100 on receiving_integrator
Transfer (automatic): £100 to receiving_integrator (WRONG - same account!)
  
Webhook: payment_intent.succeeded
  └─ Try to transfer £90 to receiving_integrator
  └─ FAILS: Funds already transferred!
  
Result: 
  Platform fee: £0 ❌ LOST
  Payment state: Stuck ❌
  Revenue: Lost ❌
```

### After (CORRECT - Model 2)
```
PaymentIntent Creation:
  ✅ NO on_behalf_of
  ✅ NO transfer_data
  ✅ Charge for FULL amount (£100)
  
Charge Created: £100 on PLATFORM account
  └─ Customer: paying_integrator
  └─ Amount: £100 (full amount)
  
Webhook: payment_intent.succeeded
  ├─ Safety checks: amount, currency, idempotency
  └─ Create transfer: £90 to receiving_integrator
  
Platform Account State:
  ├─ Charge received: +£100
  ├─ Transfer out: -£90
  └─ Platform retains: £10 ✓
  
Webhook: transfer.created
  └─ Update status: in_transit
  
Webhook: transfer.paid
  └─ Update status: paid
  └─ Payment lifecycle complete ✓
  
Result:
  Platform fee: £10 ✓ RETAINED
  Payment state: Complete ✓
  Revenue: Collected ✓
```

---

## PAYMENT LIFECYCLE (Model 2)

```
1️⃣ CHARGE INITIATED
   └─ PaymentIntent created on platform
   └─ Amount: £100 (full)
   └─ Customer: paying_integrator
   └─ Status: requires_payment_method

2️⃣ CUSTOMER CONFIRMS PAYMENT
   └─ Client-side: Confirm payment with Stripe.js
   └─ Status: succeeded

3️⃣ CHARGE SUCCEEDS
   └─ Webhook: payment_intent.succeeded
   └─ Amount: £100 on platform account
   └─ Status: succeeded

4️⃣ MANUAL TRANSFER CREATED
   └─ Webhook handler creates transfer
   └─ From: platform account
   └─ To: receiving_integrator.stripeConnectAccountId
   └─ Amount: £90 (net after platform fee)
   └─ Platform retains: £10
   └─ Status: pending

5️⃣ TRANSFER IN TRANSIT
   └─ Webhook: transfer.created
   └─ Status: in_transit

6️⃣ TRANSFER PAID TO BANK
   └─ Webhook: transfer.paid
   └─ Status: paid
   └─ Receiving integrator can withdraw to their bank
   └─ Payment lifecycle complete ✓

💰 FINAL STATE:
   ├─ Snatchi (Platform): £10 ✓
   ├─ Receiving Integrator: £90 ✓
   └─ Total: £100 ✓ (accounted for)
```

---

## SAFETY CHECKS IMPLEMENTED

### Check 1: Charge Amount Validation
```javascript
if (paymentIntent.amount !== payment.grossAmount) {
  throw new Error(`Amount mismatch: expected ${payment.grossAmount}, got ${paymentIntent.amount}`);
}
```
**Purpose**: Detect if Stripe charged wrong amount

---

### Check 2: Currency Validation
```javascript
if (paymentIntent.currency !== payment.currency) {
  throw new Error(`Currency mismatch: expected ${payment.currency}, got ${paymentIntent.currency}`);
}
```
**Purpose**: Detect if currency was changed during payment

---

### Check 3: Idempotency Check
```javascript
if (payment.transferId) {
  logger.warn('Transfer already created for this payment');
  return;  // Idempotent - don't create duplicate
}
```
**Purpose**: Prevent duplicate transfers if webhook fires twice

---

### Check 4: Transfer Amount Validation
```javascript
if (transfer.amount !== payment.netAmount) {
  logger.warn('Transfer amount mismatch', {
    expected: payment.netAmount,
    actual: transfer.amount
  });
}
```
**Purpose**: Detect if transfer amount was different than expected

---

### Check 5: Transfer Destination Validation
```javascript
if (transfer.destination !== payment.receivingIntegrator.stripeConnectAccountId) {
  logger.error('Transfer destination mismatch');
}
```
**Purpose**: Detect if transfer went to wrong account

---

## FEE RETENTION MECHANISM

### Automatic Fee Retention (No Code Needed)

When using Model 2 with manual transfers:

```
Balance Sheet (Platform Account):
  Debit  (incoming): +£100 (charge)
  Credit (outgoing): -£90 (transfer)
  ─────────────────
  Balance:            £10 (platform fee) ✓

No explicit fee withdrawal needed!
```

The platform automatically retains the difference between:
- Charge amount (£100)
- Transfer amount (£90)
- = Platform fee (£10)

This is handled by Stripe's accounting automatically.

---

## PRODUCTION READINESS CHECKLIST

- ✅ Model 2 architecture implemented
- ✅ `on_behalf_of` conflict removed
- ✅ `transfer_data` removed
- ✅ Safety checks added to payment webhook
- ✅ Safety checks added to transfer webhooks
- ✅ Logging enhanced with fee information
- ✅ Error handling improved
- ✅ Documentation updated
- ⏳ Testing required (see next section)
- ⏳ Staging environment validation
- ⏳ Production deployment

---

## TESTING REQUIRED

### Unit Tests
- [ ] Test `createCrossIntegratorPaymentIntent` creates charge on platform (not on receiving_integrator)
- [ ] Test payment webhook creates transfer with NET amount (not gross)
- [ ] Test safety checks detect amount mismatches
- [ ] Test idempotency - multiple webhook calls don't create duplicate transfers
- [ ] Test fee calculation: gross - net = fee

### Integration Tests  
- [ ] Full payment flow with test Stripe account
- [ ] Verify charge on platform account
- [ ] Verify transfer to receiving integrator account
- [ ] Verify platform fee retained
- [ ] Verify all three webhooks fire correctly
- [ ] Verify database state consistency

### End-to-End Tests
- [ ] E2E payment flow with test card (success)
- [ ] E2E payment flow with decline card (failure)
- [ ] E2E payment history pages show correct amounts
- [ ] E2E payment detail page shows fee breakdown

### Webhook Testing
- [ ] Test webhook deduplication prevents duplicate transfers
- [ ] Test webhook retry mechanism
- [ ] Test webhook error scenarios

### Financial Verification
- [ ] Platform balance = sum of all platform fees ✓
- [ ] Integrator received balance = sum of net amounts ✓
- [ ] Total = all charges collected ✓

---

## DEPLOYMENT STEPS

### Step 1: Staging Environment
```bash
# Deploy code to staging
git push staging main

# Run integration tests
npm run test:integration:payment

# Run E2E tests  
npm run test:e2e:stripe:payment

# Manually verify:
- Make test payment
- Check Stripe dashboard for charge on platform account
- Check transfer created to integrator account
- Check webhook processing in logs
```

### Step 2: Production Deployment
```bash
# Deploy to production
git push production main

# Monitor webhooks
- Check webhook processing logs
- Monitor transfer success rates
- Alert on any errors

# Verify for first 24 hours
- Sample random payments
- Verify charges and transfers
- Check platform account balance
```

---

## TROUBLESHOOTING

### Issue: Transfer Not Created
**Symptom**: Payment shows `succeeded` but `transferStatus` is `pending_retry`

**Cause**: 
- Receiving integrator not verified
- Receiving integrator's Connect account disabled
- Network error during transfer creation

**Solution**:
- Check receiving integrator's Connect status
- Check Stripe API logs for errors
- Retry transfer via admin function (to be implemented)

---

### Issue: Transfer Amount Mismatch
**Symptom**: Log shows `Transfer amount mismatch`

**Cause**:
- Platform fee changed mid-transaction
- Partial transfer occurred
- Stripe fee deducted (shouldn't happen)

**Solution**:
- Investigate why transfer amount differs
- May indicate Stripe account issue
- Review audit log for fee changes

---

### Issue: Webhook Not Processing
**Symptom**: Transfer webhook never fires

**Cause**:
- Webhook not registered in Stripe
- Webhook endpoint unreachable
- Webhook deduplication blocking duplicate

**Solution**:
- Verify webhook registered for `transfer.created` and `transfer.paid`
- Check webhook endpoint logs
- Verify webhook signature validation working

---

## ROLLBACK PLAN

If critical issues found:

1. Disable payment creation (block new payments)
2. Revert code to previous version
3. Manually process pending payments via admin function (to be implemented)
4. Investigate root cause
5. Fix and re-test before re-enabling

---

## NEXT STEPS

### Immediate (This Week)
- [ ] Run unit tests for payment functions
- [ ] Run integration tests with Stripe test account
- [ ] Manual smoke test in staging
- [ ] Deploy to production (with monitoring)

### Short Term (Next Week)  
- [ ] Monitor payment success rates
- [ ] Collect transfer timing metrics
- [ ] User feedback on payment flow
- [ ] Audit fee retention calculations

### Medium Term (Next Month)
- [ ] Implement admin manual transfer retry
- [ ] Implement payment refund flow
- [ ] Implement payment analytics dashboard
- [ ] Add partial payment support
- [ ] Add payment split support

---

## REVISION HISTORY

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0 | May 21, 2026 | Model 2 implementation | ✅ Complete |
| 1.1 | - | Safety checks added | ✅ Complete |
| 2.0 | TBD | Refund support | ⏳ Planned |
| 2.1 | TBD | Payment analytics | ⏳ Planned |

---

**Status**: ✅ Ready for Testing & Deployment

All critical architectural issues have been resolved. The implementation now correctly uses Model 2 (Separate Charges & Transfers) with proper fee retention and comprehensive safety checks.

Next action: Proceed to testing phase.
