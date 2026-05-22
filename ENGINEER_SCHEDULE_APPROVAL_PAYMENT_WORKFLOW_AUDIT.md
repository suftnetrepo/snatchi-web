# Engineer Schedule Approval Payment Workflow Audit

## Workflow Status

Implemented workflow in code:

- `Pending -> Accepted -> Approved -> AwaitingPayment -> ReadyToStart -> InProgress -> Completed`

Observed compatibility statuses still present in code/model:

- `Progress` -> normalized to `InProgress`
- `Ready` -> normalized to `ReadyToStart`
- `Paid` -> retained in enum for backward compatibility, but successful payment now advances directly to `ReadyToStart`
- `Accepted`
- `Approved`

Assessment:

- Approval-before-payment is implemented.
- Payment success no longer jumps to `InProgress`.
- Legacy statuses still exist but are normalized in shared scheduler status helpers.

## Role Permissions Verified

- Engineer
  - can accept `Pending`
  - can decline `Pending`
  - can start `ReadyToStart`
  - can complete `InProgress`

- Integrator A / receiving integrator
  - can approve `Accepted`
  - sees `awaiting-approval` schedules where they own the engineer

- Integrator B / paying integrator
  - can pay only after `Approved` or `AwaitingPayment`
  - sees `awaiting-payment` schedules where they are the paying integrator

## Payment Trigger Verified

Effective UI/backend trigger after fixes:

```js
const canPay =
  ['Approved', 'AwaitingPayment'].includes(normalizeSchedulerStatus(schedule.status)) &&
  (!schedule.paymentStatus || schedule.paymentStatus === 'pending') &&
  schedule.payingIntegrator === currentIntegratorId &&
  schedule.estimatedAmount > 0 &&
  schedule.receivingIntegratorId !== currentIntegratorId &&
  schedule.receivingIntegratorId.connectAccountStatus === 'verified' &&
  schedule.receivingIntegratorId.chargesEnabled &&
  schedule.receivingIntegratorId.payoutsEnabled;
```

## UI Visibility Findings

Audited render points:

- `app/protected/integrator/scheduler/list/page.jsx`
- `app/protected/integrator/components/PaymentModal.tsx`
- `app/protected/integrator/components/PaymentButton.tsx`
- `app/components/payment/PaymentModal.tsx`
- `app/components/payment/PaymentButton.tsx`

Findings:

- Scheduler list payment action is now hidden unless approval/payment conditions are met.
- Payment visibility is now also blocked for self-payment and non-verified receiving integrators.
- Scheduler list now routes payment errors to visible UI instead of clearing them immediately.
- Generic payment button components still exist in the codebase; no scheduler list path currently renders them directly.

## Backend Gating Findings

Audited routes:

- `app/api/stripe/payment/create-intent/route.js`
- `app/api/stripe/payment/data/route.ts`
- `app/api/scheduler/[id]/status/route.js`

Verified:

- user must be authenticated
- user must be integrator for payment routes
- user integrator must match schedule paying integrator
- schedule must be `Approved` or `AwaitingPayment`
- accepted-but-not-approved payment is blocked with the required message
- successful existing payment blocks duplicate payment
- receiving integrator must match engineer owner
- receiving integrator must be Connect-ready
- self-payment is blocked
- only receiving integrator can approve an accepted schedule
- engineer cannot approve
- approval timestamp and approver fields are recorded

## Webhook Findings

Audited file:

- `app/api/services/webHooksService.js`

Verified:

- `payment_intent.succeeded` sets payment `paymentStatus = succeeded`
- scheduler `paymentStatus = succeeded`
- scheduler status becomes `ReadyToStart`
- `paidAt` and `readyToStartAt` are set through shared scheduler update logic
- payment success does not set scheduler directly to `InProgress`

Fix applied:

- transfer creation now uses receiving integrator Stripe Connect account ID instead of the local integrator database ID

## Dashboard And Filter Findings

Dashboard verified:

- `Awaiting Approval` = accepted schedules for current receiving integrator
- `Awaiting Payment` = approved/awaiting-payment schedules for current paying integrator with verified receiving integrator readiness
- `Ready To Start` = `ReadyToStart`

Scheduler filters verified:

- `awaiting-approval`
- `awaiting-payment`
- `ready-to-start`
- `in-progress`

Fix applied:

- dashboard stats now refresh when the authenticated integrator session becomes available

## Tenant Safety Findings

Verified and fixed:

- `getAllSchedules` only returns schedules where current integrator is booking integrator, paying integrator, or receiving integrator
- `getByEngineer` is now restricted:
  - engineers can only request their own schedules
  - integrators can only request schedules for engineers in their own integrator
  - unauthorized access returns `403`

Residual risk:

- engineer-facing schedule UI was not fully audited beyond shared status APIs and list action logic because the current visible schedule list is under the integrator protected area

## Bugs Found

1. Scheduler list local status state was not updating because it checked `response.success` on the browser `Response` object instead of parsed JSON.
2. Payment visibility on scheduler list did not require receiving integrator Connect readiness.
3. Payment visibility on scheduler list did not explicitly suppress self-payment rows.
4. Payment data route did not verify paying-integrator ownership of the schedule.
5. Dashboard scheduler stats could initialize before session integrator ID existed and stay stale.
6. Scheduler GET route contained noisy audit logs and weak `getByEngineer` tenant checks.
7. Existing Playwright specs still referenced removed dashboard cards and an old select-based status UI.

## Fixes Applied

- Corrected scheduler list state update handling
- Added verified-receiver and self-payment checks to scheduler payment visibility
- Strengthened payment data route authorization and schedule matching checks
- Refreshed dashboard stat loading behavior for session-driven integrator context
- Tightened scheduler `getByEngineer` tenant safety and removed noisy logs
- Updated Playwright navigation coverage and workflow assertions

## Remaining Risks

- `Paid` remains an enum value for backward compatibility but is not persisted as a stable intermediate scheduler status; payment success moves directly into `ReadyToStart`
- generic payment components outside the scheduler list remain available for other flows and should be reviewed before reuse in scheduler-related screens
- end-to-end runtime validation still needs a seeded local or test environment with Integrator A / Integrator B / engineer roles and Stripe test configuration