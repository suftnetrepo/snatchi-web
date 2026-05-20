# Stripe Connect Engineer Payment Flow - Audit & Implementation Plan

**Date:** May 20, 2026  
**Status:** Design Phase (No Code Written)  
**Scope:** Marketplace/service payments for engineer work  
**Goal:** Enable integrators to pay engineers for services while maintaining existing subscription billing

---

## SECTION 1: CURRENT STATE AUDIT

### 1.1 Integrator Model Analysis

**File:** `app/api/models/integrator.js`

**Current Subscription-Related Fields:**
```
- stripeCustomerId: Stripe customer ID for subscription billing
- subscriptionId: Active subscription ID
- plan: Current plan name
- priceId: Stripe price ID for recurring charges
- status: Subscription status (from Stripe webhooks)
- trial_start: Trial period start
- trial_end: Trial period end
- currency: Account currency (default '£')
- tax_rate: Tax percentage (0-9)
```

**Missing Fields for Engineer Payments:**
- ❌ stripeConnectAccountId (required for marketplace)
- ❌ connectAccountStatus (verification status)
- ❌ platformFeePercentage (commission rate)
- ❌ payoutSettings (bank account, frequency)
- ❌ businessType (sole trader, company, etc.)

**Verdict:** Integrators are set up for B2B SaaS subscriptions but have NO marketplace account fields.

---

### 1.2 User/Engineer Model Analysis

**File:** `app/api/models/user.js`

**Current Fields:**
```
- role: Can be 'engineer' (among other roles)
- email, first_name, last_name, mobile
- address: Full address with location
- secure_url/public_id: Profile image
- fcm: Firebase messaging token
- attachments: Portfolio documents
```

**Missing Fields for Payments:**
- ❌ stripeConnectAccountId (Express account for payouts)
- ❌ connectAccountStatus (one_time_verification_complete, verified, restricted, etc.)
- ❌ payoutSchedule (daily, weekly, monthly)
- ❌ bankAccountOnFile (boolean flag)
- ❌ ssn (for Connect onboarding - US only)
- ❌ businessType (if registering as business)
- ❌ totalEarnings (cumulative payout amount)
- ❌ stripeConnectRejectReason (if onboarding failed)
- ❌ connectOnboardingCompletedAt (timestamp)

**Verdict:** Engineers have no Connect account integration; would need significant schema expansion.

---

### 1.3 Scheduler Model Analysis

**File:** `app/api/models/scheduler.js`

**Current Structure:**
```
{
  integrator: ObjectId (ref: Integrator)
  engineer: ObjectId (ref: User)
  project: ObjectId (ref: Project)
  status: ['Pending', 'Declined', 'Accepted', 'Paid', 'Completed', 'Cancelled', 'Progress']
  title, description, startDate, endDate, startTime, endTime
  timestamps: createdAt, updatedAt
}
```

**Missing Fields for Payment Tracking:**
- ❌ rate: Hourly/daily rate for this assignment
- ❌ estimatedHours: Planned hours
- ❌ estimatedAmount: Calculated amount (rate × hours)
- ❌ actualHours: Tracked hours (if time tracking enabled)
- ❌ actualAmount: Final billable amount
- ❌ paymentIntentId: Stripe PaymentIntent ID
- ❌ paymentStatus: payment_pending, payment_succeeded, payment_failed
- ❌ chargeId: Stripe charge ID (if payment collected)
- ❌ transferId: Stripe Connect transfer ID (payout to engineer)
- ❌ platformFeeAmount: Commission amount deducted
- ❌ engineerPayoutAmount: Amount engineer receives
- ❌ invoiceId: Reference to invoice if payment pre-generated
- ❌ paymentDueDate: When payment is due/happens
- ❌ paymentCollectedAt: Timestamp of successful payment
- ❌ refundId: If refund issued
- ❌ disputeId: If payment disputed

**Verdict:** Status 'Paid' exists but NO payment tracking infrastructure.

---

### 1.4 Project Model Analysis

**File:** `app/api/models/project.js`

**Current Structure:**
```
{
  integrator: ObjectId
  name, description, status: ['Pending', 'Progress', 'Completed', 'Canceled']
  startDate, endDate
  priority, budget
  assignedTo: [{ id: ObjectId }]
  attachments, address fields
}
```

**Issue:** Budget field exists but isn't linked to engineer payments.

**Verdict:** Projects track budget at project level, not per-engineer assignment.

---

### 1.5 Invoice Model Analysis

**File:** `app/api/models/invoice.js`

**Current Purpose:** Invoice generation for integrators/users, not marketplace payments

**Current Structure:**
```
{
  integrator, user
  issueDate, due_on
  status: ['Paid', 'Unpaid', 'Cancelled']
  invoice_type: ['Quote', 'Save', 'Draft']
  items: [{ description, unit, duration, rate, date }]
  subtotal, tax, discount, totalAmount
}
```

**Problem:** This model is for invoices TO integrators, not FOR engineer payments FROM integrators.

**Verdict:** NOT suitable for engineer marketplace payments; would need new Payment/Transaction model.

---

### 1.6 Existing Stripe Integration Analysis

**Files:**
- `app/api/stripe/customer/route.js` - Creates Stripe customers for integrators
- `app/api/webhooks/route.js` - Handles subscription webhooks
- `app/api/services/webHooksService.js` - Subscription event handlers
- `app/api/subscriber/route.js` - Subscription management

**Current Capabilities:**
```
✅ Create Stripe customers (integrators)
✅ Manage subscriptions (recurring billing)
✅ Handle webhook events:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   - customer.subscription.trial_will_end
   - customer.source.updated
✅ Customer Portal integration (manage billing)
✅ Webhook deduplication (prevent double-processing)
```

**Missing for Marketplace:**
```
❌ Stripe Connect Express account creation
❌ Connect account verification webhooks
❌ Payment Intent / Checkout Session creation
❌ Payment confirmation flow
❌ Transfer creation (payout to engineers)
❌ Refund handling
❌ Dispute handling
❌ Platform fee logic
```

**Verdict:** Strong foundation for subscriptions, but NO marketplace payment infrastructure.

---

### 1.7 Status Constants Analysis

**File:** `app/api/constants/statuses.js`

**Scheduler Status Enum:**
```javascript
SCHEDULER_STATUS = {
  PENDING: 'Pending',
  DECLINED: 'Declined',
  ACCEPTED: 'Accepted',
  PAID: 'Paid',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PROGRESS: 'Progress'
}
```

**Issue:** Status jump from 'Accepted' → 'Paid' but no intermediate states for payment processing.

**Current Problems:**
- No state for "AwaitingPayment" (accepted but not yet paid)
- No state for "PaymentPending" (payment processing)
- No state for "PaymentFailed" (payment attempt failed)
- No state for "Released" (engineer payout released)
- No state for "Refunded" (payment refunded)
- No state for "Disputed" (payment disputed)

**Verdict:** Needs expansion for marketplace payment lifecycle.

---

### 1.8 Engineer Acceptance/Assignment Flow Analysis

**File:** `app/api/services/scheduler.js`

**Current Flow:**
1. Integrator creates Scheduler record with:
   - `status: 'Pending'`
   - Engineer assigned
   - Project assigned
   - Start/end dates and times

2. Engineer receives notification (via FCM)

3. Engineer accepts/declines (updates status to 'Accepted'/'Declined')

4. No further payment-related flow exists

**Missing Steps:**
- No rate/amount confirmation before acceptance
- No payment collection trigger
- No payout scheduling
- No dispute resolution

**Verdict:** Basic assignment flow exists; payment logic completely absent.

---

### 1.9 Stripe Webhook Configuration

**Current Webhook Endpoint:** `POST /api/webhooks`

**Configured Events:**
- ✅ customer.subscription.* (3 events)
- ✅ invoice.payment_* (2 events)
- ✅ customer.source.updated
- ✅ customer.subscription.trial_will_end

**Missing Events for Marketplace:**
- ❌ account.updated (engineer Connect account status)
- ❌ account.external_account.created/updated (bank account)
- ❌ payment_intent.succeeded
- ❌ payment_intent.payment_failed
- ❌ charge.refunded
- ❌ transfer.created
- ❌ transfer.paid
- ❌ charge.dispute.*

**Verdict:** Webhook infrastructure exists but NOT configured for Connect events.

---

## SECTION 2: RECOMMENDED ARCHITECTURE

### 2.1 Payment Flow Overview

```
INTEGRATOR ASSIGNS ENGINEER
        ↓
ENGINEER ACCEPTS
        ↓
INTEGRATOR INITIATES PAYMENT
        ↓
ENGINEER MUST BE ONBOARDED (Check Status)
        ↓
PAYMENT COLLECTED FROM INTEGRATOR
        ↓
PLATFORM FEE DEDUCTED
        ↓
PAYOUT CREATED FOR ENGINEER
        ↓
PAYOUT RELEASED (Manual or Automatic)
        ↓
ENGINEER RECEIVES FUNDS
```

### 2.2 Payment Timing Decision: **Upfront (Before Work)**

**Rationale:**
- ✅ Integrators pre-fund work (reduces fraud/non-payment risk)
- ✅ Engineers have payment certainty before starting
- ✅ Simpler refund/dispute flow (vs. post-completion)
- ✅ Aligns with existing Stripe Subscription model (prepayment)
- ✅ Reduces accounting complexity

**Timeline:**
1. Scheduler created with rate → Status: `Pending`
2. Engineer accepts → Status: `Accepted`
3. Integrator pays → Status: `AwaitingPayment` (during processing)
4. Payment succeeds → Status: `Paid`
5. Engineer starts work → Status: `Progress`
6. Work completes → Status: `Completed`
7. Optional: Payout released → Status: `Released` (if manual)

### 2.3 Payout Strategy: **Manual Release (Admin/Integrator Review)**

**Rationale:**
- ✅ Quality assurance (review work before releasing payout)
- ✅ Dispute resolution window (handle customer complaints)
- ✅ Prevents fraud (engineer completes, never starts work)
- ✅ Flexibility in payout scheduling
- ⚠️ Adds operational overhead

**Alternative (Phase 2):** Automatic on work completion (7-day review window)

---

## SECTION 3: STRIPE CONNECT ARCHITECTURE

### 3.1 Engineer Connect Account Setup

**Account Type:** Stripe Connect Express Account

**Why Express (not Custom):**
- ✅ Stripe handles account verification
- ✅ Built-in onboarding (no custom form building)
- ✅ Native bank account verification
- ✅ Compliance handling (KYC/AML)
- ✅ Lower PCI compliance burden

### 3.2 Required Engineer Fields for Onboarding

**Phase 1: Basic (Required for all)**
```
First Name
Last Name
Email
Date of Birth (for individual accounts)
Address (Street, City, State/Province, Postal Code, Country)
Phone Number
```

**Phase 2: Business Type**
```
Business Type:
  - 'individual' (sole trader/freelancer)
  - 'sole_proprietorship' (unincorporated business)
  - 'partnership' (multiple owners)
  - 'private_corporation' (limited company)
  - 'public_corporation' (public company)
  - 'government_entity'
  - 'nonprofit'
```

**Phase 3: Bank Account (Collected by Stripe via onboarding)**
```
Stripe handles securely in Express account
- Routing number (US)
- Account number
- Account type (checking/savings)
- Account holder name
```

**Phase 4: Optional (Captured in app)**
```
Tax ID / SSN (if required by jurisdiction)
Business Registration Number (if business type)
Preferred Payout Schedule (weekly, monthly, manual)
```

### 3.3 Onboarding Flow

**Text Sequence Diagram:**

```
ENGINEER PROFILE
        ↓
[Setup Payout Account Button]
        ↓
Frontend: POST /api/stripe/engineer/create-onboarding-link
  - Params: engineerId
  - Returns: { onboardingUrl }
        ↓
BROWSER REDIRECTS TO STRIPE ONBOARDING
  URL: https://connect.stripe.com/express/...
        ↓
ENGINEER COMPLETES STRIPE ONBOARDING
  - Enters personal/business info
  - Provides banking details
  - Verifies identity (if required)
        ↓
STRIPE REDIRECTS TO APP
  - Success: /protected/engineer/payout-setup?status=success
  - Refresh: /protected/engineer/payout-setup?status=refresh_required
  - Return: /protected/engineer/payout-setup?status=user_canceled
        ↓
STRIPE SENDS WEBHOOK
  account.updated { account_id, charges_enabled, payouts_enabled }
        ↓
APP RECORDS COMPLETION STATUS
  - User.connectAccountStatus = 'verified'
  - User.connectOnboardingCompletedAt = now
```

### 3.4 Account Status Tracking

**User.connectAccountStatus Values:**
```
null / undefined           → Not started
'onboarding_started'       → Link clicked, form in progress
'one_time_verification_complete' → Basic info verified, might need docs
'verified'                 → Full verification complete (payouts_enabled=true)
'restricted'               → Account restricted (charges_enabled=false or payouts_enabled=false)
'restricted.under_review'  → Under review by Stripe risk team
'requirements_pending'     → Awaiting additional documents
'verification_failed'      → Failed verification (e.g., fraud)
```

### 3.5 Return/Refresh URL Strategy

**URLs Configured in Stripe Dashboard:**

```
Express Account Settings:
├── Onboarding Completion URL:
│   └── https://yourapp.com/protected/engineer/payout-setup?status=success
│
├── Refresh URL (if user exits early):
│   └── https://yourapp.com/protected/engineer/payout-setup?status=refresh_required
│
└── Return URL (if user manually returns):
    └── https://yourapp.com/protected/engineer/payout-setup?status=user_canceled
```

**Frontend Behavior:**
```
/protected/engineer/payout-setup
├── ?status=success → Show "Account set up successfully! You can now receive payments."
├── ?status=refresh_required → Show "Please complete your account setup to receive payments." + [Resume Setup] button
└── ?status=user_canceled → Show "You closed the setup window. Click [Resume] to continue."
```

### 3.6 Webhook: account.updated

**When Fired:**
- Account verification status changes
- KYC requirements pending
- Charges/payouts enabled/disabled
- Risk restrictions applied

**Payload Example:**
```json
{
  "id": "evt_...",
  "type": "account.updated",
  "data": {
    "object": {
      "id": "acct_...",
      "charges_enabled": true,
      "payouts_enabled": true,
      "requirements": {
        "current_deadline": null,
        "currently_due": [],
        "eventually_due": [],
        "past_due": [],
        "pending_verification": []
      },
      "restrictions": []
    }
  }
}
```

**App Action:**
1. Extract `account.charges_enabled` and `account.payouts_enabled`
2. Find User by `stripeConnectAccountId`
3. Update `User.connectAccountStatus`
4. Update `User.bankAccountOnFile` = true if enabled
5. Notify engineer (email/push) of status change
6. If verification failed, include reason in notification

---

## SECTION 4: DATABASE SCHEMA CHANGES

### 4.1 User/Engineer Model Additions

**File:** `app/api/models/user.js`

**New Fields to Add:**

```javascript
// Stripe Connect Account Fields
stripeConnectAccountId: {
  type: String,
  trim: true,
  default: '',
  sparse: true // Allow null for non-engineers
},
connectAccountStatus: {
  type: String,
  enum: [
    null,
    'onboarding_started',
    'one_time_verification_complete',
    'verified',
    'restricted',
    'restricted.under_review',
    'requirements_pending',
    'verification_failed'
  ],
  default: null
},
connectOnboardingStartedAt: {
  type: Date,
  default: null
},
connectOnboardingCompletedAt: {
  type: Date,
  default: null
},
connectRejectReason: {
  type: String,
  trim: true,
  default: '' // e.g., "Failed identity verification"
},
payoutSchedule: {
  type: String,
  enum: ['daily', 'weekly', 'monthly', 'manual'],
  default: 'manual'
},
bankAccountOnFile: {
  type: Boolean,
  default: false
},
totalEarnings: {
  type: Number,
  default: 0 // Cumulative across all projects
},
totalPayoutsReleased: {
  type: Number,
  default: 0 // Amount actually transferred to bank
},
lastPayoutDate: {
  type: Date,
  default: null
},
// Business info (captured during onboarding or app profile setup)
businessType: {
  type: String,
  enum: [
    'individual',
    'sole_proprietorship',
    'partnership',
    'private_corporation',
    'public_corporation',
    'government_entity',
    'nonprofit'
  ],
  default: 'individual'
},
businessName: {
  type: String,
  trim: true,
  default: ''
},
taxId: {
  type: String,
  trim: true,
  default: ''
},
ssn: {
  type: String,
  trim: true,
  default: '' // Only for US individual accounts
}
```

### 4.2 Scheduler Model Additions

**File:** `app/api/models/scheduler.js`

**New Fields to Add:**

```javascript
// Payment-related fields
rate: {
  type: Number,
  required: false,
  default: 0 // Hourly or daily rate
},
rateType: {
  type: String,
  enum: ['hourly', 'daily', 'fixed', 'percentage'],
  default: 'hourly'
},
estimatedHours: {
  type: Number,
  required: false,
  default: 0 // For rate calculation
},
estimatedAmount: {
  type: Number,
  required: false,
  default: 0 // Calculated: rate * estimatedHours
},
actualHours: {
  type: Number,
  required: false,
  default: 0 // Tracked if time tracking enabled
},
actualAmount: {
  type: Number,
  required: false,
  default: 0 // Final billable amount
},
// Stripe Payment Fields
paymentIntentId: {
  type: String,
  trim: true,
  default: '' // Stripe PaymentIntent ID
},
paymentStatus: {
  type: String,
  enum: [
    'pending',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'disputed'
  ],
  default: 'pending'
},
chargeId: {
  type: String,
  trim: true,
  default: '' // Stripe Charge ID (if payment collected)
},
// Payout Fields
transferId: {
  type: String,
  trim: true,
  default: '' // Stripe Transfer ID to engineer's Connect account
},
platformFeePercentage: {
  type: Number,
  default: 10 // Default 10% platform commission
},
platformFeeAmount: {
  type: Number,
  default: 0 // Calculated: estimatedAmount * (platformFeePercentage / 100)
},
engineerPayoutAmount: {
  type: Number,
  default: 0 // Engineer receives: estimatedAmount - platformFeeAmount
},
// Timeline Fields
paymentInitiatedAt: {
  type: Date,
  default: null // When integrator clicked "Pay Engineer"
},
paymentCollectedAt: {
  type: Date,
  default: null // When payment succeeded
},
payoutReleasedAt: {
  type: Date,
  default: null // When admin/system released payout
},
refundId: {
  type: String,
  trim: true,
  default: '' // Stripe Refund ID (if refunded)
},
refundedAt: {
  type: Date,
  default: null
},
refundReason: {
  type: String,
  trim: true,
  default: ''
},
disputeId: {
  type: String,
  trim: true,
  default: '' // Stripe Dispute ID (if payment disputed)
},
disputeReason: {
  type: String,
  trim: true,
  default: ''
},
// Metadata
paymentNotes: {
  type: String,
  trim: true,
  default: ''
},
isPublishablePayment: {
  type: Boolean,
  default: false // True if payment details visible to engineer before accepting
}
```

### 4.3 New Payment/Transaction Model

**File:** `app/api/models/payment.js` (CREATE NEW)

**Purpose:** Track all marketplace payments for audit, reporting, and reconciliation

```javascript
const paymentSchema = new mongoose.Schema(
  {
    // References
    integrator: {
      type: Schema.Types.ObjectId,
      ref: 'Integrator',
      required: true,
      index: true
    },
    engineer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    scheduler: {
      type: Schema.Types.ObjectId,
      ref: 'Scheduler',
      required: true,
      unique: true,
      index: true // One payment per scheduler
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },

    // Amount Fields
    grossAmount: {
      type: Number,
      required: true // Total charged to integrator
    },
    platformFeePercentage: {
      type: Number,
      required: true,
      default: 10
    },
    platformFeeAmount: {
      type: Number,
      required: true // Amount snatchi retains
    },
    netAmount: {
      type: Number,
      required: true // Amount engineer receives (before payout fees)
    },

    // Payment Status Lifecycle
    paymentStatus: {
      type: String,
      enum: [
        'pending_creation',
        'payment_intent_created',
        'processing',
        'succeeded',
        'failed',
        'declined',
        'requires_action',
        'refunded',
        'partial_refunded',
        'disputed'
      ],
      required: true,
      default: 'pending_creation',
      index: true
    },

    // Stripe Payment Fields
    paymentMethodId: {
      type: String,
      trim: true
    },
    paymentIntentId: {
      type: String,
      trim: true,
      index: true
    },
    clientSecret: {
      type: String,
      trim: true
    },
    chargeId: {
      type: String,
      trim: true,
      index: true
    },

    // Payment Details
    currency: {
      type: String,
      default: 'gbp',
      enum: ['gbp', 'usd', 'eur', 'jpy']
    },
    description: {
      type: String,
      trim: true
    },
    metadata: {
      type: Map,
      of: String
    },

    // Failure Tracking
    failureCode: {
      type: String,
      trim: true,
      default: ''
    },
    failureMessage: {
      type: String,
      trim: true,
      default: ''
    },
    failureAttempts: {
      type: Number,
      default: 0
    },
    lastFailureAt: {
      type: Date,
      default: null
    },

    // Payout Fields
    transferId: {
      type: String,
      trim: true,
      index: true
    },
    transferStatus: {
      type: String,
      enum: [
        'pending',
        'in_transit',
        'paid',
        'failed',
        'reversed',
        'manual_review'
      ],
      default: 'pending'
    },

    // Refund Fields
    refundId: {
      type: String,
      trim: true,
      index: true
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundReason: {
      type: String,
      enum: [
        'duplicate',
        'fraudulent',
        'requested_by_customer',
        'service_not_provided',
        'quality_issue',
        'other'
      ],
      default: null
    },
    refundNotes: {
      type: String,
      trim: true,
      default: ''
    },

    // Dispute Fields
    disputeId: {
      type: String,
      trim: true,
      index: true
    },
    disputeReason: {
      type: String,
      enum: [
        'chargeback',
        'customer_dispute',
        'inquiry',
        'general',
        'duplicate',
        'product_not_received',
        'product_unacceptable',
        'subscription_canceled',
        'unrecognized'
      ],
      default: null
    },
    disputeStatus: {
      type: String,
      enum: [
        'warning_needs_response',
        'warning_under_review',
        'warning_won',
        'under_review',
        'won',
        'lost'
      ],
      default: null
    },

    // Timeline
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    paymentAttemptedAt: {
      type: Date,
      default: null
    },
    paymentSucceededAt: {
      type: Date,
      default: null,
      index: true
    },
    transferInitiatedAt: {
      type: Date,
      default: null
    },
    payoutReleasedAt: {
      type: Date,
      default: null,
      index: true
    },
    refundedAt: {
      type: Date,
      default: null
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes for common queries
paymentSchema.index({ integrator: 1, createdAt: -1 });
paymentSchema.index({ engineer: 1, createdAt: -1 });
paymentSchema.index({ paymentStatus: 1, createdAt: -1 });
paymentSchema.index({ transferStatus: 1, payoutReleasedAt: 1 });
```

### 4.4 New PayoutBatch Model (Optional, for batch processing)

**File:** `app/api/models/payoutBatch.js` (CREATE NEW)

**Purpose:** Group multiple payments into a single payout batch for engineers

```javascript
const payoutBatchSchema = new mongoose.Schema(
  {
    engineer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    payments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Payment'
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    paymentCount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'transferred',
        'paid',
        'failed',
        'cancelled'
      ],
      required: true,
      default: 'pending',
      index: true
    },
    transferId: {
      type: String,
      trim: true,
      index: true
    },
    periodStart: {
      type: Date,
      required: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    initiatedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    failureReason: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);
```

### 4.5 Integrator Model Additions

**File:** `app/api/models/integrator.js`

**New Fields:**

```javascript
// Marketplace Settings
marketplaceEnabled: {
  type: Boolean,
  default: true // Can disable engineer payments if needed
},
platformFeePercentage: {
  type: Number,
  default: 10 // Default 10% commission on engineer payments
},
defaultEngineerPayoutSchedule: {
  type: String,
  enum: ['manual', 'weekly', 'monthly'],
  default: 'manual'
},

// Payout Account (Optional: integrator manages their own bank account)
stripeConnectAccountId: {
  type: String,
  trim: true,
  default: ''
}, // If integrator wants own payout management
bankAccountOnFile: {
  type: Boolean,
  default: false
},

// Payment Statistics
totalEngineersOnboarded: {
  type: Number,
  default: 0
},
totalPaymentsMade: {
  type: Number,
  default: 0
},
totalAmountPaid: {
  type: Number,
  default: 0
},
totalPlatformFeesCollected: {
  type: Number,
  default: 0
},

// Settings
requirePaymentBeforeWork: {
  type: Boolean,
  default: true // Payment must be completed before engineer can start
},
allowPartialPayments: {
  type: Boolean,
  default: false // Can pay portion now, rest later
},
enableTimeTracking: {
  type: Boolean,
  default: false // Track actual hours vs. estimated
}
```

### 4.6 Updated Status Constants

**File:** `app/api/constants/statuses.js`

**Update SCHEDULER_STATUS:**

```javascript
export const SCHEDULER_STATUS = {
  PENDING: 'Pending',              // Initial assignment
  DECLINED: 'Declined',            // Engineer declined
  ACCEPTED: 'Accepted',            // Engineer accepted
  AWAITING_PAYMENT: 'AwaitingPayment', // [NEW] Payment processing
  PAID: 'Paid',                    // Payment succeeded
  PROGRESS: 'Progress',            // Work in progress
  COMPLETED: 'Completed',          // Work done
  APPROVED: 'Approved',            // [NEW] Integrator approved work
  RELEASED: 'Released',            // [NEW] Payout released to engineer
  PAYMENT_FAILED: 'PaymentFailed', // [NEW] Payment attempt failed
  REFUNDED: 'Refunded',            // [NEW] Payment refunded
  DISPUTED: 'Disputed',            // [NEW] Payment disputed
  CANCELLED: 'Cancelled'           // Cancelled
};

export const PAYMENT_STATUS = {
  PENDING_CREATION: 'pending_creation',
  INTENT_CREATED: 'payment_intent_created',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  DECLINED: 'declined',
  REQUIRES_ACTION: 'requires_action',
  REFUNDED: 'refunded',
  PARTIAL_REFUNDED: 'partial_refunded',
  DISPUTED: 'disputed'
};

export const CONNECT_STATUS = {
  NOT_STARTED: null,
  ONBOARDING_STARTED: 'onboarding_started',
  ONE_TIME_VERIFICATION_COMPLETE: 'one_time_verification_complete',
  VERIFIED: 'verified',
  RESTRICTED: 'restricted',
  RESTRICTED_UNDER_REVIEW: 'restricted.under_review',
  REQUIREMENTS_PENDING: 'requirements_pending',
  VERIFICATION_FAILED: 'verification_failed'
};

export const TRANSFER_STATUS = {
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  PAID: 'paid',
  FAILED: 'failed',
  REVERSED: 'reversed',
  MANUAL_REVIEW: 'manual_review'
};
```

---

## SECTION 5: API ROUTE PLAN

### 5.1 Engineer Connect Account Routes

#### Route 1: Create Onboarding Link
```
POST /api/stripe/engineer/create-onboarding-link

Request:
{
  "engineerId": "user_object_id"
}

Response (Success):
{
  "success": true,
  "onboardingUrl": "https://connect.stripe.com/express/...",
  "message": "Onboarding link created successfully"
}

Response (Failure - Already onboarded):
{
  "success": false,
  "error": "Engineer already onboarded",
  "code": "ALREADY_ONBOARDED"
}

Response (Failure - Missing fields):
{
  "success": false,
  "error": "Engineer must have email and name before onboarding",
  "code": "MISSING_ENGINEER_INFO",
  "requiredFields": ["email", "first_name", "last_name"]
}
```

#### Route 2: Get Engineer Connect Status
```
GET /api/stripe/engineer/connect-status?engineerId={id}

Response:
{
  "success": true,
  "data": {
    "engineerId": "user_object_id",
    "stripeConnectAccountId": "acct_...",
    "connectAccountStatus": "verified",
    "connectOnboardingCompletedAt": "2026-05-20T10:30:00Z",
    "bankAccountOnFile": true,
    "payoutSchedule": "manual",
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "requirements": {
      "currentlyDue": [],
      "eventuallyDue": [],
      "pastDue": []
    }
  }
}
```

#### Route 3: Refresh Onboarding Status
```
POST /api/stripe/engineer/refresh-onboarding

Request:
{
  "engineerId": "user_object_id"
}

Response:
{
  "success": true,
  "status": "verified",
  "message": "Onboarding status refreshed"
}
```

#### Route 4: Retrieve Onboarding Link (Resume)
```
POST /api/stripe/engineer/retrieve-onboarding-link

Request:
{
  "engineerId": "user_object_id"
}

Response:
{
  "success": true,
  "onboardingUrl": "https://connect.stripe.com/express/...",
  "message": "Resume your account setup"
}
```

### 5.2 Payment Creation Routes

#### Route 5: Create Payment Intent
```
POST /api/stripe/payment/create-intent

Request:
{
  "schedulerId": "scheduler_object_id",
  "amount": 5000, // in cents (£50.00)
  "integrator": "integrator_object_id",
  "engineer": "user_object_id",
  "description": "Frontend Development - 2 days"
}

Response:
{
  "success": true,
  "data": {
    "clientSecret": "pi_..._secret_...",
    "paymentIntentId": "pi_...",
    "amount": 5000,
    "currency": "gbp",
    "status": "requires_payment_method"
  }
}

Errors:
{
  "success": false,
  "error": "Engineer not onboarded",
  "code": "ENGINEER_NOT_ONBOARDED"
}

{
  "success": false,
  "error": "Engineer account has restrictions",
  "code": "ENGINEER_RESTRICTED",
  "details": "Contact Stripe support for account review"
}
```

#### Route 6: Confirm Payment
```
POST /api/stripe/payment/confirm

Request:
{
  "paymentIntentId": "pi_...",
  "paymentMethodId": "pm_...",
  "schedulerId": "scheduler_object_id"
}

Response (Success):
{
  "success": true,
  "paymentStatus": "succeeded",
  "chargeId": "ch_...",
  "message": "Payment captured successfully"
}

Response (Requires Action):
{
  "success": false,
  "paymentStatus": "requires_action",
  "clientSecret": "pi_..._secret_...",
  "code": "REQUIRES_ACTION",
  "message": "Additional authentication required"
}

Response (Failure):
{
  "success": false,
  "paymentStatus": "failed",
  "code": "PAYMENT_DECLINED",
  "failureReason": "card_declined",
  "message": "Payment was declined by the card issuer"
}
```

#### Route 7: Get Payment Status
```
GET /api/stripe/payment/status?paymentIntentId={id}

Response:
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_...",
    "status": "succeeded",
    "chargeId": "ch_...",
    "transferId": "tr_...",
    "transferStatus": "paid",
    "amount": 5000,
    "platformFeeAmount": 500,
    "engineerPayoutAmount": 4500,
    "paymentSucceededAt": "2026-05-20T10:30:00Z",
    "payoutReleasedAt": "2026-05-21T14:00:00Z"
  }
}
```

### 5.3 Payout Management Routes

#### Route 8: Release Payout to Engineer
```
POST /api/stripe/payout/release

Request:
{
  "paymentId": "payment_object_id",
  "reason": "Work completed and approved" // optional
}

Response:
{
  "success": true,
  "data": {
    "transferId": "tr_...",
    "amount": 4500,
    "status": "in_transit",
    "engineer": "user_object_id",
    "payoutReleasedAt": "2026-05-20T14:30:00Z",
    "estimatedArrival": "2026-05-22T00:00:00Z"
  }
}
```

#### Route 9: Get Engineer Earnings/Payouts
```
GET /api/stripe/engineer/earnings?engineerId={id}&period={month|quarter|year}

Response:
{
  "success": true,
  "data": {
    "totalEarnings": 15000,
    "pendingPayout": 5000, // Not yet released
    "releasedPayout": 10000, // In payout system
    "totalReceived": 9500, // Actually in bank (assuming failures)
    "payouts": [
      {
        "id": "payout_obj_id",
        "amount": 4500,
        "status": "paid",
        "paidAt": "2026-05-22T10:00:00Z",
        "schedulerId": "scheduler_...",
        "projectName": "Website Redesign"
      }
    ]
  }
}
```

#### Route 10: Get Integrator Payment History
```
GET /api/stripe/integrator/payment-history?integratorId={id}

Response:
{
  "success": true,
  "data": {
    "totalPaymentsMade": 25000,
    "totalPlatformFees": 2500,
    "totalPayouts": 22500,
    "payments": [
      {
        "id": "payment_obj_id",
        "engineer": { "id": "...", "name": "John Doe" },
        "amount": 5000,
        "platformFee": 500,
        "payoutAmount": 4500,
        "status": "paid",
        "paymentDate": "2026-05-20T10:30:00Z",
        "payoutDate": "2026-05-22T10:00:00Z",
        "schedulerId": "..."
      }
    ]
  }
}
```

### 5.4 Refund Routes

#### Route 11: Refund Payment
```
POST /api/stripe/payment/refund

Request:
{
  "paymentId": "payment_object_id",
  "amount": 5000, // Full amount in cents; optional for partial
  "reason": "duplicate", // 'duplicate', 'fraudulent', 'requested', 'service_not_provided', 'quality_issue'
  "notes": "Customer requested cancellation" // optional
}

Response:
{
  "success": true,
  "data": {
    "refundId": "re_...",
    "amount": 5000,
    "status": "succeeded",
    "message": "Refund processed successfully",
    "refundedAt": "2026-05-20T15:00:00Z"
  }
}
```

#### Route 12: Get Refund Status
```
GET /api/stripe/payment/refund-status?refundId={id}

Response:
{
  "success": true,
  "data": {
    "refundId": "re_...",
    "paymentIntentId": "pi_...",
    "amount": 5000,
    "status": "succeeded",
    "reason": "requested_by_customer",
    "notes": "Customer requested cancellation",
    "createdAt": "2026-05-20T15:00:00Z"
  }
}
```

### 5.5 Dispute Routes

#### Route 13: Get Dispute Details
```
GET /api/stripe/dispute/details?disputeId={id}

Response:
{
  "success": true,
  "data": {
    "disputeId": "dp_...",
    "chargeId": "ch_...",
    "amount": 5000,
    "reason": "product_not_received",
    "status": "lost",
    "evidence": {
      "submittedAt": "2026-05-25T10:00:00Z",
      "witnesses": ["..."]
    },
    "timeline": [
      { "date": "2026-05-20T10:30:00Z", "status": "warning_needs_response" },
      { "date": "2026-05-25T10:00:00Z", "status": "under_review" },
      { "date": "2026-06-10T15:00:00Z", "status": "lost" }
    ]
  }
}
```

---

## SECTION 6: WEBHOOK PLAN

### 6.1 New Webhooks to Configure

#### Webhook 1: account.updated
```
When: Engineer Connect account status changes
Endpoint: POST /api/webhooks

Event Details:
{
  "id": "evt_...",
  "type": "account.updated",
  "created": 1234567890,
  "data": {
    "object": {
      "id": "acct_...",
      "charges_enabled": true,
      "payouts_enabled": true,
      "requirements": {
        "current_deadline": null,
        "currently_due": [],
        "eventually_due": [],
        "past_due": []
      },
      "restrictions": []
    }
  }
}

App Action:
1. Find User by stripeConnectAccountId
2. Update connectAccountStatus based on charges/payouts_enabled
3. If verification failed: set connectRejectReason, send notification
4. If verified: set bankAccountOnFile = true, send success email
```

#### Webhook 2: payment_intent.succeeded
```
When: PaymentIntent successfully confirmed
Endpoint: POST /api/webhooks

Event Details:
{
  "id": "evt_...",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_...",
      "amount": 5000,
      "currency": "gbp",
      "status": "succeeded",
      "charges": {
        "data": [{
          "id": "ch_...",
          "amount": 5000,
          "status": "succeeded"
        }]
      },
      "metadata": {
        "schedulerId": "scheduler_...",
        "engineerId": "engineer_..."
      }
    }
  }
}

App Action:
1. Find Payment by paymentIntentId
2. Extract chargeId
3. Update Payment: status=succeeded, chargeId, paymentSucceededAt
4. Update Scheduler: status=Paid, paymentCollectedAt
5. Create Transfer to engineer's Connect account (automatic or queued)
6. Notify engineer: "Payment received! Your work payment is £50.00"
7. Notify integrator: "Payment confirmed. Engineer can start work."
```

#### Webhook 3: payment_intent.payment_failed
```
When: PaymentIntent payment attempt fails
Endpoint: POST /api/webhooks

Event Details:
{
  "id": "evt_...",
  "type": "payment_intent.payment_failed",
  "data": {
    "object": {
      "id": "pi_...",
      "last_payment_error": {
        "code": "card_declined",
        "message": "Your card was declined",
        "decline_code": "generic_decline"
      }
    }
  }
}

App Action:
1. Find Payment by paymentIntentId
2. Update Payment: status=failed, failureCode, failureMessage, lastFailureAt
3. Update Scheduler: status=PaymentFailed
4. Notify integrator: "Payment failed. Reason: Card declined. Retry or use different card."
5. Notify engineer: "Payment for this assignment failed. Awaiting new payment attempt."
6. Send retry prompt to integrator
```

#### Webhook 4: charge.refunded
```
When: Refund processed successfully
Endpoint: POST /api/webhooks

Event Details:
{
  "id": "evt_...",
  "type": "charge.refunded",
  "data": {
    "object": {
      "id": "ch_...",
      "refunded": true,
      "amount_refunded": 5000,
      "refunds": {
        "data": [{
          "id": "re_...",
          "amount": 5000,
          "reason": "requested_by_customer"
        }]
      }
    }
  }
}

App Action:
1. Find Scheduler by chargeId
2. Find Payment by chargeId
3. Update Payment: status=refunded, refundId, refundedAt
4. Update Scheduler: status=Refunded
5. If Transfer already created: Reverse transfer (create reverse transfer)
6. Notify engineer: "Payment refunded due to: Customer request"
7. Notify integrator: "Refund processed. £50.00 returned to your card."
```

#### Webhook 5: transfer.created
```
When: Transfer to engineer initiated
Endpoint: POST /api/webhooks

Event Details:
{
  "id": "evt_...",
  "type": "transfer.created",
  "data": {
    "object": {
      "id": "tr_...",
      "destination_payment": "py_...",
      "amount": 4500,
      "currency": "gbp",
      "status": "in_transit"
    }
  }
}

App Action:
1. Find Payment by transferId (from metadata or reverse lookup)
2. Update Payment: transferStatus=in_transit, transferInitiatedAt
3. Update Scheduler: transferId
4. Notify engineer: "Your payout of £45.00 is in transit. Should arrive in 1-2 days."
```

#### Webhook 6: transfer.paid
```
When: Transfer successfully delivered to engineer's bank
Endpoint: POST /api/webhooks

Event Details:
{
  "id": "evt_...",
  "type": "transfer.paid",
  "data": {
    "object": {
      "id": "tr_...",
      "amount": 4500,
      "status": "paid"
    }
  }
}

App Action:
1. Find Payment by transferId
2. Update Payment: transferStatus=paid
3. Update User (engineer): totalPayoutsReleased += amount, lastPayoutDate = now
4. Create PayoutBatch record (for reporting)
5. Notify engineer: "Payout of £45.00 has been deposited to your bank account!"
6. Log to analytics: engineer_payout_completed
```

#### Webhook 7: charge.dispute.created
```
When: Customer initiates chargeback/dispute
Endpoint: POST /api/webhooks

Event Details:
{
  "id": "evt_...",
  "type": "charge.dispute.created",
  "data": {
    "object": {
      "id": "dp_...",
      "charge": "ch_...",
      "amount": 5000,
      "reason": "product_not_received",
      "status": "warning_needs_response"
    }
  }
}

App Action:
1. Find Payment by chargeId
2. Update Payment: status=disputed, disputeId, disputeReason, disputeStatus
3. Update Scheduler: status=Disputed
4. Flag for admin review
5. Notify integrator: "Payment disputed. Reason: Product not received. Review and submit evidence by [date]"
6. Notify engineer: "Your payment has a dispute. Status: [status]"
7. If Transfer already created: Hold transfer (manual review needed)
```

---

## SECTION 7: UI/UX CHANGES

### 7.1 Engineer Onboarding Screens

#### Screen 1: Engineer Profile - Payout Setup Section
```
Location: /protected/engineer/profile

Component: PayoutSetup
├── Status Card
│   ├── If not started:
│   │   └── [Setup Payout Account] Button → Opens Stripe onboarding
│   ├── If in progress:
│   │   └── "Onboarding in progress..." + [Resume] Button
│   └── If verified:
│       ├── ✓ Account verified
│       ├── Bank account: ••••1234
│       └── [Change Bank Account] Button
│
├── Payout Schedule Selector (if verified)
│   ├── ( ) Manual
│   ├── ( ) Weekly
│   └── ( ) Monthly
│
└── Earnings Summary (if verified)
    ├── Total Earned: £45,000
    ├── Pending: £5,000 (awaiting release)
    ├── Received: £40,000
    └── [View Payment History] Button
```

#### Screen 2: Onboarding Redirect Pages
```
Location: /protected/engineer/payout-setup?status={status}

Success State:
├── ✓ Account Setup Complete
├── Your payout account is ready
├── Bank account: ••••1234
├── You can now receive payments
└── [Return to Profile] / [View Earnings]

Refresh Required State:
├── Complete Your Setup
├── Your account setup isn't finished yet
├── Additional information or verification may be needed
├── [Resume Setup] [Dismiss]

Canceled State:
├── Setup Closed
├── You closed the setup window
├── [Retry Setup] [Do It Later]
```

### 7.2 Scheduler/Assignment Payment UI

#### Screen 3: Create/Edit Scheduler - Payment Section
```
Location: /protected/integrator/projects/{projectId}/assign

New Section: Payment Details
├── Rate Type Selector
│   ├── ( ) Hourly Rate
│   ├── ( ) Daily Rate
│   ├── ( ) Fixed Amount
│   └── ( ) Percentage of Project Budget
│
├── Rate Input
│   ├── Field: Rate Amount (e.g., £50/hour)
│   ├── If Hourly: "Estimated Hours" field
│   └── Calculated: Total Amount: £5000
│
├── Payment Timing
│   ├── Description: "Payment is collected upfront before work starts"
│   └── [Learn More] (shows payment process timeline)
│
├── Platform Fee Info
│   ├── "Platform fee: 10% (£500)"
│   ├── "Engineer receives: £4,500"
│   └── [View breakdown]
│
└── Checkbox
    └── ☑ Require payment before engineer can start
```

#### Screen 4: Payment Confirmation Modal
```
Location: Before sending engineer invite (if rate > 0)

Modal: "Confirm Engineer Payment"
├── Engineer: [Select Engineer Name]
├── Project: Project Name
├── Amount: £5,000.00
├── Platform Fee: £500.00
├── Engineer Receives: £4,500.00
├── Timeline:
│   ├── 1. Engineer accepts → Status: Accepted
│   ├── 2. You pay → Status: AwaitingPayment
│   ├── 3. Payment succeeds → Status: Paid
│   └── 4. Engineer starts → Status: Progress
│
├── Checkbox: ☑ I understand payment is required before work starts
│
└── [Cancel] [Confirm & Send Invite]
```

### 7.3 Scheduler Status Card Updates

#### Screen 5: Scheduler Detail View - Payment Status
```
Location: /protected/integrator/projects/{projectId}/scheduler/{schedulerId}

Current Status Flow Card:
├── Status: Pending (gray)
│   └── Engineer: John Doe - Awaiting response
│
├── Status: Accepted (blue)
│   ├── Engineer accepted the assignment
│   └── [Pay Engineer] Button (primary action)
│
├── Status: AwaitingPayment (orange)
│   ├── Payment processing...
│   └── [View Payment Status]
│
├── Status: Paid (green)
│   ├── ✓ Payment: £5,000.00
│   ├── Platform fee: £500.00
│   ├── Engineer receives: £4,500.00
│   ├── Payment date: May 20, 2026
│   └── [View Receipt] [Refund]
│
├── Status: Progress (blue)
│   ├── Work started: May 20, 2026
│   └── Expected completion: May 22, 2026
│
├── Status: Completed (green)
│   ├── ✓ Work completed
│   ├── [Approve & Release Payment] Button
│   └── [Reject / Request Changes]
│
└── Status: Released (green)
    ├── ✓ Payout released to engineer
    ├── Payout ID: tr_...
    └── Engineer should receive in 1-2 days
```

### 7.4 Engineer Work Dashboard

#### Screen 6: My Assignments - Payment Info
```
Location: /protected/engineer/assignments

Assignment Card:
├── Project: Website Redesign
├── Company: Acme Corp
├── Assignment: Frontend Development
├── Dates: May 20 - 22, 2026
│
├── Payment Info
│   ├── Rate: £50/hour
│   ├── Estimated: 40 hours = £2,000.00
│   ├── Status: Paid ✓
│   └── Payment Date: May 20, 2026
│
├── Timeline Badge
│   └── "In Progress - Due May 22"
│
└── Status: [Accepted] [Paid] [In Progress]
    └── [View Details]
```

### 7.5 Payment History Screens

#### Screen 7: Integrator Payment History
```
Location: /protected/integrator/payments or /dashboard/payments

Filters:
├── Date Range Selector
├── Engineer Name
├── Project Name
├── Status: All, Pending, Failed, Succeeded, Refunded

Table:
├── Engineer | Project | Date | Amount | Fee | Payout | Status | Actions
├── John Doe | Website | May 20 | £5,000 | £500 | £4,500 | Paid | Receipt, Refund
├── Jane Smith | App | May 19 | £3,000 | £300 | £2,700 | Paid | Receipt, Refund
└── Bob Wilson | Design | May 18 | £2,000 | £200 | £1,800 | Failed | Retry, Cancel

Summary:
├── Total Payments: £25,000
├── Total Fees: £2,500
├── Total Payouts: £22,500
└── Pending: £0
```

#### Screen 8: Engineer Earnings Dashboard
```
Location: /protected/engineer/earnings

Earnings Overview:
├── Total Earned (All Time): £45,000
├── This Month: £8,500
├── Pending Payout: £5,000 (5 payments awaiting release)
└── Received (in bank): £40,000

Breakdown Card:
├── Completed & Released: £35,000
├── In Transit: £5,000 (arriving by May 25)
└── Pending Release: £5,000 (awaiting approval)

Payout History Table:
├── Date | Amount | Status | Project | ETA
├── May 22 | £4,500 | Paid | Website Redesign | Received
├── May 20 | £3,500 | In Transit | App Development | May 24
└── May 18 | £2,000 | Pending | Design System | Awaiting Review

[Download Statement] Button
```

### 7.6 Admin Review & Dispute Screens

#### Screen 9: Admin - Dispute Management
```
Location: /admin/disputes

Dispute Card:
├── Dispute ID: dp_...
├── Status: Lost / Warning Needs Response / Under Review
├── Charge: £5,000.00
├── Reason: Product not received
├── Date Filed: May 20, 2026
├── Due Date: May 30, 2026
│
├── Details Section
│   ├── Integrator: Acme Corp
│   ├── Engineer: John Doe
│   ├── Project: Website Redesign
│   └── Description: [Show context]
│
├── Timeline
│   ├── May 20 - Filed (warning_needs_response)
│   ├── May 25 - Evidence submitted (under_review)
│   └── June 10 - Lost (lost)
│
├── Actions
│   ├── [View Charge Details]
│   ├── [Submit Evidence]
│   └── [Accept Loss] (auto-refund & reverse transfer)
```

---

## SECTION 8: SECURITY & COMPLIANCE

### 8.1 Never Store Card Details

```
✅ DO:
- Use Stripe Payment Methods (Stripe stores encrypted cards)
- Use Stripe Customers & Sources API
- Store only Stripe IDs (pm_..., src_...)
- Let Stripe handle all card data
- PCI compliance handled by Stripe

❌ DON'T:
- Store card numbers
- Store CVV
- Store expiry dates
- Store full name on card (for payment processing)
- Transmit card data through your servers
```

### 8.2 Validate Ownership Before Payment

```
Scheduler Authorization Check:
├── Verify integrator owns scheduler
├── Verify engineer is assigned to scheduler
├── Check engineer is role='engineer'
└── Verify project belongs to integrator

Payment Authorization Check:
├── Only scheduler.integrator can pay
├── Engineer cannot pay themselves
├── Prevent engineer from accepting own assignments
└── Audit log all payment attempts
```

### 8.3 Only Pay Onboarded Engineers

```
Before Creating Payment:
1. Check User.connectAccountStatus === 'verified'
2. Verify User.bankAccountOnFile === true
3. Verify User.stripeConnectAccountId exists
4. Query Stripe API: GET /accounts/{account_id}
   - Check charges_enabled === true
   - Check payouts_enabled === true
   - Check requirements.currently_due === []
5. If verification failed:
   ├── Block payment
   ├── Show engineer: "Complete account verification"
   └── Show integrator: "Engineer not ready. [View Status]"
```

### 8.4 Prevent Duplicate Payments

```
Duplicate Prevention Strategy:
1. Idempotency Key: Use schedulerId as idempotency key
   └── Stripe prevents duplicate charges with same key

2. Database Check:
   └── Before creating PaymentIntent:
       - Verify Scheduler.paymentIntentId is empty
       - Verify Scheduler.chargeId is empty

3. Webhook Deduplication:
   └── Existing middleware: webhookDeduplicationMiddleware
   └── Extend for payment_intent.succeeded events

4. Amount Verification:
   └── Before confirming payment:
       - Verify amount matches Scheduler.estimatedAmount
       - Check for duplicate charges within 5 minutes
```

### 8.5 Idempotency Keys

```
Payment API Usage:
├── Create PaymentIntent:
│   └── Header: Idempotency-Key: scheduler_{schedulerId}_{timestamp}
│
├── Confirm PaymentIntent:
│   └── Header: Idempotency-Key: confirm_{paymentIntentId}_{timestamp}
│
└── Create Transfer:
    └── Header: Idempotency-Key: transfer_{paymentId}_{timestamp}

Benefits:
├── If request fails midway → Retry safely
├── Stripe returns cached result if key is duplicate
└── Prevents double-charging
```

### 8.6 Platform Fee Logic

```
Fee Calculation:
├── platformFeePercentage = Integrator.platformFeePercentage (default 10%)
├── grossAmount = Scheduler.estimatedAmount (what integrator pays)
├── platformFeeAmount = grossAmount × (platformFeePercentage / 100)
├── netAmount = grossAmount - platformFeeAmount (engineer receives)
│
└── Example:
    ├── Engineer rate: £50/hour
    ├── Estimated hours: 100
    ├── Gross: £5,000
    ├── Platform fee (10%): £500
    └── Engineer net: £4,500

Stripe Transfer to Engineer:
├── Amount: netAmount (£4,500)
├── Destination: Engineer's Connect Account
├── Metadata: { schedulerId, integrator, platformFee: 500 }
└── Stripe charges 0% on Connect transfers

Snatchi Revenue:
├── Source 1: platformFeeAmount per payment (£500)
├── Source 2: Subscription fees (separate B2B billing)
└── Report: Calculate daily/weekly revenue
```

### 8.7 Refund Handling

```
Refund Rules:

Full Refund Allowed When:
├── Status < Paid (engineer hasn't received payout yet)
├── Work hasn't started (Status != Progress)
├── Engineer requests cancellation before start
└── Service quality issue (within 30 days)

Partial Refund Allowed When:
├── Work partially completed
├── Customer requests partial refund
└── Dispute partially won

Refund Not Allowed When:
├── Work completed and delivered
├── Beyond 90-day window (unless chargeback)
└── Dispute already lost

Refund Process:
1. Integrator initiates: POST /api/stripe/payment/refund
2. Check refund eligibility
3. Stripe API: refund the charge
4. If Transfer already created:
   └── Create reverse transfer to integrator
5. Update databases:
   ├── Payment.refundId = refund_id
   ├── Payment.refundReason = reason
   ├── Scheduler.status = Refunded
   └── Record in Payment model
6. Notify both parties
```

### 8.8 Dispute Handling

```
Dispute Timeline:

Day 0: Customer files chargeback/dispute
└── Stripe sends charge.dispute.created webhook

Day 1-5: Warning Period
├── Status: warning_needs_response
├── App notifies integrator
├── Integrator can submit evidence
└── Or accept loss immediately

Day 5-10: Under Review
├── Status: under_review
├── Stripe reviews evidence
└── App shows "Dispute in progress"

Day 10+: Decision
├── Status: won or lost
├── If won: Charge remains, funds with integrator
├── If lost: Charge reversed, funds returned to customer
│           Transfer to engineer also reversed

Dispute Handling in App:
1. Prevent further work (Scheduler.status = Disputed)
2. Hold any pending transfers
3. Notify engineer: "Payment under dispute"
4. Notify integrator: "Respond with evidence by [date]"
5. Log timeline for audit
6. Update Payment model with dispute details
```

### 8.9 Audit Logging

```
Log All Payment Events:
├── Create Payment Intent
├── Confirm Payment
├── Payment succeeded/failed
├── Transfer created/paid/failed
├── Refund issued
├── Dispute filed/won/lost
├── Payout released
└── Any auth/permission checks

Log Format:
{
  "timestamp": ISO,
  "action": "payment_created | transfer_initiated | refund_issued",
  "integrator": id,
  "engineer": id,
  "amount": cents,
  "status": enum,
  "stripeId": "pi_... or tr_... or re_...",
  "result": "success | failure",
  "error": null or message,
  "ipAddress": user_ip,
  "userId": initiator_id
}

Retention:
├── Keep all logs for 7 years (regulatory requirement)
├── Archive to cold storage after 1 year
└── Allow admin export for audit
```

---

## SECTION 9: API ROUTE PLAN (DETAILED)

### Route Directory Structure

```
/app/api/stripe/
├── engineer/
│   ├── create-onboarding-link/route.js
│   ├── connect-status/route.js
│   ├── refresh-onboarding/route.js
│   └── retrieve-onboarding-link/route.js
├── payment/
│   ├── create-intent/route.js
│   ├── confirm/route.js
│   ├── status/route.js
│   ├── refund/route.js
│   └── refund-status/route.js
├── payout/
│   ├── release/route.js
│   ├── history/route.js
│   └── batch/route.js
└── dispute/
    └── details/route.js
```

---

## SECTION 10: RISKS & OPEN QUESTIONS

### 10.1 Identified Risks

#### Risk 1: Engineer Verification Delays
**Risk:** Engineer spends time on assignment, but payout can't be released due to account restrictions

**Mitigation:**
- ✅ Block payment creation if engineer not verified
- ✅ Show engineer verification status on profile
- ✅ Send reminders to complete onboarding
- ✅ Manual admin override for exceptional cases

#### Risk 2: Chargebacks & Disputes
**Risk:** Integrator charges back after engineer completes work

**Mitigation:**
- ✅ Upfront payment (money collected before work)
- ✅ Hold engineer payout during dispute window
- ✅ Require proof of work (photos, code commits, etc.)
- ✅ Dispute evidence submission UI
- ✅ Admin review capability

#### Risk 3: Payment Failure Handling
**Risk:** Payment fails, engineer starts work anyway

**Mitigation:**
- ✅ Block status change to "Progress" until payment succeeded
- ✅ Send notification: "Payment failed, fix payment method"
- ✅ Retry UI for failed payments
- ⚠️ Need clear UX to prevent engineer from starting

#### Risk 4: Tax Compliance
**Risk:** Not tracking engineer income/taxes correctly

**Mitigation:**
- ✅ Issue 1099-K forms (US) for >$20k annual engineers
- ✅ Track engineer earnings by year
- ✅ Generate tax reports by engineer
- ✅ Export data for accountants
- ⚠️ Need tax software integration (future phase)

#### Risk 5: Multi-Currency Complexity
**Risk:** Exchange rates, different fee structures per currency

**Mitigation:**
- ✅ Stripe handles currency conversion
- ✅ Lock rate at payment time
- ✅ Store amount in original currency
- ⚠️ Phase 1: GBP only; expand later

#### Risk 6: Engineer Account Restrictions
**Risk:** Stripe restricts account after payout created

**Mitigation:**
- ✅ Query account status before creating transfer
- ✅ Handle transfer.failed webhook
- ✅ Notify engineer to contact Stripe support
- ✅ Manual admin intervention UI

### 10.2 Open Questions for Product Team

1. **Automatic vs. Manual Payout Release:**
   - Question: Should payouts release automatically after work completion, or always manual?
   - Recommendation: Start with manual (safer); automate in Phase 2

2. **Quality/Approval Workflow:**
   - Question: Does integrator approve work before payout release?
   - Recommendation: Yes; add "Approved" status + review UI

3. **Partial Payments:**
   - Question: Can integrator pay part now, part later?
   - Recommendation: No (Phase 1); use project budget for upfront estimates

4. **Recurring Assignments:**
   - Question: Can engineer have recurring weekly assignments with auto-payment?
   - Recommendation: No (Phase 1); each assignment is one-time payment

5. **Payment Plans:**
   - Question: Can integrator request payment plan (e.g., 50% now, 50% on completion)?
   - Recommendation: Not in Phase 1; consider for Phase 2

6. **Minimum/Maximum Amounts:**
   - Question: Minimum payment per assignment? Maximum?
   - Recommendation: Min £10, Max £50,000 (configurable)

7. **Fees:**
   - Question: Fixed 10% platform fee or variable?
   - Recommendation: 10% default; allow integrator customization

8. **Email Notifications:**
   - Question: How detailed should payment emails be?
   - Recommendation: Basic (amount, status); link to app for details

9. **Mobile App Support:**
   - Question: Will mobile app handle engineer payments?
   - Recommendation: Phase 2; Web first

10. **Subscription + Marketplace Interaction:**
    - Question: How do subscription failures affect marketplace payments?
    - Recommendation: Different payment sources; marketplace independent

---

## SECTION 11: PHASED IMPLEMENTATION PLAN

### Phase 1: MVP (Weeks 1-4)

**Scope:** Basic engineer onboarding + payment collection

**Deliverables:**
- [ ] User model schema updates (Connect account fields)
- [ ] Scheduler model schema updates (payment fields)
- [ ] Payment model (CREATE new)
- [ ] Engineer Connect onboarding UI + routes
- [ ] Payment Intent creation route
- [ ] Payment confirmation route
- [ ] Scheduler status updates (AwaitingPayment, PaymentFailed)
- [ ] account.updated webhook handling
- [ ] payment_intent.succeeded webhook handling
- [ ] payment_intent.payment_failed webhook handling
- [ ] Basic payment history UI
- [ ] Integrator payment creation UI
- [ ] Email notifications (payment confirmation/failure)

**Not Included:**
- Automatic transfers (manual approval first)
- Refunds (blocked in Phase 1)
- Disputes (monitoring only)
- Batch payouts
- Tax reporting
- Mobile app

### Phase 2: Payout & Transfers (Weeks 5-8)

**Scope:** Transfer payouts to engineers

**Deliverables:**
- [ ] Manual payout release UI
- [ ] Create Transfer to engineer's Connect account
- [ ] transfer.created webhook handling
- [ ] transfer.paid webhook handling
- [ ] Engineer earnings dashboard
- [ ] Payout batch model
- [ ] Automatic batch payout scheduling
- [ ] Payout history API
- [ ] Status constants expansion (Approved, Released)

### Phase 3: Refunds & Disputes (Weeks 9-12)

**Scope:** Handle refunds and chargebacks

**Deliverables:**
- [ ] Refund creation API
- [ ] charge.refunded webhook
- [ ] Reverse transfer logic
- [ ] Dispute details API
- [ ] charge.dispute.created webhook
- [ ] Admin dispute management UI
- [ ] Dispute evidence submission
- [ ] Automatic refund on lost dispute

### Phase 4: Advanced Features (Weeks 13+)

**Scope:** Optimization and reporting

**Deliverables:**
- [ ] Tax reporting (1099-K generation)
- [ ] Multi-currency support
- [ ] Payment analytics dashboard
- [ ] Recurring assignments + auto-pay
- [ ] Payment plans (split payments)
- [ ] Mobile app support
- [ ] Payout schedule customization
- [ ] Premium features (lower fees, white-label)

---

## SECTION 12: DATABASE MIGRATION STRATEGY

### 12.1 Schema Changes Execution Order

```
Week 1:
1. Add fields to User model (connection account fields)
   - Safe: All new fields, defaults = null/empty
   - Migration: None needed

2. Add fields to Scheduler model (payment fields)
   - Safe: All new fields, defaults = null/0
   - Migration: None needed

3. Create Payment model
   - New collection: payments
   - Migration: None (new collection)

Week 2:
4. Add fields to Integrator model
   - Safe: All new fields, default = false/null
   - Migration: Run script to set marketplaceEnabled = true for active integrators

5. Update status constants
   - Migration: None (additive)
```

### 12.2 Backward Compatibility

```
✅ All new fields default to null/empty
✅ Existing scheduler logic unaffected
✅ Existing payment (subscriptions) unaffected
✅ No data destructive changes
✅ Can rollback without data loss
```

---

## SECTION 13: TESTING STRATEGY

### 13.1 Unit Tests

```
Test Files:
├── stripe/engineer/create-onboarding-link.test.js
├── stripe/payment/create-intent.test.js
├── stripe/payment/confirm.test.js
├── webhooks/account.updated.test.js
├── webhooks/payment_intent.succeeded.test.js
├── services/payment.test.js
└── models/payment.test.js
```

### 13.2 Integration Tests

```
Test Scenarios:
├── Happy Path: Engineer onboarding → Payment → Transfer → Payout
├── Payment Failure: Declined card → Retry → Success
├── Refund: Payment → Refund request → Webhook confirmation
├── Dispute: Payment → Dispute filed → Lost → Reverse transfer
├── Partial Completion: Work not done → Refund
└── Engineer not onboarded: Block payment, show error
```

### 13.3 E2E Tests (Stripe Test Mode)

```
Test Environment:
├── Use Stripe Test Secret Key
├── Use test card: 4242 4242 4242 4242 (succeeds)
├── Use test card: 4000 0000 0000 9995 (fails)
├── Create test engineer account
├── Create test integrator account
└── Verify full flow end-to-end
```

### 13.4 Manual Testing

```
Checklist:
□ Engineer can complete onboarding
□ Integrator can create assignment with rate
□ Integrator can pay
□ Payment processes successfully
□ Engineer sees payment in dashboard
□ Payout can be released
□ Engineer receives notification
□ Payment history shows correctly
□ Refund flow works
□ Disputed payment shows in admin panel
```

---

## SECTION 14: ROLLOUT STRATEGY

### 14.1 Feature Flag

```
Create feature flag: ENGINEER_PAYMENTS

Phase 1:
├── Flag off by default
├── Enable for internal testing
├── Enable for test integrators
└── Gradual rollout (10% → 25% → 50% → 100%)

Switch Points:
├── Webhook handlers (flag-check before processing)
├── API routes (flag-check in middleware)
├── UI components (conditionally render)
└── Status transitions (allow new statuses only if flag on)
```

### 14.2 Staged Rollout

```
Week 1: Internal Testing
├── Internal team tests end-to-end
├── Test all failure scenarios
├── Verify webhooks work

Week 2: Beta Testers
├── Select 5-10 integrators
├── Select 20-30 engineers
├── Monitor for issues

Week 3: Open Beta
├── Announce feature
├── Invite all users
├── Monitor for bugs

Week 4: General Availability
├── Remove beta label
├── Document feature
├── Monitor metrics
```

---

## SECTION 15: MONITORING & ALERTS

### 15.1 Metrics to Track

```
Real-Time Dashboards:
├── Total payments created (today/week/month)
├── Total payment value (by status)
├── Payment success rate (%)
├── Failed payments (count & reasons)
├── Webhook success rate
├── Transfer success rate
├── Engineer onboarding completion rate
├── Average time to payout (hours)
└── Platform fee collected

Alerts:
├── Payment failure rate > 5% → Alert
├── Webhook failures > 10 → Alert
├── Transfer failures → Immediate alert
├── Webhook signature failures → Immediate alert
└── Database connection errors → Immediate alert
```

### 15.2 Error Logging

```
Log Levels:
├── ERROR: Payment failed, Transfer failed, Webhook signature error
├── WARN: Duplicate webhook, Retry attempt, Verification pending
├── INFO: Payment created, Transfer created, Payout released
└── DEBUG: Calculation details, Stripe API calls, Middleware checks

Aggregation:
├── Daily error report (digest)
├── Real-time alerts for critical errors
└── Weekly performance report
```

---

## SUMMARY TABLE: Implementation Scope

| Component | Type | Phase | Status |
|-----------|------|-------|--------|
| User model updates | Schema | 1 | ✅ Design |
| Scheduler model updates | Schema | 1 | ✅ Design |
| Payment model (new) | Schema | 1 | ✅ Design |
| Integrator model updates | Schema | 1 | ✅ Design |
| Engineer onboarding UI | Frontend | 1 | ✅ Design |
| Create Payment Intent | API | 1 | ✅ Design |
| Confirm Payment | API | 1 | ✅ Design |
| account.updated webhook | Backend | 1 | ✅ Design |
| payment_intent webhooks | Backend | 1 | ✅ Design |
| Manual payout release | API | 2 | 🔶 Design |
| Transfer to engineer | API | 2 | 🔶 Design |
| Refund logic | API | 3 | 🔶 Design |
| Dispute handling | API | 3 | 🔶 Design |
| Tax reporting | Backend | 4 | 🔶 Future |
| Mobile support | Frontend | 4 | 🔶 Future |

---

## CONCLUSION

This audit and design document provides a comprehensive roadmap for implementing Stripe Connect engineer payments while maintaining the existing B2B SaaS subscription model.

**Key Takeaways:**
- ✅ Current subscription infrastructure is solid; no conflicts with new feature
- ✅ Schema changes are non-breaking; backward compatible
- ✅ Phased approach minimizes risk and complexity
- ✅ Manual payout release prevents fraud
- ✅ Comprehensive webhook handling ensures data consistency
- ✅ Audit logging provides regulatory compliance

**Next Steps:**
1. Review and approve design with product team
2. Clarify open questions (Section 10.2)
3. Adjust phasing based on resource availability
4. Begin implementation with Phase 1 scope
5. Create detailed ticket breakdown in project management tool

**Estimated Effort:**
- Phase 1: 3-4 weeks (2 engineers)
- Phase 2: 2-3 weeks (1-2 engineers)
- Phase 3: 2-3 weeks (1-2 engineers)
- Phase 4: 4+ weeks (ongoing)

**Total MVP (Phase 1): 4 weeks to first payment processing**

---

**Document Version:** 1.0  
**Last Updated:** May 20, 2026  
**Status:** Ready for Review
