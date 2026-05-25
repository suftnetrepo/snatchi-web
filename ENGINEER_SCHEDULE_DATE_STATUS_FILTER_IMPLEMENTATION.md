# Engineer Schedule Date/Status Filter – Implementation Report

## Summary

Added `getEngineerSchedulesByDateAndStatus` to the scheduler service and exposed it via the existing scheduler REST API under the `getEngineerSchedules` action.  All existing functionality is untouched.

---

## 1. Service function added

**File:** `app/api/services/scheduler.js`

New export: `getEngineerSchedulesByDateAndStatus({ engineerId, date, status, actor })`

| Parameter    | Type              | Required | Description |
|--------------|-------------------|----------|-------------|
| `engineerId` | `string` (ObjectId) | ✅      | Mongo `_id` of the engineer |
| `date`       | `string`          | ❌       | `YYYY-MM-DD` – returns schedules that overlap this calendar day |
| `status`     | `string \| string[]` | ❌   | Single value, comma-delimited string, or array |
| `actor`      | `object`          | ❌       | Normalised session actor; omit for internal calls |

Return value: `{ data: Schedule[] }`

---

## 2. API query format

```
GET /api/scheduler?action=getEngineerSchedules&engineerId=<id>[&date=YYYY-MM-DD][&status=<status,...>]
```

### Example requests

```
# All schedules for an engineer
GET /api/scheduler?action=getEngineerSchedules&engineerId=507f1f77bcf86cd799439011

# Schedules on a specific date
GET /api/scheduler?action=getEngineerSchedules&engineerId=507f1f77bcf86cd799439011&date=2026-05-25

# Schedules with a single status
GET /api/scheduler?action=getEngineerSchedules&engineerId=507f1f77bcf86cd799439011&status=Accepted

# Schedules with multiple statuses
GET /api/scheduler?action=getEngineerSchedules&engineerId=507f1f77bcf86cd799439011&status=Accepted,ReadyToStart

# Date + multiple statuses combined
GET /api/scheduler?action=getEngineerSchedules&engineerId=507f1f77bcf86cd799439011&date=2026-05-25&status=Accepted,Approved
```

### Example success response

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Plumbing work",
      "startDate": "2026-05-25T08:00:00.000Z",
      "endDate": "2026-05-25T16:00:00.000Z",
      "status": "Accepted",
      "engineer": { "first_name": "John", "last_name": "Smith", "email": "john@example.com" },
      "project": { "name": "Westfield Estate" }
    }
  ]
}
```

---

## 3. Date filtering logic

When `date` is provided the query uses an **overlap** condition so that multi-day schedules are included:

```js
startDate: { $lte: new Date(`${date}T23:59:59.999Z`) }  // starts on/before EOD
endDate:   { $gte: new Date(`${date}T00:00:00.000Z`) }  // ends on/after SOD
```

This returns any schedule whose date range intersects the selected calendar day.

---

## 4. Status filtering logic

Status values are normalised using the existing `normalizeSchedulerStatus` utility.  Legacy aliases are expanded so that records stored under either value are matched:

| Input       | Queries for               |
|-------------|---------------------------|
| `Progress`  | `['Progress', 'InProgress']` |
| `Ready`     | `['Ready', 'ReadyToStart']`  |
| `InProgress`| `['InProgress']`             |
| Any other   | `[canonicalValue]`           |

Comma-delimited strings and arrays are both accepted.  Duplicate values are removed via `Set` before the query is built.

---

## 5. Security checks

Security is enforced via the `actor` object (created from the session user via the existing `normalizeActor` helper in the route).

| Actor role    | Allowed                                              |
|---------------|------------------------------------------------------|
| `engineer`    | Only their own `engineerId`; 403 otherwise           |
| `integrator`  | Only engineers whose `integrator` field matches the actor's `integratorId`; 403 otherwise |
| `admin`       | Any engineer                                         |
| `null` / omitted | Security check skipped (internal/server-side use) |

Errors thrown by the service include a `statusCode` property so the route can forward the correct HTTP status without a separate lookup.

---

## 6. Route changes

**File:** `app/api/scheduler/route.js`

- `getEngineerSchedulesByDateAndStatus` and `normalizeActor` added to the import.
- New `getEngineerSchedules` action block added before the existing `getByEngineer` block:

```js
if (action === 'getEngineerSchedules') {
  // parse engineerId, date, status from URLSearchParams
  // light validation (missing engineerId, bad date format)
  // call service with normalised actor
}
```

No existing action handlers were modified.

---

## 7. Tests added

**File:** `app/api/services/__tests__/scheduler.getEngineerSchedulesByDateAndStatus.test.js`

22 test cases across 6 `describe` groups:

| Group | Tests |
|-------|-------|
| Validation | missing engineerId, invalid ObjectId, bad date format, date without dashes |
| Security | engineer blocks own mismatch, engineer passes self, integrator blocks outside, integrator blocks missing engineer, integrator passes own, admin passes, unknown role blocked |
| Filter: engineer only | query shape when no filters |
| Filter: date | date range added, overlap returned |
| Filter: status | single, comma-delimited, array, legacy Progress, legacy Ready, deduplication |
| Combined date + status | both filters applied together |
| No actor | security skipped for internal calls |

### Running the tests

Jest is not currently installed.  To set it up:

```bash
npm install --save-dev jest babel-jest @babel/preset-env @babel/preset-react @babel/plugin-transform-modules-commonjs
```

Add to `package.json`:
```json
"jest": {
  "testEnvironment": "node",
  "transform": {
    "^.+\\.(js|ts|tsx)$": ["babel-jest"]
  },
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/$1"
  }
},
"scripts": {
  "test": "jest"
}
```

Then run:
```bash
npx jest app/api/services/__tests__/scheduler.getEngineerSchedulesByDateAndStatus.test.js
```

---

## 8. Files changed

| File | Change |
|------|--------|
| `app/api/services/scheduler.js` | Added `expandStatusAlias` helper + `getEngineerSchedulesByDateAndStatus` function; added to exports |
| `app/api/scheduler/route.js` | Imported `getEngineerSchedulesByDateAndStatus` and `normalizeActor`; added `getEngineerSchedules` action handler |
| `app/api/services/__tests__/scheduler.getEngineerSchedulesByDateAndStatus.test.js` | New – 22 unit tests |
