# Notification System - Developer Guide

**Phase 1 - Foundation Infrastructure**

This guide explains how to use the new notification system to send notifications to users.

---

## Quick Start

### 1. Create a Simple Notification

```javascript
const notificationService = require('@/app/api/services/notificationService');
const { NOTIFICATION_TYPES, NOTIFICATION_SCREENS } = require('@/app/api/constants/notificationTypes');

// Send notification to an engineer
await notificationService.createNotification({
  recipient: {
    userId: engineerId,
    type: 'user'
  },
  type: NOTIFICATION_TYPES.BOOKING_CREATED,
  title: 'New Booking Available',
  body: 'You have a new booking for Site A',
  screen: NOTIFICATION_SCREENS.CALENDAR,
  screenParams: {
    scheduleId: '507f1f77bcf86cd799439011'
  },
  relatedTo: {
    schedule: scheduleId
  },
  priority: 'high'
});
```

**That's it.** The notification is:
- ✅ Saved to database immediately
- ✅ Sent to all user's active devices via FCM
- ✅ Tracked for delivery
- ✅ Returned with unique `_id`

---

## How It Works

### Persistence-First Pattern

```
1. Validate input
   ↓
2. Create Notification document
   ↓
3. SAVE to MongoDB ← CRITICAL: Database commit point
   ↓
4. Find user's device tokens
   ↓
5. Send FCM to each device
   ↓
6. Update delivery status
   ↓
7. Return notification._id
```

**Key Principle:** If step 5+ fails, notification is still in database. No lost notifications.

---

## API Reference

### NotificationService Methods

#### `createNotification(data)` ⭐ **RECOMMENDED**

Send a notification to a single user.

```javascript
const notification = await notificationService.createNotification({
  // REQUIRED
  recipient: {
    userId: string,          // or integratorId
    type: 'user' | 'integrator'
  },
  type: string,              // from NOTIFICATION_TYPES
  title: string,             // Short title
  body: string,              // Main message
  screen: string,            // from NOTIFICATION_SCREENS
  
  // OPTIONAL
  screenParams: {},          // Data for deep linking
  relatedTo: {
    schedule: ObjectId,
    project: ObjectId,
    payment: ObjectId,
    integrator: ObjectId
  },
  priority: 'high'|'normal'|'low'
});

// Returns:
// {
//   _id: ObjectId,
//   recipient: {...},
//   type: 'booking_created',
//   title: '...',
//   body: '...',
//   screen: '...',
//   status: {
//     created: true,
//     delivered: boolean,
//     read: false,
//     archived: false
//   },
//   createdAt: Date,
//   deliveredAt: Date
// }
```

---

#### `sendToUsers(userIds, notificationData)`

Send same notification to multiple users.

```javascript
const notifications = await notificationService.sendToUsers(
  [userId1, userId2, userId3],
  {
    type: NOTIFICATION_TYPES.BOOKING_APPROVED,
    title: 'Booking Approved',
    body: '...',
    screen: NOTIFICATION_SCREENS.CALENDAR,
    // ...
  }
);

// Returns: Array of created notifications
```

---

#### `sendToIntegrator(integratorId, notificationData)`

Send notification to all staff of an integrator company.

```javascript
await notificationService.sendToIntegrator(
  integratorId,
  {
    type: NOTIFICATION_TYPES.PAYMENT_COMPLETED,
    title: 'Payment Received',
    body: `Payment of $500 received`,
    screen: NOTIFICATION_SCREENS.PAYMENTS,
    // ...
  }
);

// Automatically finds all staff users of that integrator and sends to all
```

---

#### `getNotifications(userId, options)`

Retrieve notifications for a user.

```javascript
const result = await notificationService.getNotifications(
  userId,
  {
    limit: 20,        // Results per page (default: 20, max: 100)
    offset: 0,        // Skip this many (for pagination)
    unreadOnly: false // Only unread? (default: false)
    archived: false   // Include archived? (default: false)
  }
);

// Returns:
// {
//   notifications: [...],
//   total: 100,
//   unread: 5,
//   limit: 20,
//   offset: 0
// }
```

---

#### `getUnreadCount(userId)`

Get unread notification count (for bell icon badge).

```javascript
const count = await notificationService.getUnreadCount(userId);
// Returns: number (e.g., 5)
```

---

#### `markAsRead(notificationId, userId)`

Mark a notification as read.

```javascript
const notification = await notificationService.markAsRead(
  notificationId,
  userId  // Permission check: must be notification owner
);

// Returns: updated notification with:
// - status.read = true
// - readAt = current timestamp
```

---

#### `markAllAsRead(userId)`

Mark all unread notifications as read.

```javascript
const result = await notificationService.markAllAsRead(userId);

// Returns: { modifiedCount: 5 }
```

---

#### `archive(notificationId, userId)`

Archive a notification (soft delete).

```javascript
const notification = await notificationService.archive(
  notificationId,
  userId
);

// Returns: notification with status.archived = true
```

---

#### `delete(notificationId, userId)`

Hard delete a notification.

```javascript
await notificationService.delete(notificationId, userId);

// Permanently removes notification from database
```

---

## Notification Types

All types available in `app/api/constants/notificationTypes.js`:

```javascript
NOTIFICATION_TYPES = {
  BOOKING_CREATED,
  BOOKING_ACCEPTED,
  BOOKING_APPROVED,
  BOOKING_DECLINED,
  PAYMENT_COMPLETED,
  PAYMENT_FAILED,
  READY_TO_START,
  SCHEDULE_UPDATED,
  SCHEDULE_CANCELLED,
  WORK_STARTED,
  WORK_COMPLETED,
  ENGINEER_ACCEPTED,
  ENGINEER_DECLINED
}
```

Each type has a predefined template:

```javascript
const templates = NOTIFICATION_TEMPLATES[NOTIFICATION_TYPES.BOOKING_CREATED];
// {
//   title: 'New Booking Available',
//   bodyTemplate: (data) => '...',
//   screen: 'calendar',
//   priority: 'high'
// }
```

---

## Screens for Navigation

Available screens for deep linking:

```javascript
NOTIFICATION_SCREENS = {
  CALENDAR: 'calendar',        // Schedule/booking view
  PAYMENTS: 'payments',        // Payment history
  SCHEDULES: 'schedules',      // Schedules list
  PROFILE: 'profile',          // User profile
  HOME: 'home'                 // Home/dashboard
}
```

---

## Device Token Management

### Register Token (User Side - Frontend)

**Call after user logs in or when they grant notification permission:**

```javascript
// PUT /api/user/device-token
const response = await fetch('/api/user/device-token', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: fcmTokenFromFirebase,
    device: {
      type: 'web',              // or 'mobile_ios', 'mobile_android'
      platform: 'Chrome',       // or 'iOS', 'Android'
      appVersion: '1.0.0',
      osVersion: '10.0'
    }
  })
});

const data = await response.json();
// {
//   success: true,
//   data: {
//     tokenId: '...',
//     action: 'created' | 'updated'
//   }
// }
```

### List User's Tokens

```javascript
// GET /api/user/device-token
const response = await fetch('/api/user/device-token');
const data = await response.json();
// {
//   success: true,
//   data: {
//     tokens: [
//       { device: {...}, status: {...}, createdAt, updatedAt }
//     ],
//     count: 2
//   }
// }
```

### Delete a Device Token

```javascript
// DELETE /api/user/device-token?tokenId=...
await fetch(`/api/user/device-token?tokenId=${tokenId}`, {
  method: 'DELETE'
});
```

---

## Examples by Workflow Event

### When Schedule is Created (Pending)

```javascript
// In app/api/scheduler/route.js POST handler
const schedule = await createSchedule(data);

await notificationService.createNotification({
  recipient: {
    userId: schedule.engineer._id,
    type: 'user'
  },
  type: NOTIFICATION_TYPES.BOOKING_CREATED,
  title: 'New Booking Available',
  body: `You have a new booking for ${schedule.project.name}`,
  screen: NOTIFICATION_SCREENS.CALENDAR,
  screenParams: {
    scheduleId: schedule._id.toString()
  },
  relatedTo: {
    schedule: schedule._id,
    project: schedule.project
  },
  priority: 'high'
});
```

### When Engineer Accepts

```javascript
// In app/api/services/scheduler.js updateByStatus()
if (targetStatus === 'Accepted' && isEngineerActor(schedule, actor)) {
  // Update database
  const updated = await Scheduler.findByIdAndUpdate(...)

  // Notify receiving integrator
  await notificationService.createNotification({
    recipient: {
      integratorId: schedule.receivingIntegratorId,
      type: 'integrator'
    },
    type: NOTIFICATION_TYPES.ENGINEER_ACCEPTED,
    title: 'Engineer Accepted',
    body: `${actor.first_name} accepted your booking request`,
    screen: NOTIFICATION_SCREENS.SCHEDULES,
    screenParams: { scheduleId: schedule._id.toString() },
    relatedTo: { schedule: schedule._id },
    priority: 'high'
  });
}
```

### When Payment Succeeds (Webhook)

```javascript
// In app/api/services/webHooksService.js handlePaymentIntentSucceeded()
const handlePaymentIntentSucceeded = async (event) => {
  // Update schedule status to ReadyToStart
  const updated = await Scheduler.findByIdAndUpdate(
    schedulerId,
    buildPaymentSucceededUpdate(...)
  );

  // Notify engineer
  await notificationService.createNotification({
    recipient: { userId: updated.engineer._id, type: 'user' },
    type: NOTIFICATION_TYPES.PAYMENT_COMPLETED,
    title: 'Payment Completed',
    body: `Payment of $${amount} has been processed`,
    screen: NOTIFICATION_SCREENS.PAYMENTS,
    screenParams: { paymentId: paymentId },
    relatedTo: { payment: paymentId },
    priority: 'high'
  });

  // Notify receiving integrator
  await notificationService.createNotification({
    recipient: {
      integratorId: updated.receivingIntegratorId,
      type: 'integrator'
    },
    type: NOTIFICATION_TYPES.PAYMENT_COMPLETED,
    title: 'Payment Received',
    body: `Payment of $${amount} from ${payingIntegrator.name}`,
    screen: NOTIFICATION_SCREENS.PAYMENTS,
    screenParams: { paymentId: paymentId },
    relatedTo: { payment: paymentId },
    priority: 'high'
  });
};
```

---

## API Endpoints for Clients

### GET /api/notifications
Retrieve user's notifications.

```javascript
// Client-side
const response = await fetch(
  '/api/notifications?limit=20&offset=0&unread=false&archived=false'
);
const { data } = await response.json();
// data = { notifications, total, unread, limit, offset }
```

### GET /api/notifications/unread-count
Get unread badge count.

```javascript
const response = await fetch('/api/notifications/unread-count');
const { data } = await response.json();
// data = { count: 5 }
```

### PUT /api/notifications
Mark as read, archive, etc.

```javascript
// Mark single as read
await fetch('/api/notifications', {
  method: 'PUT',
  body: JSON.stringify({
    action: 'read',
    notificationId: '...'
  })
});

// Mark all as read
await fetch('/api/notifications', {
  method: 'PUT',
  body: JSON.stringify({ action: 'read-all' })
});

// Archive
await fetch('/api/notifications', {
  method: 'PUT',
  body: JSON.stringify({
    action: 'archive',
    notificationId: '...'
  })
});
```

### DELETE /api/notifications
Delete a notification.

```javascript
await fetch('/api/notifications', {
  method: 'DELETE',
  body: JSON.stringify({ notificationId: '...' })
});
```

---

## Security & Permissions

### Automatic Permission Checks

All API endpoints automatically:
- ✅ Validate user is authenticated
- ✅ Check user owns notification (engineers)
- ✅ Prevent cross-user access
- ✅ Return 401 if not authenticated
- ✅ Return 403 if unauthorized

**Example:**
```javascript
// User A tries to mark User B's notification as read
await notificationService.markAsRead(userBNotificationId, userAId);
// ❌ Throws error: "Unauthorized"
```

### Data Model Constraints

- Engineer can only access own notifications
- Notifications filtered to single recipient (no mixing)
- Each notification has exactly one recipient
- Device tokens tied to specific user

---

## FAQ

### Q: What if FCM fails?
**A:** Notification is still in database. Can retry sending later.

### Q: Can a user have multiple device tokens?
**A:** Yes! Web + mobile + tablet all supported. All receive the same notification.

### Q: What if I register the same token twice?
**A:** It updates existing token with new device info. No duplicates.

### Q: How long are notifications kept?
**A:** 90 days (auto-deleted after). Can be configured in Notification model.

### Q: Can users customize notification settings?
**A:** Not yet. Phase 2 feature. For now all notifications are sent.

### Q: How do I test notifications?
**A:** Use `app/api/utils/notificationTestUtils.js`:
```javascript
const { runFullTestSuite } = require('@/app/api/utils/notificationTestUtils');
await runFullTestSuite();
```

### Q: Do I need to update old code?
**A:** No. Old `/api/notify` endpoint still works. But new code should use `notificationService`.

---

## Next Phase (Phase 2)

When ready to expand:

1. **Add integrator-level API**
   - Enable `sendToIntegrator()` in API routes
   - Add integrator permission checks

2. **Add notification preferences**
   - NotificationPreferences model
   - Per-type enable/disable
   - Quiet hours support

3. **Add email channel**
   - Integrate Brevo/SendGrid
   - Email notifications fallback

4. **Wire all schedule events**
   - Update scheduler.js
   - Update webhooks
   - Complete notification coverage

5. **Web frontend**
   - Firebase Messaging initialization
   - Service worker setup
   - Bell icon component

---

## Support

For questions or issues:
1. Check NOTIFICATION_FOUNDATION_IMPLEMENTATION.md for architecture details
2. Review test utilities for working examples
3. Check notification constants for available types

---

**Last Updated:** May 26, 2026  
**Phase:** 1 - Foundation Complete
