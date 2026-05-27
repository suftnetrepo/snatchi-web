# Engineer Schedule Status Aggregate Zero Fix Report

Date: 27 May 2026

## Root Cause

The aggregate endpoint was matching the `engineer` field with a raw string inside a Mongo aggregation pipeline:

```js
{ $match: { engineer: engineerId } }
```

That field is stored as `Schema.Types.ObjectId` in [app/api/models/scheduler.js](/Users/appdev/dev/snatchi-next/app/api/models/scheduler.js), and unlike `Scheduler.find(...)`, `Scheduler.aggregate(...)` does not automatically cast the string to `ObjectId`.

The mobile schedule list worked because the list service uses `Scheduler.find(...)`, which Mongoose casts correctly.

## Field Mismatch Found

Live database verification for engineer `679735d6e0a110edbc266745` showed:

- `countDocuments({ engineer: '679735d6e0a110edbc266745' })` => `0`
- `countDocuments({ engineer: ObjectId('679735d6e0a110edbc266745') })` => `21`

Live grouped counts for that engineer:

- `Pending`: `13`
- `Accepted`: `8`
- `total`: `21`

That confirms the zero response was caused by the string-vs-`ObjectId` mismatch, not by missing schedules.

## Fix Applied

### Query alignment

In [app/api/services/scheduler.js](/Users/appdev/dev/snatchi-next/app/api/services/scheduler.js):

- added `toObjectId(engineerId)`
- introduced a shared `createEngineerScheduleQuery(...)`
- changed both the list query and the aggregate query to use the same engineer/date/status query shape

The aggregate now matches with:

```js
{ engineer: new mongoose.Types.ObjectId(engineerId) }
```

### Date filter guard

The aggregate only adds overlap filters when `date` is provided:

```js
startDate <= endOfDay
endDate >= startOfDay
```

No date constraint is applied when `date` is absent.

### Status normalization

In [app/api/constants/statuses.js](/Users/appdev/dev/snatchi-next/app/api/constants/statuses.js), scheduler status normalization now handles:

- `Progress`
- `In Progress`
- `InProgress`
- lowercase/uppercase variations
- `Ready`
- `ReadyToStart`
- lowercase/uppercase variations

All of those fold into canonical dashboard statuses.

### Security rules

The aggregate service now enforces the requested security rules:

- engineer can only fetch their own schedules
- integrator can only fetch engineers in their own integrator
- admin can fetch any engineer

The engineer comparison uses stringified IDs so valid session/user ID formatting differences do not incorrectly block access.

### Temporary debug logs

Temporary diagnostics were added in the aggregate service to log:

- `aggregate engineerId input`
- `aggregate ObjectId valid`
- `aggregate query`
- sample schedules found with `engineer: ObjectId(...)`
- fallback sample counts for alternate field probes if the main sample is empty

## Before / After

### Before

```json
{
  "total": 0,
  "byStatus": {
    "Pending": 0,
    "Accepted": 0,
    "Approved": 0,
    "AwaitingPayment": 0,
    "ReadyToStart": 0,
    "InProgress": 0,
    "Completed": 0,
    "Cancelled": 0,
    "PaymentFailed": 0,
    "Declined": 0,
    "Paid": 0
  }
}
```

### After

Based on the live database verification for the reported engineer, the corrected backend aggregate should return at least:

```json
{
  "total": 21,
  "byStatus": {
    "Pending": 13,
    "Accepted": 8,
    "Approved": 0,
    "AwaitingPayment": 0,
    "ReadyToStart": 0,
    "InProgress": 0,
    "Completed": 0,
    "Cancelled": 0,
    "PaymentFailed": 0,
    "Declined": 0,
    "Paid": 0
  }
}
```

## Files Changed

- [app/api/services/scheduler.js](/Users/appdev/dev/snatchi-next/app/api/services/scheduler.js)
- [app/api/scheduler/route.js](/Users/appdev/dev/snatchi-next/app/api/scheduler/route.js)
- [app/api/constants/statuses.js](/Users/appdev/dev/snatchi-next/app/api/constants/statuses.js)
- [app/api/services/__tests__/scheduler.getEngineerScheduleStatusAggregate.test.js](/Users/appdev/dev/snatchi-next/app/api/services/__tests__/scheduler.getEngineerScheduleStatusAggregate.test.js)

## Tests Added

The aggregate regression test file now covers:

- aggregate returns counts for existing engineer schedules
- ObjectId engineer match works
- no date filter returns all schedules
- date filter returns only overlapping schedules
- Accepted/Pending counted correctly
- Progress/In Progress normalized to InProgress
- Ready/ReadyToStart normalization
- engineer access restriction
- integrator external engineer restriction

## Validation

Validation completed in two ways:

1. Live Mongo verification for the exact engineer ID from the bug report, which confirmed the root cause and real counts.
2. VS Code diagnostics on the touched files, which reported no syntax or semantic errors.

Direct unauthenticated `curl` to the local route redirected to login, so route-level end-to-end verification still requires an authenticated session.
