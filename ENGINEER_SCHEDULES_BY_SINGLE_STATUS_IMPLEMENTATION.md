# Engineer Schedules By Single Status Implementation

Date: 27 May 2026

## Endpoint Added

`GET /api/scheduler?action=engineerSchedulesByStatus&engineerId=ENGINEER_ID&status=Pending`

## Service Function Added

In [app/api/services/scheduler.js](/Users/appdev/dev/snatchi-next/app/api/services/scheduler.js):

```js
getEngineerSchedulesByStatus({
  engineerId,
  status
})
```

This function:
- validates `engineerId`
- validates `status` as a single string
- rejects comma-delimited status input
- normalizes legacy statuses before querying
- matches engineer using `ObjectId`
- applies no date filtering
- sorts ascending by `startDate`, then `startTime`
- populates engineer, project, paying integrator, and receiving integrator data
- enforces engineer/integrator/admin access rules

## Request Example

```http
GET /api/scheduler?action=engineerSchedulesByStatus&engineerId=679735d6e0a110edbc266745&status=Pending
```

## Response Example

```json
{
  "success": true,
  "data": [
    {
      "_id": "6a146a5bd6353e8c44ade220",
      "title": "Site Visit",
      "status": "Pending",
      "startDate": "2026-05-27T00:00:00.000Z",
      "endDate": "2026-05-29T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "17:00",
      "paymentStatus": "pending",
      "estimatedAmount": 100,
      "project": {
        "name": "Project A",
        "title": "Project A",
        "location": "London"
      },
      "engineer": {
        "first_name": "Alex",
        "last_name": "Doe",
        "email": "alex@example.com",
        "role": "engineer"
      },
      "payingIntegrator": {
        "name": "Integrator B"
      },
      "receivingIntegratorId": {
        "name": "Integrator A",
        "connectAccountStatus": "verified"
      }
    }
  ]
}
```

## Sort Logic

Schedules are returned in ascending order by:

1. `startDate`
2. `startTime`

Implementation:

```js
.sort({ startDate: 1, startTime: 1 })
```

## Validation Rules

The service rejects requests when:

- `engineerId` is missing
- `engineerId` is not a valid Mongo ObjectId
- `status` is missing
- `status` is not a single string value
- `status` contains commas, indicating multiple statuses
- `status` normalizes to an unsupported scheduler status

Examples:

- valid: `Pending`
- valid: `Progress`
- valid: `In Progress`
- invalid: `Pending,Accepted`

## Legacy Status Normalization

The endpoint normalizes:

- `Progress` -> `InProgress`
- `In Progress` -> `InProgress`
- `Ready` -> `ReadyToStart`

Only the normalized single status is used in the query.

## Security Checks

The endpoint enforces tenant safety:

- engineer users can only fetch their own schedules
- integrator users can only fetch schedules for engineers in their integrator
- admin users can fetch any engineer schedules

The same shared access guard used by the engineer aggregate flow is reused here.

## Tests Added

In [app/api/services/__tests__/scheduler.getEngineerSchedulesByStatus.test.js](/Users/appdev/dev/snatchi-next/app/api/services/__tests__/scheduler.getEngineerSchedulesByStatus.test.js):

- returns Pending schedules for engineer
- returns Accepted schedules for engineer
- rejects missing engineerId
- rejects invalid engineerId
- rejects missing status
- rejects comma-delimited status
- sorts by startDate ascending
- legacy status normalization works
- unauthorized engineer blocked
- external integrator blocked
- populates related references

## Route Added

In [app/api/scheduler/route.js](/Users/appdev/dev/snatchi-next/app/api/scheduler/route.js):

- added `action=engineerSchedulesByStatus`
- reads `engineerId` and `status` from query params
- passes normalized actor context into the service
- returns `successResponse(results.data)`

## Notes

- no date filtering is applied
- multiple statuses are intentionally not supported
- mobile UI was not changed
- results come from real scheduler records only
