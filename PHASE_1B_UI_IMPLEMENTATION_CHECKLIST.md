# Phase 1B: UI Implementation Checklist & Next Steps

**Status:** Backend ✅ COMPLETE | UI ⏳ PENDING  
**Date Created:** May 20, 2026  
**Priority:** HIGH - Unblocks payment MVP

---

## Overview

Phase 1B backend is production-ready. The following UI components and integrations are needed to complete the MVP:

1. **Payment Modal** - Create/confirm payment flow
2. **Payment History Views** - User-facing payment records
3. **Success/Error Pages** - Confirmation and error states
4. **Data-TestID Selectors** - For E2E test stability

This document serves as the specification for UI team implementation.

---

## Components to Build

### 1. Payment Modal Component

**Location:** `/app/protected/integrator/components/PaymentModal.tsx`

**Purpose:** Allow integrators to pay for engineer bookings

**Props:**
```typescript
interface PaymentModalProps {
  schedulerId: string;              // Booking ID
  engineerId: string;               // Engineer being paid for
  amount: number;                   // In pence/cents
  receivingIntegratorId: string;    // Engineer's company
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}
```

**Required Sections:**

#### a) Header
```tsx
<div data-testid="payment-modal-header">
  <h2>Pay for Engineer Service</h2>
  <button data-testid="payment-close-btn" onClick={onClose}>✕</button>
</div>
```

#### b) Amount Breakdown
```tsx
<div data-testid="payment-breakdown">
  <div data-testid="payment-gross-amount">
    Gross Amount: £{(amount / 100).toFixed(2)}
  </div>
  <div data-testid="payment-platform-fee">
    Platform Fee (10%): £{(platformFee / 100).toFixed(2)}
  </div>
  <div data-testid="payment-net-amount">
    <strong>{receivingIntegrator.name} receives: £{(netAmount / 100).toFixed(2)}</strong>
  </div>
</div>
```

#### c) Party Information
```tsx
<div data-testid="payment-parties">
  <div data-testid="payment-paying-integrator">
    You (TechCorp) will be charged
  </div>
  <div data-testid="payment-engineer-name">
    Engineer: {engineer.name}
  </div>
  <div data-testid="payment-receiving-integrator">
    <strong>⚠️ {receivingIntegrator.name} will receive £{(netAmount / 100).toFixed(2)}</strong>
  </div>
</div>
```

#### d) Payment Form with Stripe CardElement
```tsx
<form onSubmit={handleSubmit} data-testid="payment-form">
  <label htmlFor="card-element">Card Details</label>
  <CardElement 
    id="card-element"
    data-testid="stripe-card-element"
    options={{
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#fa755a',
        },
      },
    }}
  />
  {cardError && (
    <div data-testid="payment-card-error" style={{ color: 'red' }}>
      {cardError}
    </div>
  )}
</form>
```

#### e) Action Buttons
```tsx
<div data-testid="payment-actions">
  <button 
    data-testid="payment-cancel"
    onClick={onClose}
    disabled={isProcessing}
  >
    Cancel
  </button>
  <button 
    data-testid="payment-submit"
    onClick={handlePayment}
    disabled={isProcessing}
  >
    {isProcessing ? 'Processing...' : 'Pay Now'}
  </button>
</div>
```

**Logic Flow:**
1. User clicks "Pay" button for engineer booking
2. Modal opens, calls `/api/stripe/payment/create-intent`
3. Get `paymentIntentId` and `clientSecret` from API
4. User enters card details into CardElement
5. On submit, call `stripe.confirmCardPayment(clientSecret, {...})`
6. Handle response:
   - ✅ Success → Show success message, call onSuccess()
   - ⚠️ 3D Secure → Redirect user, poll for completion
   - ❌ Error → Show error message, allow retry

**Error Handling:**
```typescript
try {
  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: { name: session.user.name }
    }
  });

  if (result.error) {
    setCardError(result.error.message);
  } else if (result.paymentIntent.status === 'succeeded') {
    onSuccess(result.paymentIntent.id);
  } else if (result.paymentIntent.status === 'requires_action') {
    // 3D Secure required
    await confirmCardPayment(result.paymentIntent.client_secret);
  }
} catch (error) {
  onError(error.message);
}
```

---

### 2. Payments Made History View

**Location:** `/app/protected/integrator/payments/made/page.tsx`

**Purpose:** Show all payments created by current integrator

**Required Elements:**

#### a) Header
```tsx
<div data-testid="payments-made-header">
  <h1>Payments Made</h1>
  <div data-testid="payments-made-total">
    Total Paid: £{totalPaid}
  </div>
</div>
```

#### b) Filters
```tsx
<div data-testid="payment-filters">
  <select 
    data-testid="payment-filter-status"
    onChange={(e) => setStatus(e.target.value)}
  >
    <option value="">All Statuses</option>
    <option value="succeeded">Succeeded</option>
    <option value="failed">Failed</option>
    <option value="pending">Pending</option>
  </select>
</div>
```

#### c) Table/List
```tsx
<table data-testid="payment-history-table">
  <thead>
    <tr>
      <th>Date</th>
      <th>Engineer</th>
      <th>Company</th>
      <th>Gross</th>
      <th>Fee</th>
      <th>Net Paid</th>
      <th>Status</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    {payments.map(payment => (
      <tr key={payment.paymentId} data-testid={`payment-row-${payment.paymentId}`}>
        <td>{new Date(payment.date).toLocaleDateString()}</td>
        <td>{payment.engineer.name}</td>
        <td>{payment.receivingIntegrator.name}</td>
        <td>£{(payment.amounts.gross / 100).toFixed(2)}</td>
        <td>£{(payment.amounts.fee / 100).toFixed(2)}</td>
        <td>£{(payment.amounts.net / 100).toFixed(2)}</td>
        <td data-testid={`payment-status-${payment.paymentId}`}>
          {payment.status}
        </td>
        <td>
          <Link href={`/protected/payments/${payment.paymentId}`}>
            View
          </Link>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

#### d) Pagination
```tsx
<div data-testid="payment-pagination">
  <button 
    data-testid="payment-prev-page"
    onClick={() => setOffset(offset - limit)}
    disabled={offset === 0}
  >
    Previous
  </button>
  <span>Page {currentPage} of {totalPages}</span>
  <button 
    data-testid="payment-next-page"
    onClick={() => setOffset(offset + limit)}
    disabled={!hasMore}
  >
    Next
  </button>
</div>
```

**API Call:**
```typescript
const response = await fetch(
  `/api/stripe/integrator/payments-made?status=${status}&limit=20&offset=${offset}`
);
const { payments, pagination, summary } = await response.json();
```

---

### 3. Payments Received History View

**Location:** `/app/protected/integrator/payments/received/page.tsx`

**Purpose:** Show all payments received when engineers' services were paid for

**Similar to Payments Made, but:**
- Show **paying integrator** name (who paid)
- Show **net amount** received (after platform fee already deducted)
- Endpoint: `/api/stripe/integrator/payments-received`

```typescript
// Key difference: Display net amount as what company receives
<td>£{(payment.amounts.net / 100).toFixed(2)}</td>
```

---

### 4. Payment Detail Page

**Location:** `/app/protected/payments/[paymentId]/page.tsx`

**Purpose:** Show complete payment details with timeline

**Required Sections:**

#### a) Header with Status Badge
```tsx
<div data-testid="payment-detail-header">
  <h1>Payment #{paymentId}</h1>
  <span 
    data-testid={`payment-status-${paymentStatus}`}
    className={`badge badge-${paymentStatus}`}
  >
    {paymentStatus}
  </span>
</div>
```

#### b) Amount Summary
```tsx
<div data-testid="payment-summary">
  <div data-testid="payment-gross-total">
    <strong>Gross Amount:</strong> £{(gross / 100).toFixed(2)}
  </div>
  <div data-testid="payment-fee-deducted">
    <strong>Platform Fee (10%):</strong> -£{(fee / 100).toFixed(2)}
  </div>
  <div data-testid="payment-net-received">
    <strong>Net Received:</strong> £{(net / 100).toFixed(2)}
  </div>
</div>
```

#### c) Party Information
```tsx
<div data-testid="payment-parties">
  <div data-testid="payment-party-paying">
    <strong>Paid By:</strong> {payingIntegrator.name}
  </div>
  <div data-testid="payment-party-receiving">
    <strong>Received By:</strong> {receivingIntegrator.name}
  </div>
  <div data-testid="payment-party-engineer">
    <strong>For Engineer:</strong> {engineer.name}
  </div>
</div>
```

#### d) Timeline
```tsx
<div data-testid="payment-timeline">
  <div data-testid="payment-timeline-initiated" className={paymentInitiatedAt ? 'done' : 'pending'}>
    ✓ Payment Initiated: {new Date(paymentInitiatedAt).toLocaleString()}
  </div>
  <div data-testid="payment-timeline-charged" className={paymentSucceededAt ? 'done' : 'pending'}>
    {paymentSucceededAt ? '✓' : '⏳'} Payment Charged: {paymentSucceededAt ? new Date(paymentSucceededAt).toLocaleString() : 'Pending'}
  </div>
  <div data-testid="payment-timeline-transfer-created" className={transferInitiatedAt ? 'done' : 'pending'}>
    {transferInitiatedAt ? '✓' : '⏳'} Transfer Created: {transferInitiatedAt ? new Date(transferInitiatedAt).toLocaleString() : 'Pending'}
  </div>
  <div data-testid="payment-timeline-transfer-paid" className={transferPaidAt ? 'done' : 'pending'}>
    {transferPaidAt ? '✓' : '⏳'} Transfer Paid: {transferPaidAt ? new Date(transferPaidAt).toLocaleString() : 'Pending'}
  </div>
</div>
```

#### e) Associated Booking
```tsx
{scheduler && (
  <div data-testid="payment-booking">
    <strong>Service:</strong> {scheduler.title}
    <strong>Dates:</strong> {new Date(scheduler.startDate).toLocaleDateString()} - {new Date(scheduler.endDate).toLocaleDateString()}
    <Link href={`/protected/projects/${scheduler.project}/booking/${scheduler._id}`}>
      View Booking
    </Link>
  </div>
)}
```

---

### 5. Payment Error Page

**Location:** `/app/protected/payments/error/page.tsx`

**Purpose:** Show payment failure with next steps

```tsx
<div data-testid="payment-error">
  <h1>Payment Failed</h1>
  <p data-testid="payment-error-message">
    {error.message}
  </p>
  <p>Your card was not charged.</p>
  <button onClick={() => router.back()}>
    Try Again
  </button>
</div>
```

---

### 6. Payment Success Page

**Location:** `/app/protected/payments/success/page.tsx`

**Purpose:** Confirm payment succeeded

```tsx
<div data-testid="payment-success">
  <div data-testid="payment-success-icon">✓</div>
  <h1>Payment Successful!</h1>
  <p data-testid="payment-success-message">
    £{(amount / 100).toFixed(2)} has been sent to {receivingIntegrator.name}
  </p>
  <p>Payment ID: {paymentId}</p>
  <Link href={`/protected/payments/${paymentId}`} data-testid="payment-success-details">
    View Payment Details
  </Link>
</div>
```

---

## Data-TestID Selectors Map

### Payment Modal
```
payment-modal
payment-modal-header
payment-close-btn
payment-breakdown
payment-gross-amount
payment-platform-fee
payment-net-amount
payment-parties
payment-paying-integrator
payment-engineer-name
payment-receiving-integrator
payment-form
stripe-card-element
payment-card-error
payment-actions
payment-cancel
payment-submit
```

### Payment History
```
payments-made-header
payments-made-total
payment-filters
payment-filter-status
payment-history-table
payment-row-{paymentId}
payment-status-{paymentId}
payment-pagination
payment-prev-page
payment-next-page
```

### Payment Detail
```
payment-detail-header
payment-status-{status} (e.g., payment-status-succeeded)
payment-summary
payment-gross-total
payment-fee-deducted
payment-net-received
payment-parties
payment-party-paying
payment-party-receiving
payment-party-engineer
payment-timeline
payment-timeline-initiated
payment-timeline-charged
payment-timeline-transfer-created
payment-timeline-transfer-paid
payment-booking
```

### Error/Success
```
payment-error
payment-error-message
payment-success
payment-success-icon
payment-success-message
payment-success-details
```

---

## Integration Checklist

### Before Implementation
- [ ] Review Phase 1B backend docs (PHASE_1B_CROSS_INTEGRATOR_PAYMENT_IMPLEMENTATION.md)
- [ ] Review QA report (PHASE_1B_CROSS_INTEGRATOR_PAYMENT_QA_REPORT.md)
- [ ] Verify Stripe test mode credentials in .env.local
- [ ] Confirm NextAuth session includes `integrator_id` and `role`
- [ ] Set up test integrators and bookings in local DB

### Component Development
- [ ] Build PaymentModal component
- [ ] Build Payments Made view
- [ ] Build Payments Received view
- [ ] Build Payment Detail page
- [ ] Build Error/Success pages
- [ ] Add all data-testid selectors (41 total)
- [ ] Add error handling for all states
- [ ] Add loading states
- [ ] Add accessibility attributes (ARIA labels)

### Integration Testing
- [ ] Test payment creation flow end-to-end
- [ ] Test card validation (valid/invalid/declined cards)
- [ ] Test 3D Secure flow (if available in test mode)
- [ ] Test error states (network failure, card declined, etc.)
- [ ] Test payment history displays
- [ ] Test pagination
- [ ] Test success page display

### E2E Testing
- [ ] Run Playwright tests: `npm run test:e2e -- --grep "@phase1b"`
- [ ] Test with mocked Stripe (test mode)
- [ ] Verify all 41+ test selectors work
- [ ] Test happy path: create payment → confirm → display in history
- [ ] Test failure cases: blocked payments, unverified integrator, etc.

### Performance Testing
- [ ] Modal opens < 500ms
- [ ] Payment history loads < 1s
- [ ] Detail page loads < 500ms
- [ ] No unnecessary API calls
- [ ] List pagination works smoothly

### Accessibility
- [ ] Keyboard navigation works (Tab through form)
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Error messages clearly visible
- [ ] Loading states announced to screen readers

### Before Merging to Main
- [ ] All E2E tests pass
- [ ] All accessibility checks pass
- [ ] Code review approved
- [ ] No console errors/warnings
- [ ] Mobile responsive (test on mobile + tablet)
- [ ] Works with light & dark mode (if applicable)

---

## API Dependencies

All these APIs are already implemented in backend:

| Endpoint | Method | Purpose | Status |
|---|---|---|---|
| `/api/stripe/payment/create-intent` | POST | Create payment intent | ✅ READY |
| `/api/stripe/payment/confirm` | POST | Confirm payment status | ✅ READY |
| `/api/stripe/payment/status` | GET | Get payment details | ✅ READY |
| `/api/stripe/integrator/payments-made` | GET | List payments made | ✅ READY |
| `/api/stripe/integrator/payments-received` | GET | List payments received | ✅ READY |

**No backend changes needed** - All APIs ready for UI consumption

---

## Testing Test Card Numbers

Use these in test mode (Stripe Sandbox):

| Card Number | Behavior | Use Case |
|---|---|---|
| 4242 4242 4242 4242 | ✅ Succeeds | Happy path |
| 4000 0000 0000 0002 | ❌ Declines | Error handling |
| 4000 0025 0000 3155 | 🔐 3D Secure | 3D Secure flow |
| 5555 5555 5555 4444 | ✅ Succeeds (Mastercard) | Card variation |

---

## Estimated Timeline

| Phase | Duration | Tasks |
|---|---|---|
| Planning | 1-2 days | Review specs, design components |
| Development | 3-5 days | Build 6 components, add selectors |
| Testing | 2-3 days | E2E tests, accessibility, mobile |
| Refinement | 1-2 days | Bug fixes, performance optimization |
| **Total** | **~2 weeks** | Ready for production merge |

---

## Known Limitations (Don't Build Yet)

These are Phase 2 features - **DO NOT IMPLEMENT**:
- ❌ Refund button/UI
- ❌ Dispute system
- ❌ Admin dashboard
- ❌ Advanced payment analytics
- ❌ Recurring payment setup
- ❌ Email notification settings

---

## Questions & Support

### For API Integration Issues
- Check PHASE_1B_CROSS_INTEGRATOR_PAYMENT_IMPLEMENTATION.md
- Review example API responses in QA report
- Check test helpers for mock data

### For UI Design Questions
- Follow existing Snatchi design system
- Use data-testid selectors exactly as specified
- Match color scheme to checkout page

### For Test Environment Setup
- See test data factories in `e2e/tests/payment-test-helpers.ts`
- Run seeding script: `npm run seed:test-data`
- Check .env.local has Stripe test credentials

---

## Sign-Off Template

When UI is ready:

```
UI Implementation Complete
✅ All 6 components built
✅ All 41+ data-testid selectors added
✅ All E2E tests passing
✅ Accessibility verified
✅ Mobile responsive tested
✅ Code review approved

Ready for: Staging → Production Deployment
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-20  
**Status:** Ready for UI Team Implementation
