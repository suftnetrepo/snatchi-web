# Engineer Schedule Approval Payment Workflow Implementation

## Final Status Lifecycle

`Pending -> Accepted -> Approved -> AwaitingPayment -> Paid -> ReadyToStart -> InProgress -> Completed`

Additional supported statuses:

- `Declined`
- `Cancelled`
- `PaymentFailed`
- legacy compatibility: `Progress`, `Ready`

## Permissions Matrix

- Engineer
  - `Pending -> Accepted`
  - `Pending -> Declined`
  - `ReadyToStart -> InProgress`
  - `InProgress -> Completed`

- Receiving integrator (engineer owner / Integrator A)
  - `Accepted -> Approved`
  - may also start or complete execution updates where operationally required

- Paying integrator (booking integrator / Integrator B)
  - may create payment only when status is `Approved` or `AwaitingPayment`
  - may also start or complete execution updates where operationally required

## Files Changed

- `app/api/constants/statuses.js`
- `app/api/models/scheduler.js`
- `app/api/services/scheduler.js`
- `app/api/scheduler/route.js`
- `app/api/scheduler/[id]/status/route.js`
- `app/api/stripe/payment/create-intent/route.js`
- `app/api/stripe/payment/confirm/route.js`
- `app/api/services/webHooksService.js`
- `app/api/stripe/payment/data/route.ts`
- `hooks/useSchedulerList.js`
- `app/protected/integrator/scheduler/list/page.jsx`
- `app/protected/integrator/dashboard/page.jsx`
- `app/protected/integrator/components/PaymentModal.tsx`
- `utils/helpers.js`
- `e2e/integrator/dashboard-scheduler-navigation.spec.ts`
- `e2e/integrator/scheduler-approval-payment-workflow.spec.ts`

## API Transition Rules

Primary endpoint:

- `PUT /api/scheduler/[id]/status`

Legacy compatibility retained:

- `PUT /api/scheduler?action=status&id=...`

Allowed transitions:

- `Pending -> Accepted` by assigned engineer
- `Pending -> Declined` by assigned engineer
- `Accepted -> Approved` by receiving integrator
- `Approved -> AwaitingPayment` when payment is initiated
- `AwaitingPayment -> Paid` during payment success handling
- `Paid -> ReadyToStart` during payment success handling
- `ReadyToStart -> InProgress` by engineer or authorized integrator
- `InProgress -> Completed` by engineer or authorized integrator

Invalid transitions return `400` with a readable error.

## Payment Gating Changes

- `POST /api/stripe/payment/create-intent` now verifies:
  - schedule exists
  - actor is the paying integrator
  - schedule status is `Approved` or `AwaitingPayment`
  - receiving integrator matches the engineer owner
  - receiving integrator has verified Connect readiness
  - no successful payment already exists

- If schedule is only `Accepted`, the route returns:

```json
{
  "success": false,
  "error": "Schedule must be approved by the engineer's integrator before payment."
}
```

- Payment initiation moves the scheduler to `AwaitingPayment` and records `awaitingPaymentAt`.

## Webhook Changes

- `payment_intent.succeeded`
  - sets payment `paymentStatus = succeeded`
  - updates scheduler `paymentStatus = succeeded`
  - sets scheduler status to `ReadyToStart`
  - sets `paidAt` and `readyToStartAt`
  - no longer moves directly to in-progress

- `payment_intent.payment_failed`
  - sets scheduler status to `PaymentFailed`
  - no longer forces scheduler back to `Declined`

## Dashboard And Filter Changes

Dashboard cards now use the four-card layout:

- `Active Projects`
- `Awaiting Approval`
- `Awaiting Payment`
- `Ready To Start`

Scheduler filters supported:

- `accepted`
- `awaiting-approval`
- `awaiting-payment`
- `ready-to-start`
- `in-progress`

Rules implemented:

- `awaiting-approval`
  - `status = Accepted`
  - receiving integrator is current integrator

- `awaiting-payment`
  - `status = Approved` or `AwaitingPayment`
  - paying integrator is current integrator
  - payment status pending/empty
  - estimated amount > 0

- `ready-to-start`
  - `status = ReadyToStart`

## Tests Added

- Updated dashboard scheduler navigation Playwright coverage for new cards and filters
- Added scheduler approval/payment workflow Playwright coverage for:
  - approve action visibility
  - payment action visibility after approval
  - payment modal opening
  - ready-to-start visibility
  - in-progress completion visibility

## Remaining TODOs

- Run the new workflow end-to-end in a working local environment with seeded engineer/integrator data
- Expand Playwright coverage from UI visibility checks to full seeded transition assertions
- Normalize any remaining legacy `Progress` / `Ready` records in existing data if required
- Review any secondary scheduler UIs that still expose freeform status editing