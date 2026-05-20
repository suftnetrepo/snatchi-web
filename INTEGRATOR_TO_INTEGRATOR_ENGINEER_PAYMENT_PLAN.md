# Integrator-to-Integrator Engineer Service Payment Plan

**Date:** May 20, 2026  
**Status:** Architecture Design (Revised from Engineer-Centric Model)  
**Scope:** Cross-integrator payment routing for engineer services  
**Key Change:** Payments route to engineer's owning integrator, NOT directly to engineer

---

## EXECUTIVE SUMMARY: ARCHITECTURAL SHIFT

### Previous Architecture (CANCELLED ❌)
```
Paying Integrator → Stripe → Engineer's Connect Account → Engineer
❌ Engineers are NOT connected to Stripe
❌ Engineers cannot receive payouts
❌ Creates duplicate payout infrastructure
```

### New Architecture (✅ APPROVED)
```
Paying Integrator → Stripe → Owning Integrator's Connect Account → (Integrator pays Engineer locally)
✅ Only integrators manage Stripe Connect
✅ Engineers paid offline by their owning integrator
✅ Integrators responsible for engineer compensation
✅ Platform only handles inter-integrator payment routing
```

---

## SECTION 1: REVISED AUDIT

### 1.1 Engineer/User Model Analysis (REVISED)

**File:** `app/api/models/user.js`

**Current Fields:**
```
- role: Can be 'engineer'
- integrator: ObjectId ref to Integrator (OWNER REFERENCE)
- email, first_name, last_name, mobile
- address, attachments, profile image
```

**Key Finding: Engineer's Owning Integrator**
```javascript
User.integrator = ObjectId (ref: Integrator)
// This field identifies WHO THE ENGINEER BELONGS TO
// Used to route payments to correct receiving integrator
```

**NO NEW FIELDS NEEDED** ✅
- ❌ stripeConnectAccountId (NOT for engineers)
- ❌ connectAccountStatus (NOT for engineers)
- ❌ payoutSchedule (NOT for engineers)
- ❌ bankAccountOnFile (NOT for engineers)

**Decision:** User model stays unchanged. Engineer is NOT a Stripe participant.

---

### 1.2 Integrator Model Analysis (REVISED)

**File:** `app/api/models/integrator.js`

**Current Subscription Fields:**
```
- stripeCustomerId: Subscription customer
- subscriptionId: Active subscription
- plan, priceId: Subscription details
- status: Subscription status (from webhooks)
- tax_rate, currency: Billing settings
```

**MISSING: Connect Account Fields** ❌
- No stripeConnectAccountId
- No connectAccountStatus
- No bankAccountOnFile
- No payoutSchedule

**NEW REQUIREMENT:** Integrators need Stripe Connect Express for receiving payments

**Schema Addition:**
```javascript
// Stripe Connect Account (for receiving engineer service payments)
stripeConnectAccountId: {
  type: String,
  trim: true,
  default: '',
  sparse: true,
  index: true
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
  default: null,
  index: true
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
  default: ''
},
chargesEnabled: {
  type: Boolean,
  default: false
},
payoutsEnabled: {
  type: Boolean,
  default: false
},

// Marketplace Settings
marketplaceEnabled: {
  type: Boolean,
  default: true
},
platformFeePercentage: {
  type: Number,
  default: 10 // Default 10% platform commission
},

// Payment Statistics
totalPaymentsReceived: {
  type: Number,
  default: 0
},
totalAmountReceived: {
  type: Number,
  default: 0
},
totalPlatformFeesDeducted: {
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
}
```

**Decision:** Integrator model expanded with Connect account fields for receiving payments.

---

### 1.3 Scheduler Model Analysis (REVISED)

**File:** `app/api/models/scheduler.js`

**Current Structure:**
```javascript
{
  integrator: ObjectId (who CREATED/owns the scheduler)
  engineer: ObjectId (who will DO the work)
  project: ObjectId
  status: ['Pending', 'Declined', 'Accepted', 'Paid', 'Completed', 'Cancelled', 'Progress']
  title, description, startDate, endDate, startTime, endTime
  timestamps
}
```

**Critical Issue:** Current scheduler assumes single integrator
```
// CURRENT (PROBLEM):
Scheduler.integrator = The one integrator
// No tracking of who PAID vs who OWNS the engineer
```

**NEW REQUIREMENT:** Track multiple integrators
```javascript
integrator: ObjectId ref Integrator,        // WHO CREATED THE SCHEDULER
payingIntegrator: ObjectId ref Integrator,  // WHO PAID (might be different)
engineer: ObjectId ref User,                // WHO WORKS (owned by integrator field)
project: ObjectId ref Project
```

**New Payment Fields:**
```javascript
// Payment Tracking
rate: {
  type: Number,
  required: false,
  default: 0 // Hourly/daily rate
},
rateType: {
  type: String,
  enum: ['hourly', 'daily', 'fixed'],
  default: 'hourly'
},
estimatedHours: Number,
estimatedAmount: Number,

// Cross-Integrator Payment
paymentIntentId: String,
chargeId: String,
paymentStatus: {
  type: String,
  enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'],
  default: 'pending'
},

// Routing to Receiving Integrator
receivingIntegratorId: ObjectId,  // Engineer's owner (derived from engineer.integrator)
platformFeePercentage: Number,
platformFeeAmount: Number,
receiverAmount: Number,           // Amount receiving integrator gets

// Transfer to Receiving Integrator's Connect Account
transferId: String,
transferStatus: String,

// Timeline
paymentInitiatedAt: Date,
paymentSucceededAt: Date,
transferInitiatedAt: Date,
payoutReleasedAt: Date,

// Refunds
refundId: String,
refundedAt: Date,
refundReason: String
```

**Decision:** Scheduler expanded with cross-integrator payment fields.

---

### 1.4 New Payment Model (REVISED)

**Purpose:** Track cross-integrator payments in detail

```javascript
{
  // Actor References
  payingIntegrator: ObjectId ref Integrator,   // WHO PAYS
  receivingIntegrator: ObjectId ref Integrator, // WHO RECEIVES (engineer's owner)
  engineer: ObjectId ref User,                 // WHO WORKS
  project: ObjectId ref Project,
  scheduler: ObjectId ref Scheduler,           // Unique per scheduler

  // Amount Breakdown
  grossAmount: Number,                         // Total charged to paying integrator
  platformFeePercentage: Number,               // Default 10%
  platformFeeAmount: Number,                   // Snatchi takes this
  netAmount: Number,                           // Receiving integrator gets this

  // Payment Status Lifecycle
  paymentStatus: String enum [
    'pending_creation',
    'intent_created',
    'processing',
    'succeeded',
    'failed',
    'requires_action',
    'refunded',
    'disputed'
  ],

  // Stripe Payment Fields
  paymentIntentId: String,
  clientSecret: String,
  chargeId: String,
  currency: String,

  // Failure Tracking
  failureCode: String,
  failureMessage: String,
  failureAttempts: Number,
  lastFailureAt: Date,

  // Transfer to Receiving Integrator's Connect Account
  transferId: String,
  transferStatus: String enum [
    'pending',
    'in_transit',
    'paid',
    'failed',
    'reversed'
  ],

  // Refund Fields
  refundId: String,
  refundAmount: Number,
  refundReason: String,
  refundNotes: String,

  // Dispute Fields
  disputeId: String,
  disputeReason: String,
  disputeStatus: String,

  // Timeline
  createdAt: Date,
  paymentAttemptedAt: Date,
  paymentSucceededAt: Date,
  transferInitiatedAt: Date,
  payoutReleasedAt: Date,
  refundedAt: Date,
  updatedAt: Date
}
```

**Decision:** New Payment model created to track cross-integrator payments.

---

### 1.5 Current Stripe Integration (EXISTING)

**Status:** Subscription-focused

**Current Capabilities:**
```
✅ Create Stripe customers for integrators (subscription)
✅ Manage subscriptions (recurring billing)
✅ Handle subscription webhooks
✅ Customer Portal integration
✅ Webhook deduplication
```

**NOT Present:**
```
❌ Integrator Connect account creation
❌ Connect onboarding flow
❌ Payment Intent creation for services
❌ Destination charges
❌ Transfers to Connect accounts
❌ Connect account status webhooks
```

**Decision:** Extend existing Stripe infrastructure with Connect capabilities.

---

### 1.6 Webhook Configuration (EXISTING)

**Current Webhooks:**
```
✅ customer.subscription.* (3 events)
✅ invoice.payment_* (2 events)
✅ customer.source.updated
✅ customer.subscription.trial_will_end
```

**New Webhooks Needed:**
```
❌ account.updated (integrator Connect status)
❌ payment_intent.succeeded
❌ payment_intent.payment_failed
❌ charge.refunded
❌ transfer.created / transfer.paid
```

**Decision:** Extend webhook configuration for Connect events.

---

## SECTION 2: NEW ARCHITECTURE

### 2.1 Payment Flow Diagram (TEXT)

```
PAYING INTEGRATOR (Integrator B) Initiates Payment
        ↓
        [Selects engineer from Integrator A's team]
        ↓
        [Confirms assignment & rate]
        ↓
        [Clicks "Pay for Service"]
        ↓
        [Stripe Payment Intent Created]
        ↓
        [Integrator B provides payment method]
        ↓
        [Stripe charges Integrator B's card]
        ↓
        [Payment Succeeded]
        ├── Stripe deducts platform fee (10%)
        ├── Remaining amount credited to RECEIVING INTEGRATOR (Integrator A's Connect account)
        └── Engineer John is noted in metadata but receives NO direct payment
        ↓
        [Transfer created to Integrator A's Connect account]
        ↓
        [Transfer delivered to Integrator A's bank]
        ↓
        [Integrator A is responsible for paying Engineer John locally]
```

### 2.2 Payment Timing: **Upfront (Before Work)**

Same as previous design. Payment collected before engineer starts work.

### 2.3 Payout Strategy: **Manual Release (Admin/Integrator Review)**

Same as previous design. Payment held briefly for review before transferring.

---

## SECTION 3: INTEGRATOR CONNECT ARCHITECTURE

### 3.1 Integrator Connect Account Setup

**Account Type:** Stripe Connect Express Account

**Who Gets Connected:** Integrators (not engineers)

**When Integrated:**
- Integrator wants to receive payments for their engineers
- Integrator needs to onboard to Stripe Connect
- Once onboarded, integrator can receive payments from other integrators booking their engineers

### 3.2 Integrator Onboarding Fields

**Required for Connect Onboarding:**
```
From Integrator model:
- name
- email
- address (street, city, country, postcode)
- phone (mobile)

Derived from User model (if integrator is also a user):
- date_of_birth (if individual integrator)
- bank account (collected by Stripe in onboarding)

From business documents:
- business_type (individual, partnership, corporation, nonprofit)
- tax_id (if required)
```

**Stripe Handles:**
- Identity verification
- Bank account verification
- KYC/AML compliance
- Account restrictions monitoring

### 3.3 Integrator Onboarding Flow

**Text Sequence:**

```
INTEGRATOR PROFILE PAGE
        ↓
[Payout Account Setup] Button
        ↓
Frontend: POST /api/stripe/integrator/create-onboarding-link
  - Params: integratorId
  - Returns: { onboardingUrl }
        ↓
Browser: Redirect to Stripe Connect Onboarding
  URL: https://connect.stripe.com/express/...
        ↓
INTEGRATOR COMPLETES ONBOARDING
  - Enters name, email, address
  - Provides banking details
  - Verifies identity (if required)
  - Stripe verifies business documents
        ↓
Stripe Redirects to App
  - Success: /protected/integrator/payout-setup?status=success
  - Refresh: /protected/integrator/payout-setup?status=refresh_required
  - Return: /protected/integrator/payout-setup?status=user_canceled
        ↓
Stripe Sends Webhook: account.updated
  - Integrator.stripeConnectAccountId = acct_...
  - Integrator.chargesEnabled = true
  - Integrator.payoutsEnabled = true
  - Integrator.connectAccountStatus = 'verified'
        ↓
App Notifications
  - Email: "Your payout account is ready!"
  - UI: Show verified badge on profile
```

### 3.4 Integrator Account Status

**Statuses Tracked:**
```
null / undefined           → Not started
'onboarding_started'       → Link clicked, form in progress
'one_time_verification_complete' → Basic info verified
'verified'                 → Full verification complete (can receive payouts)
'restricted'               → Account restricted (charges_enabled=false)
'restricted.under_review'  → Under Stripe risk review
'requirements_pending'     → Awaiting additional documents
'verification_failed'      → Failed verification
```

**Key Fields in Integrator:**
```
stripeConnectAccountId: 'acct_...'
connectAccountStatus: 'verified'
chargesEnabled: true
payoutsEnabled: true
connectOnboardingCompletedAt: Date
```

### 3.5 Account.Updated Webhook Handling

**When Fired:** Any change to Integrator's Connect account status

**App Action:**
```
1. Find Integrator by stripeConnectAccountId
2. Extract account status
3. Update Integrator model:
   - connectAccountStatus
   - chargesEnabled
   - payoutsEnabled
4. If verification failed:
   - Set connectRejectReason
   - Send email to integrator with action needed
5. If verification succeeded:
   - Integrator can now receive payments
   - Send success notification
6. Record webhook event for audit
```

---

## SECTION 4: DATABASE SCHEMA CHANGES

### 4.1 User/Engineer Model

**Changes:** NONE ✅

User model remains unchanged. Engineers do NOT need Connect accounts.

```javascript
// NO NEW FIELDS ADDED TO USER MODEL
// User.integrator field identifies the engineer's owner
```

---

### 4.2 Integrator Model Additions

**File:** `app/api/models/integrator.js`

**New Fields:**

```javascript
// Stripe Connect Express Account (for receiving service payments)
stripeConnectAccountId: {
  type: String,
  trim: true,
  default: '',
  sparse: true,
  index: true
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
  default: null,
  index: true
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
  default: ''
},

// Capabilities (from account.updated webhook)
chargesEnabled: {
  type: Boolean,
  default: false // Can receive charges
},
payoutsEnabled: {
  type: Boolean,
  default: false // Can receive payouts
},

// Marketplace Settings
marketplaceEnabled: {
  type: Boolean,
  default: true // Can participate in marketplace
},
platformFeePercentage: {
  type: Number,
  default: 10 // Default 10% platform fee
},

// Payment Statistics
totalPaymentsReceived: {
  type: Number,
  default: 0
},
totalAmountReceived: {
  type: Number,
  default: 0
},
totalPlatformFeesDeducted: {
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
}
```

---

### 4.3 Scheduler Model Additions

**File:** `app/api/models/scheduler.js`

**New Fields:**

```javascript
// Multi-Integrator Payment Tracking
payingIntegrator: {
  type: Schema.Types.ObjectId,
  ref: 'Integrator',
  required: false,
  default: null,
  index: true
  // Populated only if different from integrator (cross-integrator booking)
},

// Payment Details
rate: {
  type: Number,
  required: false,
  default: 0
},
rateType: {
  type: String,
  enum: ['hourly', 'daily', 'fixed'],
  default: 'hourly'
},
estimatedHours: {
  type: Number,
  required: false,
  default: 0
},
estimatedAmount: {
  type: Number,
  required: false,
  default: 0
},
actualHours: {
  type: Number,
  required: false,
  default: 0
},
actualAmount: {
  type: Number,
  required: false,
  default: 0
},

// Stripe Payment Fields
paymentIntentId: {
  type: String,
  trim: true,
  default: '',
  index: true
},
chargeId: {
  type: String,
  trim: true,
  default: '',
  index: true
},
paymentStatus: {
  type: String,
  enum: [
    'pending',
    'processing',
    'succeeded',
    'failed',
    'requires_action',
    'refunded',
    'disputed'
  ],
  default: 'pending',
  index: true
},

// Receiving Integrator (engineer's owner)
receivingIntegratorId: {
  type: Schema.Types.ObjectId,
  ref: 'Integrator',
  required: false,
  default: null,
  index: true
  // Populated from engineer.integrator at payment creation time
},

// Platform Fee
platformFeePercentage: {
  type: Number,
  default: 10
},
platformFeeAmount: {
  type: Number,
  default: 0
},
receiverAmount: {
  type: Number,
  default: 0
  // Amount receiving integrator will receive
},

// Transfer to Receiving Integrator's Connect Account
transferId: {
  type: String,
  trim: true,
  default: '',
  index: true
},
transferStatus: {
  type: String,
  enum: [
    'pending',
    'in_transit',
    'paid',
    'failed',
    'reversed'
  ],
  default: 'pending'
},

// Timeline
paymentInitiatedAt: {
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

// Refunds
refundId: {
  type: String,
  trim: true,
  default: ''
},
refundedAt: {
  type: Date,
  default: null
},
refundReason: {
  type: String,
  enum: [
    'duplicate',
    'fraudulent',
    'requested_by_customer',
    'service_not_provided',
    'quality_issue'
  ],
  default: null
},
refundNotes: {
  type: String,
  trim: true,
  default: ''
},

// Dispute
disputeId: {
  type: String,
  trim: true,
  default: ''
},
disputeReason: {
  type: String,
  trim: true,
  default: ''
}
```

---

### 4.4 New Payment Model

**File:** `app/api/models/payment.js` (CREATE NEW)

**Purpose:** Detailed cross-integrator payment tracking

```javascript
const paymentSchema = new mongoose.Schema(
  {
    // References
    payingIntegrator: {
      type: Schema.Types.ObjectId,
      ref: 'Integrator',
      required: true,
      index: true
    },
    receivingIntegrator: {
      type: Schema.Types.ObjectId,
      ref: 'Integrator',
      required: true,
      index: true
      // Engineer's owning integrator
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
      index: true
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },

    // Amount Breakdown
    grossAmount: {
      type: Number,
      required: true
      // Total charged to paying integrator
    },
    platformFeePercentage: {
      type: Number,
      required: true,
      default: 10
    },
    platformFeeAmount: {
      type: Number,
      required: true
      // Snatchi retains
    },
    netAmount: {
      type: Number,
      required: true
      // Receiving integrator gets this
    },

    // Payment Status
    paymentStatus: {
      type: String,
      enum: [
        'pending_creation',
        'intent_created',
        'processing',
        'succeeded',
        'failed',
        'requires_action',
        'refunded',
        'disputed'
      ],
      required: true,
      default: 'pending_creation',
      index: true
    },

    // Stripe Fields
    paymentMethodId: String,
    paymentIntentId: {
      type: String,
      trim: true,
      index: true
    },
    clientSecret: String,
    chargeId: {
      type: String,
      trim: true,
      index: true
    },

    // Payment Details
    currency: {
      type: String,
      default: 'gbp',
      enum: ['gbp', 'usd', 'eur']
    },
    description: String,
    metadata: {
      type: Map,
      of: String
    },

    // Failure Tracking
    failureCode: String,
    failureMessage: String,
    failureAttempts: {
      type: Number,
      default: 0
    },
    lastFailureAt: Date,

    // Transfer to Receiving Integrator's Connect Account
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
        'reversed'
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
    refundNotes: String,

    // Dispute Fields
    disputeId: {
      type: String,
      trim: true,
      index: true
    },
    disputeReason: String,
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
    paymentAttemptedAt: Date,
    paymentSucceededAt: {
      type: Date,
      default: null,
      index: true
    },
    transferInitiatedAt: Date,
    payoutReleasedAt: {
      type: Date,
      default: null,
      index: true
    },
    refundedAt: Date,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ payingIntegrator: 1, createdAt: -1 });
paymentSchema.index({ receivingIntegrator: 1, createdAt: -1 });
paymentSchema.index({ engineer: 1, createdAt: -1 });
paymentSchema.index({ paymentStatus: 1, createdAt: -1 });
paymentSchema.index({ transferStatus: 1, payoutReleasedAt: 1 });
```

---

### 4.5 Updated Status Constants

**File:** `app/api/constants/statuses.js`

**Update SCHEDULER_STATUS:**

```javascript
export const SCHEDULER_STATUS = {
  PENDING: 'Pending',              // Initial
  DECLINED: 'Declined',            // Engineer declined
  ACCEPTED: 'Accepted',            // Engineer accepted
  AWAITING_PAYMENT: 'AwaitingPayment', // Payment processing
  PAID: 'Paid',                    // Payment succeeded
  PROGRESS: 'Progress',            // Work in progress
  COMPLETED: 'Completed',          // Work done
  APPROVED: 'Approved',            // Integrator approved work
  RELEASED: 'Released',            // Payout released to receiving integrator
  PAYMENT_FAILED: 'PaymentFailed', // Payment failed
  REFUNDED: 'Refunded',            // Payment refunded
  DISPUTED: 'Disputed',            // Payment disputed
  CANCELLED: 'Cancelled'           // Cancelled
};

export const PAYMENT_STATUS = {
  PENDING_CREATION: 'pending_creation',
  INTENT_CREATED: 'intent_created',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REQUIRES_ACTION: 'requires_action',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed'
};

export const INTEGRATOR_CONNECT_STATUS = {
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
  REVERSED: 'reversed'
};
```

---

## SECTION 5: API ROUTE PLAN

### 5.1 Integrator Connect Onboarding Routes

#### Route 1: Create Integrator Onboarding Link
```
POST /api/stripe/integrator/create-onboarding-link

Request:
{
  "integratorId": "integrator_object_id"
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
  "error": "Integrator already onboarded",
  "code": "ALREADY_ONBOARDED"
}

Response (Failure - Missing fields):
{
  "success": false,
  "error": "Integrator must have name and email before onboarding",
  "code": "MISSING_INTEGRATOR_INFO",
  "requiredFields": ["name", "email"]
}
```

#### Route 2: Get Integrator Connect Status
```
GET /api/stripe/integrator/connect-status?integratorId={id}

Response:
{
  "success": true,
  "data": {
    "integratorId": "integrator_object_id",
    "stripeConnectAccountId": "acct_...",
    "connectAccountStatus": "verified",
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "connectOnboardingCompletedAt": "2026-05-20T10:30:00Z",
    "bankAccountOnFile": true,
    "requirements": {
      "currentlyDue": [],
      "eventuallyDue": [],
      "pastDue": []
    }
  }
}
```

#### Route 3: Refresh Integrator Onboarding Status
```
POST /api/stripe/integrator/refresh-onboarding

Request:
{
  "integratorId": "integrator_object_id"
}

Response:
{
  "success": true,
  "status": "verified",
  "message": "Onboarding status refreshed"
}
```

#### Route 4: Retrieve Integrator Onboarding Link (Resume)
```
POST /api/stripe/integrator/retrieve-onboarding-link

Request:
{
  "integratorId": "integrator_object_id"
}

Response:
{
  "success": true,
  "onboardingUrl": "https://connect.stripe.com/express/...",
  "message": "Resume your account setup"
}
```

---

### 5.2 Cross-Integrator Payment Routes

#### Route 5: Create Payment Intent (Cross-Integrator)
```
POST /api/stripe/payment/create-intent

Request:
{
  "schedulerId": "scheduler_object_id",
  "payingIntegratorId": "integrator_object_id", // Who pays
  // receivingIntegratorId derived from engineer.integrator
  "amount": 5000, // in cents
  "description": "Frontend Development - 2 days"
}

Response:
{
  "success": true,
  "data": {
    "clientSecret": "pi_..._secret_...",
    "paymentIntentId": "pi_...",
    "amount": 5000,
    "platformFeeAmount": 500,
    "receiverAmount": 4500, // What receiving integrator gets
    "currency": "gbp",
    "status": "requires_payment_method",
    "payingIntegrator": "integrator_paying_...",
    "receivingIntegrator": "integrator_receiving_...",
    "engineer": "engineer_...",
    "message": "Payment will be transferred to receiving integrator"
  }
}

Errors:
{
  "success": false,
  "error": "Receiving integrator not onboarded",
  "code": "RECEIVER_NOT_ONBOARDED",
  "message": "Engineer's owning integrator must complete payout setup first"
}

{
  "success": false,
  "error": "Receiving integrator account restricted",
  "code": "RECEIVER_RESTRICTED",
  "message": "Receiving integrator's account is restricted. Payment cannot be processed."
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
  "platformFeeAmount": 500,
  "receiverAmount": 4500,
  "message": "Payment captured. Transfer to receiving integrator initiated."
}

Response (Requires Action):
{
  "success": false,
  "paymentStatus": "requires_action",
  "clientSecret": "pi_..._secret_...",
  "code": "REQUIRES_ACTION"
}

Response (Failure):
{
  "success": false,
  "paymentStatus": "failed",
  "code": "PAYMENT_DECLINED",
  "failureReason": "card_declined",
  "message": "Payment was declined"
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
    "amount": 5000,
    "platformFeeAmount": 500,
    "receiverAmount": 4500,
    "payingIntegrator": "...",
    "receivingIntegrator": "...",
    "engineer": "...",
    "transferId": "tr_...",
    "transferStatus": "paid",
    "paymentSucceededAt": "2026-05-20T10:30:00Z",
    "payoutReleasedAt": "2026-05-21T14:00:00Z"
  }
}
```

---

### 5.3 Payment History Routes

#### Route 8: Get Integrator Payment History (As Receiver)
```
GET /api/stripe/integrator/payments-received?integratorId={id}

Response:
{
  "success": true,
  "data": {
    "totalReceived": 25000,
    "totalPlatformFeesDeducted": 2500,
    "netReceived": 22500,
    "paymentCount": 5,
    "payments": [
      {
        "id": "payment_object_id",
        "payingIntegrator": { "id": "...", "name": "Company B" },
        "engineer": { "id": "...", "name": "John Doe" },
        "amount": 5000,
        "platformFee": 500,
        "receivedAmount": 4500,
        "status": "paid",
        "transferStatus": "paid",
        "paymentDate": "2026-05-20T10:30:00Z",
        "payoutDate": "2026-05-22T10:00:00Z",
        "schedulerId": "..."
      }
    ]
  }
}
```

#### Route 9: Get Integrator Payment History (As Payer)
```
GET /api/stripe/integrator/payments-made?integratorId={id}

Response:
{
  "success": true,
  "data": {
    "totalPaid": 25000,
    "totalPlatformFees": 2500,
    "totalTransferred": 22500,
    "paymentCount": 5,
    "payments": [
      {
        "id": "payment_object_id",
        "receivingIntegrator": { "id": "...", "name": "Company A" },
        "engineer": { "id": "...", "name": "John Doe" },
        "amount": 5000,
        "platformFee": 500,
        "transferredAmount": 4500,
        "status": "paid",
        "paymentDate": "2026-05-20T10:30:00Z",
        "transferDate": "2026-05-22T10:00:00Z",
        "schedulerId": "..."
      }
    ]
  }
}
```

---

### 5.4 Refund Routes

#### Route 10: Refund Payment
```
POST /api/stripe/payment/refund

Request:
{
  "paymentId": "payment_object_id",
  "amount": 5000, // Full or partial
  "reason": "requested_by_customer",
  "notes": "Customer requested cancellation"
}

Response:
{
  "success": true,
  "data": {
    "refundId": "re_...",
    "amount": 5000,
    "status": "succeeded",
    "message": "Refund processed and transferred back to paying integrator"
  }
}
```

---

## SECTION 6: WEBHOOK PLAN

### 6.1 New Webhooks to Configure

#### Webhook 1: account.updated (Integrator Connect)
```
When: Integrator's Connect account status changes
Endpoint: POST /api/webhooks

Event Details:
{
  "type": "account.updated",
  "data": {
    "object": {
      "id": "acct_...",
      "charges_enabled": true,
      "payouts_enabled": true,
      "requirements": {...},
      "restrictions": []
    }
  }
}

App Action:
1. Find Integrator by stripeConnectAccountId
2. Update Integrator.connectAccountStatus
3. Update Integrator.chargesEnabled / payoutsEnabled
4. If verification failed: send notification to integrator
5. If verified: send success email
```

#### Webhook 2: payment_intent.succeeded
```
When: Payment Intent successfully confirmed
Endpoint: POST /api/webhooks

Event Details:
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_...",
      "amount": 5000,
      "charges": {
        "data": [{ "id": "ch_..." }]
      },
      "metadata": {
        "schedulerId": "...",
        "payingIntegratorId": "...",
        "receivingIntegratorId": "..."
      }
    }
  }
}

App Action:
1. Find Payment by paymentIntentId
2. Extract chargeId
3. Update Payment: status=succeeded, paymentSucceededAt
4. Update Scheduler: status=Paid, paymentCollectedAt
5. Calculate platform fee and receiver amount
6. Create Transfer to receivingIntegrator's Connect account
7. Notify payingIntegrator: "Payment succeeded"
8. Notify receivingIntegrator: "Payment received. Payout pending."
9. Notify engineer (via their owning integrator): "Payment received for your service"
```

#### Webhook 3: payment_intent.payment_failed
```
When: Payment attempt fails
Endpoint: POST /api/webhooks

Event Details:
{
  "type": "payment_intent.payment_failed",
  "data": {
    "object": {
      "id": "pi_...",
      "last_payment_error": {
        "code": "card_declined",
        "message": "..."
      }
    }
  }
}

App Action:
1. Find Payment by paymentIntentId
2. Update Payment: status=failed, failureCode, failureMessage
3. Update Scheduler: status=PaymentFailed
4. Notify payingIntegrator: "Payment failed. Retry or use different card."
5. Notify receivingIntegrator: "Payment for this engineer service failed"
```

#### Webhook 4: charge.refunded
```
When: Refund processed
Endpoint: POST /api/webhooks

App Action:
1. Find Payment by chargeId
2. Update Payment: status=refunded, refundId
3. If Transfer already created: reverse it
4. Notify payingIntegrator: "Refund processed"
5. Notify receivingIntegrator: "Payout reversed due to refund"
```

#### Webhook 5: transfer.created
```
When: Transfer to receivingIntegrator's Connect account initiated
Endpoint: POST /api/webhooks

App Action:
1. Find Payment by transferId (from metadata)
2. Update Payment: transferStatus=in_transit
3. Update Scheduler: transferId
4. Notify receivingIntegrator: "Payout initiated. Should arrive in 1-2 days."
```

#### Webhook 6: transfer.paid
```
When: Transfer successfully delivered to receivingIntegrator's bank
Endpoint: POST /api/webhooks

App Action:
1. Find Payment by transferId
2. Update Payment: transferStatus=paid
3. Update Integrator (receiver): totalAmountReceived += netAmount
4. Update Scheduler: payoutReleasedAt = now
5. Notify receivingIntegrator: "Payout of £4,500 delivered to your bank!"
6. Now receivingIntegrator is responsible for paying engineer
```

---

## SECTION 7: UI/UX CHANGES

### 7.1 Integrator Payout Setup Screen

```
Location: /protected/integrator/profile or /dashboard/payout-setup

Component: PayoutSetup
├── Status Card
│   ├── If not started:
│   │   └── [Setup Payout Account] → Opens Stripe onboarding
│   ├── If in progress:
│   │   └── "Onboarding in progress..." + [Resume] Button
│   └── If verified:
│       ├── ✓ Account verified
│       ├── Bank account: ••••1234
│       └── [Change Bank Account] Button
│
├── Earnings Summary (if verified)
│   ├── Total Received: £45,000
│   ├── This Month: £8,500
│   ├── Pending: £5,000 (payments awaiting release)
│   └── [View Payment History] Button
│
└── Notes
    ├── "This account receives payments when other integrators book your engineers"
    ├── "You are responsible for paying your engineers for their work"
```

### 7.2 Scheduler Payment UI (Cross-Integrator)

```
Location: /protected/integrator/projects/{projectId}/assign-engineer

New Section: Booking Engineer from Another Integrator
├── Engineer Selector
│   ├── Shows available engineers
│   ├── Filters by integrator
│   └── Shows: Name, Company (owning integrator), Rate
│
├── If engineer is from another integrator:
│   ├── Notice: "⚠️ You'll pay Company A to book John"
│   ├── "Payments go directly to Company A's account"
│   └── "Company A will handle payment to John"
│
├── Rate & Amount
│   ├── Rate: £50/hour
│   ├── Estimated hours: 40
│   ├── Total: £2,000
│   ├── Platform fee (10%): £200
│   └── Company A receives: £1,800
│
└── Checkbox
    └── ☑️ I understand payment goes to Company A
```

### 7.3 Payment Confirmation Modal (Cross-Integrator)

```
Modal: "Confirm Engineer Booking & Payment"
├── Engineer: John Doe (Company A)
├── Project: Website Redesign
├── Amount: £2,000.00
├── Platform Fee: £200.00
├── Company A Receives: £1,800.00
├── Timeline:
│   ├── 1. You pay → Status: AwaitingPayment
│   ├── 2. Payment succeeds → Status: Paid
│   ├── 3. Payment transferred to Company A → Status: Released
│   └── 4. John starts work → Status: Progress
│
├── Note: "John is an engineer of Company A. Your payment goes to them."
│
└── [Cancel] [Confirm & Pay]
```

### 7.4 Payment History (Receiving Integrator View)

```
Location: /protected/integrator/payments-received

Table: "Payments Received for Your Engineers"
├── Paying Company | Engineer | Amount | Fee | Received | Date | Status
├── Company B | John Doe | £2,000 | £200 | £1,800 | May 20 | Paid
├── Company C | Jane Smith | £3,000 | £300 | £2,700 | May 19 | Paid
└── Company D | Bob Wilson | £1,500 | £150 | £1,350 | May 18 | Paid

Summary:
├── Total Received: £25,000
├── Total Fees Deducted: £2,500
├── Net Received: £22,500
└── [Download Statement]

Note at bottom:
"You are responsible for paying your engineers for their work.
This platform handles the cross-integrator payment routing only."
```

### 7.5 Payment History (Paying Integrator View)

```
Location: /protected/integrator/payments-made

Table: "Payments Made for Engineer Services"
├── Engineer | Company | Amount | Fee | Transferred | Date | Status
├── John Doe | Company A | £2,000 | £200 | £1,800 | May 20 | Paid
├── Jane Smith | Company A | £3,000 | £300 | £2,700 | May 19 | Paid
└── Bob Wilson | Company B | £1,500 | £150 | £1,350 | May 18 | Paid

Summary:
├── Total Paid: £25,000
├── Total Fees: £2,500
├── Total Transferred: £22,500
└── [Download Receipt]
```

### 7.6 Engineer Dashboard (No Changes)

**Important:** Engineers do NOT see payment details in the app

Engineer's view of scheduler:
```
Assignment Details
├── Project: Website Redesign
├── Company: Company A (their owning integrator)
├── Dates: May 20-22
├── Status: In Progress
└── NOTE: Payment is between companies, engineer paid by Company A directly
```

---

## SECTION 8: PAYMENT ROUTING LOGIC

### 8.1 Determining Receiving Integrator

**When:** Payment Intent created

**Logic:**
```
1. Get Scheduler by schedulerId
2. Get Engineer by Scheduler.engineer
3. Receiving Integrator = Engineer.integrator
4. Verify:
   - receivingIntegrator.connectAccountStatus === 'verified'
   - receivingIntegrator.chargesEnabled === true
   - receivingIntegrator.payoutsEnabled === true
5. If not verified:
   - Block payment
   - Return error: "Receiving integrator not onboarded"
```

### 8.2 Amount Calculation

```
grossAmount = Scheduler.estimatedAmount
platformFeePercentage = Integrator.platformFeePercentage (default 10%)
platformFeeAmount = grossAmount × (platformFeePercentage / 100)
netAmount = grossAmount - platformFeeAmount

Example:
grossAmount = £5,000
platformFeePercentage = 10%
platformFeeAmount = £500 (Snatchi)
netAmount = £4,500 (Receiving integrator gets)
```

### 8.3 Platform Fee Accounting

```
Snatchi Revenue Model:
1. Subscription fees (existing B2B billing)
2. Platform fees on engineer service payments (10% default)

Integrator Fees:
- Paying Integrator: Pays full amount (£5,000)
- Receiving Integrator: Receives net amount (£4,500)
- Platform: Retains platform fee (£500)

Reporting:
- Track totalPlatformFeesCollected per Integrator
- Daily revenue: Sum of all platform fees
- Monthly reports by integrator
```

---

## SECTION 9: SECURITY & COMPLIANCE

### 9.1 Cross-Integrator Authorization

```
Before creating payment:
1. Verify payingIntegratorId exists and belongs to authenticated user
2. Verify engineer.integrator exists (receiving integrator)
3. Verify receiving integrator is onboarded
4. Verify no circular payments (can't pay yourself)
5. Verify engineer is not already assigned to paying integrator
6. Audit log: who paid, who received, amount
```

### 9.2 Receiving Integrator Verification

```
Before accepting payment:
1. Check Integrator.chargesEnabled === true
2. Check Integrator.payoutsEnabled === true
3. Check Integrator.connectAccountStatus === 'verified'
4. Check no restrictions on account
5. Stripe API call to verify account status
```

### 9.3 Platform Fee Integrity

```
Before charging:
1. Verify platform fee calculation
2. Ensure platform fee >= 0% and <= 100% (default 10%)
3. Verify netAmount = grossAmount - platformFeeAmount
4. Log all amounts for audit
```

### 9.4 Prevent Fraud

```
Measures:
1. Only onboarded integrators can receive payments
2. Payments can't be created without receiving integrator verification
3. Webhook deduplication prevents duplicate transfers
4. Idempotency keys prevent duplicate charges
5. All payments logged for audit
```

---

## SECTION 10: RISKS & OPEN QUESTIONS

### 10.1 Identified Risks

#### Risk 1: Receiving Integrator Not Onboarded
**Risk:** Payment created but receiving integrator not verified

**Mitigation:**
- ✅ Block payment intent creation if receiver not onboarded
- ✅ Show UI prompt: "Confirm engineer's company has completed payout setup"
- ✅ Link to receiver's onboarding status

#### Risk 2: Receiving Integrator Doesn't Pay Engineer
**Risk:** Integrator A receives £4,500 but doesn't pay Engineer John

**Mitigation:**
- ⚠️ This is out of scope for Snatchi (legal/business issue)
- ✅ App notifies engineer's owning integrator of received payment
- ✅ Engineer can contact their integrator if not paid
- 📋 Consider adding "payment receipt" feature in Phase 2

#### Risk 3: Cross-Integrator Abuse
**Risk:** Integrator A books all engineers from Integrator B without compensation

**Mitigation:**
- ✅ Payment is required before work starts (upfront)
- ✅ Engineer must accept assignment (can decline)
- ✅ Integrator B receives payment notification immediately
- 📋 Future: Integrator B can block/whitelist booking integrators

#### Risk 4: Payment Failure During Transfer
**Risk:** Charge succeeds but transfer to receiving integrator fails

**Mitigation:**
- ✅ Retry logic on transfer failures
- ✅ Manual admin interface to retry transfers
- ✅ Hold payment in limbo until transfer succeeds
- ✅ Refund if transfer ultimately fails

#### Risk 5: Dispute Handling Complexity
**Risk:** Payment disputed; need to reverse transfer to receiving integrator

**Mitigation:**
- ✅ If dispute lost: reverse transfer to paying integrator
- ✅ Receiving integrator notified of reversal
- ✅ Clear dispute timeline in UI
- ✅ Admin review capability

### 10.2 Open Questions for Product Team

1. **Circular Relationships:**
   - Q: Can Integrator A book Integrator B's engineers while B books A's engineers?
   - Recommendation: Yes, independent relationships

2. **Minimum/Maximum Amounts:**
   - Q: What are limits per payment?
   - Recommendation: Min £10, Max £50,000 (configurable)

3. **Service Level Agreement:**
   - Q: How long before receiving integrator must pay engineer?
   - Recommendation: Out of scope; business agreement between integrators

4. **Blocking/Whitelisting:**
   - Q: Can receiving integrator block paying integrators?
   - Recommendation: Phase 2 feature

5. **Commission Rate:**
   - Q: Fixed 10% or variable per integrator?
   - Recommendation: 10% default; allow customization in settings

6. **Recurring Bookings:**
   - Q: Can integrators set up recurring engineer bookings?
   - Recommendation: Phase 2; each booking is one-time in Phase 1

7. **Dispute Resolution:**
   - Q: Who resolves disputes between integrators?
   - Recommendation: Snatchi as neutral third party; manual admin review

8. **Receiving Integrator Restrictions:**
   - Q: What if receiving integrator's account becomes restricted?
   - Recommendation: Block new payments; reverse transfer if already created

9. **Email Notifications:**
   - Q: Should engineer see payment emails?
   - Recommendation: No; engineer contacts their own integrator

10. **Multi-Currency:**
    - Q: Cross-currency payments (e.g., GBP → USD)?
    - Recommendation: Phase 2; Phase 1 single currency only

---

## SECTION 11: IMPLEMENTATION PHASES

### Phase 1: MVP (Weeks 1-4)

**Scope:** Basic cross-integrator payment flow

**Deliverables:**
- [ ] Integrator model Connect account fields
- [ ] Payment model (CREATE new)
- [ ] Integrator Connect onboarding UI + routes
- [ ] Payment Intent creation (cross-integrator)
- [ ] Payment confirmation
- [ ] account.updated webhook handling
- [ ] payment_intent.succeeded webhook handling
- [ ] payment_intent.payment_failed webhook handling
- [ ] Scheduler payment tracking fields
- [ ] Payment history UI (receiving integrator)
- [ ] Payment history UI (paying integrator)
- [ ] Email notifications

**NOT Included:**
- Automatic transfers (manual review)
- Refunds (blocked in Phase 1)
- Disputes (monitoring only)
- Recurring bookings
- Multi-currency

### Phase 2: Transfers & Payouts (Weeks 5-8)

**Scope:** Transfer payouts to receiving integrator

**Deliverables:**
- [ ] Manual payout release UI
- [ ] Create Transfer to receiving integrator's Connect account
- [ ] transfer.created webhook handling
- [ ] transfer.paid webhook handling
- [ ] Payout history UI
- [ ] Automatic batch payout scheduling
- [ ] Status constant expansion

### Phase 3: Refunds & Disputes (Weeks 9-12)

**Scope:** Refund and chargeback handling

**Deliverables:**
- [ ] Refund creation API
- [ ] charge.refunded webhook handling
- [ ] Reverse transfer logic
- [ ] Dispute details API
- [ ] charge.dispute.created webhook handling
- [ ] Admin dispute management UI

### Phase 4: Advanced (Weeks 13+)

**Scope:** Optimization and features

**Deliverables:**
- [ ] Integrator blocking/whitelisting
- [ ] Multi-currency support
- [ ] Recurring bookings
- [ ] Payment analytics
- [ ] Audit reports

---

## SECTION 12: DATABASE MIGRATION STRATEGY

### 12.1 Safe Schema Changes

```
Phase 1 Changes:
1. Add Integrator Connect fields (non-breaking, defaults)
2. Add Payment model (new collection)
3. Add Scheduler payment fields (non-breaking, defaults)

All changes:
- ✅ Backward compatible
- ✅ No data migration needed
- ✅ Can rollback without data loss
```

---

## SECTION 13: KEY DIFFERENCES FROM PREVIOUS DESIGN

### Cancelled (❌)

```
❌ Engineer Stripe Connect accounts
❌ Engineer payout scheduling
❌ Engineer earnings tracking (in app)
❌ Direct transfers to engineers
❌ Engineer onboarding flow
❌ Engineer payout dashboard
```

### Added (✅)

```
✅ Integrator Stripe Connect accounts
✅ Cross-integrator payment routing
✅ Receiving integrator determination logic
✅ Payment goes to integrator's Connect account
✅ Integrator responsible for engineer compensation
✅ Platform fee deduction before transfer
✅ Integrator payment history (both directions)
```

### Unchanged (➡️)

```
➡️ Subscription billing (separate system)
➡️ Scheduler assignment flow
➡️ Engineer acceptance/decline
➡️ Status constants (updated but compatible)
➡️ Webhook infrastructure (extended)
➡️ Rate tracking (enhanced)
```

---

## SUMMARY TABLE

| Component | Previous | Revised | Status |
|-----------|----------|---------|--------|
| Engineer Connect | ✅ (Removed) | ❌ Not Used | ✅ Design |
| Integrator Connect | ❌ Missing | ✅ Required | ✅ Design |
| Payment Recipient | Engineer | Owning Integrator | ✅ Design |
| User Model Updates | 10 fields | 0 fields | ✅ Design |
| Integrator Model Updates | 8 fields | 15 fields | ✅ Design |
| Scheduler Updates | 18 fields | 28 fields | ✅ Design |
| Payment Model | New | New | ✅ Design |
| Cross-Integrator Logic | Not needed | Core feature | ✅ Design |

---

## CONCLUSION

This revised architecture shifts from an engineer-centric payment model to an **integrator-centric payment routing system**.

**Key Changes:**
- ✅ Only integrators manage Stripe Connect
- ✅ Payments route to engineer's owning integrator
- ✅ Platform fee deducted before transfer
- ✅ Integrators handle engineer compensation offline
- ✅ Simpler, less risky architecture

**No Conflicts:**
- ✅ Subscription billing unaffected
- ✅ All changes backward compatible
- ✅ Phased rollout possible

**Timeline:**
- Phase 1 MVP: 4 weeks
- Full implementation: 3-4 months

---

**Document Version:** 1.0 (Revised)  
**Previous Document:** STRIPE_CONNECT_ENGINEER_PAYMENT_PLAN.md (SUPERSEDED)  
**Status:** Ready for Review & Implementation  
**Next Step:** Product approval, then code implementation
