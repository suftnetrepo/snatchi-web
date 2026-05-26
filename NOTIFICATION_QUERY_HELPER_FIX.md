# Notification Service Query Helper Fix

**Issue**: `TypeError: Notification.forUser is not a function`  
**Root Cause**: Mongoose query helpers called directly on model instead of on query objects  
**Status**: ✅ FIXED

---

## Problem

The notification service was throwing an error when trying to get unread notification counts:

```
TypeError: Notification.forUser is not a function
    at NotificationService.getUnreadCount (app/api/services/notificationService.js:326:40)
```

This prevented the notification API from working entirely, returning 500 errors.

---

## Root Cause Analysis

### Issue: Incorrect Query Helper Usage

In Mongoose, query helpers defined on a schema are only available on **query objects**, not on the model directly.

**Incorrect Pattern** (what the code was doing):
```javascript
// ❌ WRONG - forUser is a query helper, not a model method
const count = await Notification.forUser(userId)
  .unread()
  .countDocuments();
```

**Correct Pattern** (what it should be):
```javascript
// ✅ CORRECT - Create a query object first with .find()
const count = await Notification.find().forUser(userId)
  .unread()
  .countDocuments();
```

### Why This Happens

In the Notification model, query helpers are defined like this:

```javascript
// Query helper for unread
NotificationSchema.query.unread = function () {
  return this.where('status.read', false).where('status.archived', false);
};

// Query helper for user
NotificationSchema.query.forUser = function (userId) {
  return this.where({ 'recipient.userId': userId, 'recipient.type': 'user' });
};
```

These helpers are attached to the **query prototype**, not the model class. They become available when you call methods that return query objects like `.find()`, `.where()`, `.findById()`, etc.

---

## Solution Implemented

### Fix #1: getUnreadCount Method

**File**: [app/api/services/notificationService.js](app/api/services/notificationService.js#L326-329)

```javascript
// BEFORE
const count = await Notification.forUser(userId)
  .unread()
  .countDocuments();

// AFTER
const count = await Notification.find().forUser(userId)
  .unread()
  .countDocuments();
```

### Fix #2: getNotifications Method (Line 282)

**File**: [app/api/services/notificationService.js](app/api/services/notificationService.js#L282)

```javascript
// BEFORE
let query = Notification.forUser(userId);

// AFTER
let query = Notification.find().forUser(userId);
```

### Fix #3: Unread Count Promise.all (Lines 299-300)

**File**: [app/api/services/notificationService.js](app/api/services/notificationService.js#L299-L300)

```javascript
// BEFORE
const [notifications, total, unread] = await Promise.all([
  query.sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
  Notification.forUser(userId).countDocuments(),
  Notification.forUser(userId).unread().countDocuments()
]);

// AFTER
const [notifications, total, unread] = await Promise.all([
  query.sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
  Notification.find().forUser(userId).countDocuments(),
  Notification.find().forUser(userId).unread().countDocuments()
]);
```

### Fix #4: Console Typo

**File**: [app/api/notifications/unread-count/route.js](app/api/notifications/unread-count/route.js#L32)

```javascript
// BEFORE
cosole.error('GET /api/notifications/unread-count failed', error);  // ❌ Typo

// AFTER
console.error('GET /api/notifications/unread-count failed', error);  // ✅ Fixed
```

---

## How Query Helpers Work in Mongoose

### Schema Definition
```javascript
const schema = new Schema({ name: String });

// Add query helper
schema.query.byName = function(name) {
  return this.where({ name });
};

const Model = mongoose.model('Model', schema);
```

### Usage
```javascript
// ✅ Correct - create query object first
await Model.find().byName('John');           // Works
await Model.where().byName('John');          // Works
await Model.findOne().byName('John');        // Works

// ❌ Wrong - query helper not available on model
await Model.byName('John');                  // ERROR: byName is not a function
```

---

## Impact

### Before Fix
```
GET /api/notifications/unread-count
→ TypeError: Notification.forUser is not a function
→ 500 Internal Server Error
→ Frontend cannot load notifications
```

### After Fix
```
GET /api/notifications/unread-count
→ Query helper properly called on query object
→ Unread count retrieved from database
→ 200 OK or 401 Unauthorized (auth check)
→ Frontend receives notification data successfully
```

---

## Verification

### Test 1: Check for Errors
```bash
# Start dev server
npm run dev

# Check server logs - should NOT see:
# "TypeError: Notification.forUser is not a function"
```

### Test 2: Test API Response
```bash
# Curl the endpoint (will redirect to login without auth, which is correct)
curl -v http://localhost:3001/api/notifications/unread-count

# Should return:
# - 307 Temporary Redirect to /login (if not authenticated) ✅
# - NOT 500 Internal Server Error ✅
# - NOT "TypeError: Notification.forUser is not a function" ✅
```

### Test 3: Authenticated Request
After logging in, test should return:
```json
{
  "success": true,
  "data": {
    "count": N
  }
}
```

---

## Files Modified

| File | Lines | Change |
|------|-------|--------|
| [app/api/services/notificationService.js](app/api/services/notificationService.js) | 282, 299-300, 326-327 | Added `.find()` to query helper calls |
| [app/api/notifications/unread-count/route.js](app/api/notifications/unread-count/route.js) | 32 | Fixed typo: `cosole` → `console` |

---

## Why This Matters

### For Development
- Query helpers only work on query objects in Mongoose
- Always use `.find()`, `.where()`, `.findOne()` etc. when using custom query helpers
- This is a common mistake when learning Mongoose

### For the Application
- Unread notification count is critical for the notification badge UI
- Without this working, the notification system cannot function
- The fix enables the entire Phase 3 notification feature

---

## Related Documentation

- [Notification Service Implementation](app/api/services/notificationService.js)
- [Notification Model](app/api/models/notification.js)
- [Unread Count API Route](app/api/notifications/unread-count/route.js)
- [Mongoose Query Helpers Documentation](https://mongoosejs.com/docs/api/query.html)

---

## Testing Commands

```bash
# Full test suite
npx playwright test tests/notifications.spec.ts

# Specific test
npx playwright test -g "should display unread badge"

# Server logs (watch for errors)
npm run dev
```

---

## Summary

The notification service was incorrectly calling Mongoose query helpers directly on the model instead of on query objects. By wrapping the calls in `.find()`, the query helpers are now properly available and the API returns the correct data instead of throwing errors.

**Status**: ✅ FIXED - API now returns proper responses without TypeError
