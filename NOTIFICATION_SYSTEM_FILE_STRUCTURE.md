# Notification System - File Structure & Quick Reference

## Complete File Inventory

### 📦 Models (`app/api/models/`)

#### `notification.js` ⭐
**What:** Stores all sent notifications
**Size:** ~250 lines
**Key Fields:**
- `recipient` - Who gets it (user or integrator)
- `type` - Notification type (13 types)
- `title`, `body` - Message content
- `screen`, `screenParams` - Deep linking data
- `status` - Delivery tracking (created, delivered, read, archived)
- `channels` - Multi-channel tracking (push, in-app)
- `relatedTo` - Links to schedule/payment/project
- `timestamps` - createdAt, deliveredAt, readAt, archivedAt

**Indexes:** 6 (performance optimized)
**Query Helpers:** `.unread()`, `.forUser()`, `.forIntegrator()`

---

#### `deviceToken.js` ⭐
**What:** Stores device tokens for users
**Size:** ~200 lines
**Key Features:**
- Multiple tokens per user (supports web + mobile)
- Device metadata (type, platform, OS version)
- Failure tracking with auto-deactivation
- Reactivation support
- Capability declaration (push, badge, sound)

**Indexes:** 5 (optimization)
**Methods:** `.markUsed()`, `.recordFailure()`, `.deactivate()`, `.reactivate()`

---

### 🔧 Services (`app/api/services/`)

#### `notificationService.js` ⭐⭐⭐
**What:** Core notification logic - THE MAIN SERVICE
**Size:** ~400 lines
**Pattern:** Persist-first (save DB before FCM)

**Main Methods:**
1. `createNotification(data)` - Send to single user ⭐
2. `sendToUsers(userIds, data)` - Send to multiple
3. `sendToIntegrator(integratorId, data)` - Send to company
4. `getNotifications(userId, options)` - Retrieve with pagination
5. `getUnreadCount(userId)` - Get badge count
6. `markAsRead(notificationId, userId)` - Mark as read
7. `markAllAsRead(userId)` - Bulk mark read
8. `archive(notificationId, userId)` - Soft delete
9. `delete(notificationId, userId)` - Hard delete

**Internal Methods:**
- `_sendPushNotification()` - Multi-device FCM send
- `_sendToDevice()` - Single device FCM send
- `cleanupInactiveTokens()` - Maintenance
- `cleanupExpiredNotifications()` - Maintenance

**Permission Validation:** Built-in (all public methods)

---

### 📡 API Routes (`app/api/`)

#### `notifications/route.js`
**What:** Main notifications API
**Methods:**
- `GET` - List notifications with pagination
- `PUT` - Mark read/archive actions
- `DELETE` - Hard delete notification

**Query Params:** `limit`, `offset`, `unread`, `archived`
**Authorization:** Engineers only (role check)
**Validation:** Permission check on each notification

---

#### `notifications/unread-count/route.js`
**What:** Unread badge count API
**Method:** `GET`
**Response:** `{ count: number }`
**Use Case:** Bell icon badge
**Authorization:** Engineer only

---

#### `user/device-token/route.js`
**What:** Device token management API
**Methods:**
- `PUT` - Register/update device token
- `GET` - List user's device tokens
- `DELETE` - Remove device token

**Key Logic:**
- Append tokens (never overwrite)
- Prevent token reassignment to other users
- Auto-reactivate inactive tokens

---

### ⚙️ Constants (`app/api/constants/`)

#### `notificationTypes.js` ⭐
**What:** All notification type constants and templates
**Contains:**
- `NOTIFICATION_TYPES` - 13 type enums
- `NOTIFICATION_PRIORITY` - high/normal/low
- `NOTIFICATION_SCREENS` - Deep link targets
- `RECIPIENT_TYPES` - user/integrator
- `CHANNEL_TYPES` - push/in-app
- `DEVICE_TYPES` - web/mobile_ios/mobile_android
- `NOTIFICATION_TEMPLATES` - Templates with dynamic bodies

**Usage:** Import types, use in createNotification()

---

#### `scheduleStatus.js` ⭐
**What:** Normalized schedule status constants
**Status Types:** 11 statuses (PENDING, ACCEPTED, etc.)
**Helper Functions:**
- `normalizeSchedulerStatus()` - Handle case variations
- `isValidScheduleStatus()` - Validation
- `isTerminalStatus()` - Check if completed
- `isSchedulerInProgress()` - Check if working
- `getStatusDisplayName()` - UI names

---

### 🧪 Utilities (`app/api/utils/`)

#### `notificationTestUtils.js`
**What:** Test utilities for notification system
**Test Functions:**
1. `testCreateNotification()`
2. `testGetUnreadCount()`
3. `testGetNotifications()`
4. `testMarkAsRead()`
5. `testRegisterDeviceToken()`
6. `testPermissionCheck()` - Security test
7. `testMultipleDeviceTokens()`
8. `testTokenFailureTracking()`
9. `testTokenReactivation()`
10. `runFullTestSuite()` - Run all

**Usage:** `node -e "require('./app/api/utils/notificationTestUtils').runFullTestSuite()"`

---

### 📚 Documentation

#### `NOTIFICATION_SYSTEM_DEVELOPER_GUIDE.md` ⭐
**What:** Developer reference
**Sections:**
- Quick start example
- How it works (flow diagram)
- Complete API reference
- Notification types list
- Screens for navigation
- Device token management
- Examples by workflow event
- Security & permissions
- FAQ
- Next phase plans

**Length:** ~600 lines
**Best For:** Developers implementing notifications

---

#### `NOTIFICATION_FOUNDATION_IMPLEMENTATION.md` ⭐⭐
**What:** Technical architecture document
**Sections:**
- Models created (detailed)
- Services created (detailed)
- APIs created (detailed)
- Constants created (detailed)
- Security implementation
- Notification delivery strategy
- Device token management strategy
- Unread tracking implementation
- Known limitations
- Testing checklist
- Integration points
- Migration path
- Deployment checklist
- Monitoring setup

**Length:** ~800 lines
**Best For:** Architects, code reviewers, deployment engineers

---

#### `PHASE_1_COMPLETION_SUMMARY.md`
**What:** Phase 1 recap and next steps
**Sections:**
- What was built (5-point checklist)
- Architecture overview
- Key features
- Database indexes
- Security implementation
- Performance characteristics
- Files created/modified
- What's NOT included
- Backward compatibility
- Testing info
- Deployment strategy
- Next steps (Phase 2)
- Maintenance tasks

**Length:** ~400 lines
**Best For:** Project managers, team leads, stakeholders

---

#### `NOTIFICATION_SYSTEM_AUDIT_AND_MOBILE_INTEGRATION_PLAN.md`
**What:** Pre-Phase 1 audit results
**Content:** Complete audit, current state analysis, mobile integration plan
**Length:** ~1000 lines
**Best For:** Historical reference, understanding "why"

---

### Modified Files

#### `notify/route.js`
**What:** Legacy FCM endpoint (kept for compatibility)
**Changes:** Added comments noting it's deprecated
**Status:** Still works but not recommended for new code

---

## Usage Quick Reference

### I want to...

**Send a notification to an engineer**
```javascript
// File: app/api/services/notificationService.js
await notificationService.createNotification({
  recipient: { userId, type: 'user' },
  type: NOTIFICATION_TYPES.BOOKING_CREATED,
  title: '...',
  body: '...',
  screen: NOTIFICATION_SCREENS.CALENDAR
})
```

**Get unread count for bell icon**
```javascript
// File: app/api/notifications/unread-count/route.js
const count = await notificationService.getUnreadCount(userId);
```

**List notifications**
```javascript
// File: app/api/notifications/route.js
const result = await notificationService.getNotifications(userId, {
  limit: 20, offset: 0
});
```

**Register device token**
```javascript
// File: app/api/user/device-token/route.js
PUT /api/user/device-token
{
  token: "fcm_token",
  device: { type: "web", platform: "Chrome" }
}
```

**Look up a notification type**
```javascript
// File: app/api/constants/notificationTypes.js
import { NOTIFICATION_TYPES } from '@/app/api/constants/notificationTypes'
const type = NOTIFICATION_TYPES.BOOKING_APPROVED
```

---

## Import Examples

### NotificationService
```javascript
const notificationService = require('@/app/api/services/notificationService');
// or
import notificationService from '@/app/api/services/notificationService';
```

### Models
```javascript
const Notification = require('@/app/api/models/notification');
const DeviceToken = require('@/app/api/models/deviceToken');
```

### Constants
```javascript
const { NOTIFICATION_TYPES, NOTIFICATION_SCREENS } = 
  require('@/app/api/constants/notificationTypes');
const { SCHEDULE_STATUS } = 
  require('@/app/api/constants/scheduleStatus');
```

---

## Dependency Graph

```
API Routes
  ↓
NotificationService
  ├─→ Models (Notification, DeviceToken)
  ├─→ User Model (for integrator staff lookup)
  ├─→ FCMNotificationService (existing)
  ├─→ Logger (existing)
  └─→ Constants (notificationTypes)

Frontend
  ↓
API Routes (via HTTP)
```

---

## Database Schema Quick Reference

### Notification Collection
```
{
  _id: ObjectId,
  recipient: {
    userId: ObjectId?,
    integratorId: ObjectId?,
    type: 'user' | 'integrator'
  },
  type: string (13 types),
  title: string,
  body: string,
  screen: string,
  screenParams: object,
  relatedTo: { schedule, project, payment, integrator },
  status: { created, delivered, read, archived },
  channels: [{ type, sent, sentAt, error }],
  priority: 'high' | 'normal' | 'low',
  createdAt, deliveredAt, readAt, archivedAt, expiresAt
}
```

### DeviceToken Collection
```
{
  _id: ObjectId,
  user: ObjectId,
  token: string (unique),
  device: {
    type: 'web' | 'mobile_ios' | 'mobile_android',
    platform: string,
    appVersion: string,
    osVersion: string
  },
  status: {
    active: boolean,
    failCount: number,
    lastUsed: Date,
    lastFailed: Date,
    deactivatedAt: Date?,
    deactivatedReason: string?
  },
  capabilities: { supportsPush, supportsBadge, supportsSound },
  createdAt, updatedAt, expiresAt
}
```

---

## Key Statistics

| Item | Count |
|------|-------|
| **Models** | 2 |
| **Services** | 1 (main) |
| **API Routes** | 3 (7 methods total) |
| **Constants** | 2 |
| **Notification Types** | 13 |
| **Test Functions** | 9 |
| **Database Indexes** | 11 |
| **Documentation Pages** | 4 |
| **Total Files** | 12 |
| **Lines of Code** | ~2000 |
| **Lines of Docs** | ~2500 |

---

## Deployment Checklist

- [ ] All 12 files deployed
- [ ] MongoDB indexes created (automatic on first connect)
- [ ] Test suite passing
- [ ] FCM quota monitoring enabled
- [ ] Error logging verified
- [ ] Device token endpoints working
- [ ] Permission checks validated
- [ ] Documentation reviewed

---

## Phase Roadmap

```
Phase 1: ✅ COMPLETE (now)
├─ Models ✅
├─ Service ✅
├─ APIs ✅
├─ Constants ✅
└─ Documentation ✅

Phase 2: Event Triggers (next)
├─ Wire scheduler events
├─ Wire webhook handlers
├─ Integrator-level API
└─ Notification preferences

Phase 3: Web Frontend (after Phase 2)
├─ Firebase Messaging setup
├─ Service worker
├─ Bell icon component
└─ Notification list UI

Phase 4: Mobile Integration (after Phase 3)
├─ React Native setup
├─ Expo notifications
├─ Deep linking
└─ Mobile notification UI
```

---

## Quick Links

📖 [Developer Guide](NOTIFICATION_SYSTEM_DEVELOPER_GUIDE.md)  
📋 [Implementation Report](NOTIFICATION_FOUNDATION_IMPLEMENTATION.md)  
✅ [Phase 1 Summary](PHASE_1_COMPLETION_SUMMARY.md)  
🔍 [Audit & Mobile Plan](NOTIFICATION_SYSTEM_AUDIT_AND_MOBILE_INTEGRATION_PLAN.md)  

---

**Last Updated:** May 26, 2026  
**Phase:** 1 - Complete
