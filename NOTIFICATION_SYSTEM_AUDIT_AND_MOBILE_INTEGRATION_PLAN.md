# Notification System Audit & Mobile Integration Plan

**Date:** May 26, 2026  
**Status:** Audit & Design Complete (No Implementation)

---

## Executive Summary

The web app has **Firebase Cloud Messaging (FCM) push notification infrastructure** partially implemented:
- ✅ Backend FCM service fully functional
- ✅ API endpoints for sending notifications exist
- ✅ Device tokens stored in database
- ❌ Frontend registration flow is **incomplete** (no web UI token capture)
- ❌ No notification history/unread tracking model
- ❌ No mobile-specific device token management

**Recommendation:** Create a **unified Notification Hub** that serves both web and mobile, with proper history tracking and unified API for scheduling workflow events.

---

## Part 1: Current Web Notification Architecture

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PUSH NOTIFICATION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Backend Event → Notification Service → FCM API → Device Token │
│                                                                 │
│  Storage: Device tokens in User.fcm and Integrator.fcm_token   │
│  Protocol: Firebase Cloud Messaging (FCM) v1 API               │
│  Push Type: Native FCM (not web push)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Backend Infrastructure (✅ Implemented)

#### **Core Services**

| File | Purpose |
|------|---------|
| [app/api/utils/push-notification.js](app/api/utils/push-notification.js) | `FCMNotificationService` class - main FCM integration |
| [app/api/services/notify.js](app/api/services/notify.js) | `sendUserNotification()` - sends notifications with screen routing |
| [app/api/notify/route.js](app/api/notify/route.js) | **PUT** endpoint for sending single/multiple notifications |

#### **Key Implementation Details**

**FCMNotificationService Features:**
```javascript
// Constructor
- Uses Firebase Admin SDK (google-auth-library)
- Authenticates with service account (GOOGLE_APPLICATION_CREDENTIALS)
- Targets Firebase project (FIREBASE_PROJECT_ID)

// Methods
- sendNotification(fcmToken, title, body, data)
  * Sends individual notification to device token
  * Payload includes screen routing (screen, screenParams)
  * Sets Android priority: 'high'
  * Enables iOS background push (content-available: 1, sound: default)

- sendMulticastNotification(data)
  * Sends to multiple tokens
  * Batches requests to FCM
```

**Notification Payload Structure:**
```javascript
{
  notification: {
    title: "Booking Approved",
    body: "Your schedule has been approved"
  },
  data: {
    screen: "calendar",           // navigation target
    screenParams: {               // navigation data
      scheduleId: "...",
      projectId: "...",
      ...
    },
    ...otherData
  },
  android: { priority: 'high' },
  apns: {
    payload: {
      aps: {
        'content-available': 1,
        sound: 'default'
      }
    }
  }
}
```

#### **Database Token Storage**

**User Model** (`app/api/models/user.js`):
```javascript
fcm: {
  type: String,           // FCM device token
  required: false,
  default: ''
}
```

**Integrator Model** (`app/api/models/integrator.js`):
```javascript
fcm_token: {
  type: String,           // FCM device token
  required: false,
  default: ''
},
push_notifications: [
  {
    title: String,
    message: String,
    status: Boolean         // notification preferences
  }
]
```

### 1.3 API Endpoints (Current State)

#### **PUT /api/notify**
```
Query Parameters:
  ?action=single       - Send to one FCM token
  ?action=multiple     - Send to multiple tokens

Body for 'single':
{
  fcm: "device_token_string",
  projectId: "...",
  userId: "...",
  role: "engineer|integrator",
  first_name: "...",
  last_name: "..."
}

Body for 'multiple':
{
  data: [
    {
      fcm: "token1",
      title: "...",
      body: "..."
    },
    ...
  ]
}

Response:
{ success: true, data: result }
```

#### **PUT /api/user/fcm**
```
Query Parameters:
  ?id=userId          - User MongoDB ID
  ?token=fcm_token    - FCM device token

Response:
{ success: true, data: updated }
```

#### **Current Usage in Scheduler Route**
File: [app/api/scheduler/route.js](app/api/scheduler/route.js)

```javascript
// sendPendingNotification() - sends when schedule status = 'Pending'
await sendUserNotification({
  userId: engineer,
  title: "New Booking",
  body: description,
  screen: 'calendar',
  screenParams: { 
    scheduleId, 
    projectId: project, 
    ...additionalParams 
  }
});
```

### 1.4 Frontend Implementation (❌ Incomplete)

#### **What's Missing**

1. **Firebase Messaging Not Initialized**
   - File: `firebase/index.js`
   - Missing: `getMessaging()` call
   - Missing: `onMessage()` listener for foreground notifications
   - Missing: `getToken()` call to retrieve FCM token

2. **No Service Worker**
   - Missing: `public/firebase-messaging-sw.js`
   - No background message handling
   - No notification click handlers

3. **No Token Registration Flow**
   - No component requesting notification permission
   - No API call to `PUT /api/user/fcm` after login
   - No token refresh logic
   - No error handling for permission denial

4. **No Notification UI**
   - No in-app notification component
   - No notification history display
   - No unread count badge
   - No notification preference management

#### **What Exists (Project-Related Only)**

File: [hooks/usePushNotification.jsx](hooks/usePushNotification.jsx)
- Handles **sending** notifications to users (admin side)
- Uses `PUT /api/notify?action=single` or `?action=multiple`
- NOT for receiving notifications
- Firestore listener for `notification_locations` collection (for project assignments)

### 1.5 Current Notification Event Points

#### **Project Assignment Notifications**
- **Trigger:** Project created/updated with `notify=true`
- **Who's Notified:** Assigned engineers
- **Payload:** Project data (location, times, description)
- **File:** [app/api/utils/format-project.js](app/api/utils/format-project.js)

#### **Schedule Status Notifications (Partial)**
- **Trigger:** Schedule created with status='Pending'
- **Who's Notified:** Engineer (recipient)
- **Event:** `sendPendingNotification()`
- **File:** [app/api/scheduler/route.js](app/api/scheduler/route.js)
- **Limitation:** Only on initial pending creation, NOT on other status changes

### 1.6 Gaps in Current System

| Gap | Impact | Severity |
|-----|--------|----------|
| **No frontend token capture** | Engineers can't receive push notifications on web | CRITICAL |
| **Notifications only on schedule creation** | Engineer acceptance, approval, payment events not notified | HIGH |
| **No notification history model** | Can't show notification list or mark as read | HIGH |
| **No unread count tracking** | Bell icon can't show unread badge | HIGH |
| **No mobile device management** | Can't support multiple device types | HIGH |
| **No notification preferences** | Users can't customize notification settings | MEDIUM |
| **Integrator.push_notifications unused** | Field exists but not populated or used | LOW |
| **No deduplication on frontend** | Duplicate notifications possible during reconnect | LOW |

---

## Part 2: Schedule Workflow Event Points

### 2.1 Complete Status Transition Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SCHEDULE WORKFLOW STATES                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Pending                                                            │
│    ↓ (Engineer accepts)                                             │
│  Accepted → (Engineer declines) → Declined                          │
│    ↓ (Receiving integrator approves)                                │
│  Approved                                                           │
│    ↓ (System auto-transition or manual trigger)                     │
│  AwaitingPayment                                                    │
│    ↓ (Payment succeeds)                                             │
│  ReadyToStart                                                       │
│    ↓ (Engineer marks start)                                         │
│  InProgress                                                         │
│    ↓ (Engineer completes)                                           │
│  Completed                                                          │
│    └─ (Or cancelled at any point) → Cancelled                       │
│                                                                     │
│  PaymentFailed status (payment failure path)                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Event Trigger Points

**File:** [app/api/scheduler/[id]/status/route.js](app/api/scheduler/[id]/status/route.js)  
**Service:** [app/api/services/scheduler.js](app/api/services/scheduler.js)

#### **1. Schedule Created (Status = Pending)**
- **Trigger:** POST to `/api/scheduler` with initial data
- **Files:**
  - [app/api/scheduler/route.js](app/api/scheduler/route.js) POST handler
  - [app/api/services/scheduler.js](app/api/services/scheduler.js) `add()` function
- **Current Action:** `sendPendingNotification()` called
- **Recipients:** Engineer (receiver)
- **Data Available:**
  - Schedule ID, project ID, start/end dates
  - Paying integrator info
  - Engineer info

#### **2. Engineer Accepts (Pending → Accepted)**
- **Trigger:** PUT `/api/scheduler/[id]/status`
- **Validation:** Must be engineer, schedule status must be Pending
- **Action Performed:** Sets `acceptedAt` timestamp
- **Recipients:** 
  - Receiving integrator (engineer's owner company)
- **Data Available:**
  - Schedule full details
  - Engineer confirmation
  - Timestamp

#### **3. Engineer Declines (Pending → Declined)**
- **Trigger:** PUT `/api/scheduler/[id]/status`
- **Recipients:**
  - Paying integrator (who created it)
- **Data Available:**
  - Decline reason (if any)
  - Schedule details

#### **4. Receiving Integrator Approves (Accepted → Approved)**
- **Trigger:** PUT `/api/scheduler/[id]/status`
- **Validation:** Must be receiving integrator, schedule status must be Accepted
- **Action Performed:** Sets `approvedAt`, `approvedByIntegrator`, `approvalNotes`
- **Recipients:**
  - Engineer
  - Paying integrator
  - Receiving integrator (confirmation)
- **Data Available:**
  - Approval notes
  - Engineer info
  - Payment details

#### **5. Payment Status Changes (Approved → AwaitingPayment → Paid → ReadyToStart)**
- **Trigger:** Stripe webhook `payment_intent.succeeded`
- **File:** [app/api/services/webHooksService.js](app/api/services/webHooksService.js)
- **Handler:** `handlePaymentIntentSucceeded()`
- **Action Performed:** 
  - Updates schedule status to `ReadyToStart`
  - Creates transfer to receiving integrator
  - Records payment success data
- **Recipients:**
  - Engineer
  - Receiving integrator
  - Paying integrator
- **Data Available:**
  - Payment amount
  - Platform fee
  - Transfer ID
  - Receiving integrator account info

#### **6. Payment Fails (Approved → PaymentFailed)**
- **Trigger:** Stripe webhook `payment_intent.payment_failed`
- **Handler:** `handlePaymentIntentFailed()`
- **Recipients:**
  - Engineer
  - Paying integrator
  - Receiving integrator
- **Data Available:**
  - Failure reason
  - Error details
  - Recovery options

#### **7. Schedule Status: ReadyToStart → InProgress**
- **Trigger:** PUT `/api/scheduler/[id]/status`
- **Validation:** Engineer actor, schedule status ReadyToStart
- **Recipients:** All parties
- **Data Available:** Start timestamp, location

#### **8. Schedule Status: InProgress → Completed**
- **Trigger:** PUT `/api/scheduler/[id]/status`
- **Validation:** Engineer actor, schedule status InProgress
- **Recipients:** All parties
- **Data Available:** Completion timestamp

#### **9. Schedule Cancelled (Any State → Cancelled)**
- **Trigger:** PUT `/api/scheduler/[id]/status`
- **Recipients:** All parties
- **Data Available:** Cancellation reason

#### **10. Schedule Updated (Any field change)**
- **Trigger:** PUT `/api/scheduler/[id]` (not status route)
- **Recipients:** All interested parties
- **Data Available:** Changed fields, old vs new values

### 2.3 Authorization & Actor Identification

**File:** [app/api/services/scheduler.js](app/api/services/scheduler.js)

```javascript
// Actor types and permissions
isEngineerActor(schedule, actor)
  - Check: actor.userId === schedule.engineer._id

isReceivingIntegratorActor(schedule, actor)
  - Check: actor.role === 'integrator' 
  - Check: actor.integratorId === schedule.receivingIntegratorId

isPayingIntegratorActor(schedule, actor)
  - Check: actor.role === 'integrator'
  - Check: actor.integratorId === schedule.payingIntegrator

isAuthorizedExecutionActor(schedule, actor)
  - Any of the above (can initiate payment, approve, etc.)
```

---

## Part 3: Notification Event Map

### 3.1 Engineer Notification Events

| Event | Trigger | Title | Body | Screen | Recipient | Status |
|-------|---------|-------|------|--------|-----------|--------|
| **New Booking** | Schedule created (Pending) | "New Booking Available" | "You have a new booking for {project_name}" | `calendar` | Engineer | ✅ Implemented |
| **Booking Accepted Confirmed** | Engineer confirms acceptance | "Booking Accepted" | "Your acceptance has been confirmed" | `calendar` | Engineer | ❌ Not sending |
| **Booking Approved** | Receiving integrator approves (Accepted→Approved) | "Booking Approved" | "Your booking has been approved for {project_name}" | `calendar` | Engineer | ❌ Not sending |
| **Booking Declined** | Engineer/integrator declines | "Booking Declined" | "Your booking request was declined" | `calendar` | Engineer | ❌ Not sending |
| **Payment Completed** | Payment succeeded webhook | "Payment Received" | "Your payment of {amount} has been processed" | `payments` | Engineer (receiving) | ❌ Not sending |
| **Ready to Start** | Payment success triggers ReadyToStart | "Ready to Start" | "Your booking is ready to start at {time}" | `calendar` | Engineer | ❌ Not sending |
| **Schedule Updated** | Any schedule field changes | "Schedule Updated" | "Your schedule has been updated: {change_summary}" | `calendar` | Engineer | ❌ Not sending |
| **Schedule Cancelled** | Cancellation event | "Schedule Cancelled" | "Your schedule has been cancelled: {reason}" | `calendar` | Engineer | ❌ Not sending |

### 3.2 Integrator Notification Events

| Event | Trigger | Title | Body | Screen | Recipient | Status |
|-------|---------|-------|------|--------|-----------|--------|
| **Engineer Accepted** | Engineer accepts booking | "Engineer Accepted" | "{engineer_name} accepted your booking request" | `schedules` | Receiving integrator | ❌ Not sending |
| **Engineer Declined** | Engineer declines booking | "Engineer Declined" | "{engineer_name} declined your booking request" | `schedules` | Paying integrator | ❌ Not sending |
| **Approval Needed** | Booking ready for approval (Accepted) | "Approval Required" | "A booking needs your approval" | `schedules` | Receiving integrator | ❌ Not sending |
| **Payment Succeeded** | Payment webhook succeeds | "Payment Confirmed" | "Payment of {amount} from {paying_integrator} confirmed" | `payments` | Receiving integrator | ❌ Not sending |
| **Payment Failed** | Payment webhook fails | "Payment Failed" | "Payment of {amount} failed: {reason}" | `payments` | Paying integrator | ❌ Not sending |
| **Engineer Started** | Engineer marks ready→inprogress | "Work Started" | "{engineer_name} started work on {project_name}" | `schedules` | Both integrators | ❌ Not sending |
| **Engineer Completed** | Engineer marks inprogress→completed | "Work Completed" | "{engineer_name} completed work on {project_name}" | `schedules` | Both integrators | ❌ Not sending |
| **Schedule Cancelled** | Cancellation event | "Schedule Cancelled" | "Schedule cancelled: {reason}" | `schedules` | Both integrators | ❌ Not sending |

---

## Part 4: Mobile Notification Compatibility Check

### 4.1 Current System vs Mobile Requirements

| Aspect | Current Web | React Native Need | Compatible? | Notes |
|--------|-------------|------------------|-------------|-------|
| **Push Service** | FCM (Firebase) | FCM (Firebase) | ✅ YES | Can reuse same service |
| **Token Format** | Device token string | Device token string | ✅ YES | Same format |
| **API Endpoint** | /api/notify | Can reuse | ✅ YES | No changes needed |
| **Payload Structure** | FCM standard + screen routing | Same structure | ✅ YES | Supports mobile routing |
| **Device Management** | Single token per user | Multiple tokens (web + mobile) | ❌ NO | Need multi-device support |
| **Authorization** | Firebase Admin SDK | Firebase Admin SDK | ✅ YES | Same backend |
| **Notification History** | Not tracked | Needed for mobile | ❌ NO | Gap exists for both |
| **Unread Count** | Not tracked | Needed for badge | ❌ NO | Gap exists for both |

### 4.2 Mobile-Specific Requirements Not in Web

| Feature | Web Need | Mobile Need | Priority |
|---------|----------|------------|----------|
| Multiple device tokens per user | No | YES | HIGH |
| Device type tracking (iOS/Android) | No | YES | HIGH |
| Background notification handling | Basic | YES (advanced) | HIGH |
| Notification sound control | No | YES | MEDIUM |
| Notification badge count | No | YES (bell icon) | HIGH |
| Deep link resolution | Limited | YES | MEDIUM |

### 4.3 Reusable Components for Mobile

✅ **Can Reuse:**
- FCM backend service (no changes)
- API endpoint `/api/notify` (no changes)
- Webhook handlers (no changes)
- Device token update logic (can extend)

❌ **Need to Build:**
- Multi-device token table
- Notification history model
- Unread count tracking API
- Mobile-specific device registration endpoints
- Device token cleanup/rotation logic

---

## Part 5: Mobile Integration Recommendation

### 5.1 Recommended Architecture: Unified Notification Hub

```
┌────────────────────────────────────────────────────────────┐
│              UNIFIED NOTIFICATION SYSTEM                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Backend Events → Notification Hub → Persistence Layer   │
│                        ↓                                   │
│              ┌──────────┴──────────┐                       │
│              ↓                     ↓                       │
│          FCM Push              In-App Socket              │
│        (Web + Mobile)          (Real-time)                │
│                                                            │
│  Notification Model:                                       │
│  - ID, type, title, body, data                            │
│  - Recipient (user or integrator)                         │
│  - Status (created, delivered, read)                      │
│  - Channel (push, in-app, email)                          │
│  - Timestamps                                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Why This Approach

**Advantages:**
1. **Single source of truth** - One model for all notification types
2. **No duplication** - Reuse backend, one API layer
3. **Scalable** - Easy to add email, SMS later
4. **Trackable** - Full audit trail of notifications
5. **Feature-rich** - Supports read receipts, retry logic
6. **Future-proof** - Web and mobile evolve independently

### 5.3 Implementation Approach: Phase-Based

#### **Phase 1: Foundation (1-2 weeks)**
Build core infrastructure needed by both web and mobile:
- `Notification` database model
- `NotificationService` to record events
- `GET /api/notifications` API
- `PUT /api/notifications/{id}/read` API
- Device token multi-device support

#### **Phase 2: Event Triggers (1-2 weeks)**
Wire up all schedule workflow events:
- Update scheduler status handlers
- Add notifications to webhook handlers
- Create notification templates
- Test all event paths

#### **Phase 3: Web Frontend (1 week)**
Complete web push notification support:
- Firebase Messaging initialization
- Service worker setup
- Token registration flow
- In-app notification display

#### **Phase 4: Mobile Integration (2-3 weeks)**
Implement React Native push support:
- Expo notifications OR React Native Firebase
- Device token management
- Deep linking
- Bell icon with unread count

---

## Part 6: Unified Notification Data Model

### 6.1 Notification Schema

```javascript
// app/api/models/notification.js
{
  _id: ObjectId,
  
  // Recipients
  recipient: {
    userId: ObjectId,           // User recipient
    type: 'user'|'integrator'  // Recipient type
  },
  
  // Content
  type: 'booking_created'|'booking_approved'|'payment_succeeded'|...,
  title: String,              // "New Booking"
  body: String,               // "You have a new booking..."
  
  // Navigation & Context
  screen: String,             // 'calendar', 'payments', 'schedules'
  screenParams: {             // Any screen-specific data
    scheduleId: ObjectId,
    projectId: ObjectId,
    ...
  },
  
  // Related Objects
  relatedTo: {
    schedule: ObjectId,        // If about a schedule
    payment: ObjectId,         // If about a payment
    project: ObjectId,         // If about a project
    integrator: ObjectId       // If from/about integrator
  },
  
  // Status Tracking
  status: {
    created: true,             // Always true initially
    delivered: Boolean,        // Successfully sent to provider
    read: Boolean,             // User has read
    archived: Boolean          // User archived it
  },
  
  // Channels
  channels: [                  // How this was delivered
    {
      type: 'push'|'in-app'|'email'|'socket',
      sent: Boolean,
      sentAt: Date,
      error: String            // If failed
    }
  ],
  
  // Metadata
  priority: 'high'|'normal'|'low',
  actionUrl: String,          // Optional action URL
  actionLabel: String,        // Optional button label
  
  // Timestamps
  createdAt: Date,
  deliveredAt: Date,
  readAt: Date,
  expiresAt: Date            // Auto-cleanup after 90 days
}
```

### 6.2 Multi-Device Token Model

```javascript
// app/api/models/deviceToken.js
{
  _id: ObjectId,
  
  user: ObjectId,             // Reference to User
  
  token: String,              // FCM token (unique per device)
  
  device: {
    type: 'web'|'mobile_ios'|'mobile_android',
    platform: String,         // 'browser', 'ios', 'android'
    osVersion: String,
    appVersion: String,
    userAgent: String         // For web
  },
  
  status: {
    active: Boolean,
    lastUsed: Date,
    failCount: Number         // Track failed sends
  },
  
  capabilities: {
    supportsPush: Boolean,
    supportsSound: Boolean,
    supportsBadge: Boolean,
    supportsActionButtons: Boolean
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### 6.3 Notification Preferences Model

```javascript
// app/api/models/notificationPreferences.js
{
  user: ObjectId,
  
  preferences: {
    bookings: {
      newBooking: true,
      bookingApproved: true,
      bookingDeclined: true
    },
    payments: {
      paymentReceived: true,
      paymentFailed: true
    },
    schedules: {
      readyToStart: true,
      scheduleUpdated: true,
      scheduleCancelled: true
    },
    other: {
      soundEnabled: true,
      badgeEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00"
    }
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## Part 7: Bell Icon Requirements

### 7.1 Unread Notification Badge

#### **API Requirements**

```
GET /api/notifications/unread-count
Response: { count: number }

GET /api/notifications?limit=10&offset=0
Response: { 
  data: [Notification],
  total: number,
  unread: number
}

PUT /api/notifications/{id}/read
Response: { success: true }

PUT /api/notifications/read-all
Response: { success: true, count: number }
```

#### **Frontend Implementation**

```javascript
// Mobile: Bell Icon Component
<BellIcon 
  unreadCount={notifications.unread}
  onPress={() => navigation.navigate('Notifications')}
/>

// Notification List
useEffect(() => {
  fetchNotifications()
  subscribeToNewNotifications()  // Real-time via socket or polling
}, [])

// Mark as read on tap
onNotificationTap = async (notification) => {
  await markAsRead(notification._id)
  navigateToScreen(notification.screen, notification.screenParams)
}
```

### 7.2 Notification List Features

| Feature | Desktop | Mobile | Priority |
|---------|---------|--------|----------|
| Notification list view | Optional | YES | HIGH |
| Unread badge on bell | Optional | YES | HIGH |
| Mark as read (individual) | Optional | YES | HIGH |
| Mark all as read | Optional | YES | MEDIUM |
| Delete notification | Optional | YES | MEDIUM |
| Notification groups by date | Optional | YES | MEDIUM |
| Search/filter | Optional | NO | LOW |
| Archive notifications | Optional | MEDIUM | LOW |

### 7.3 Deep Linking from Notification

```javascript
// When user taps notification
notification.screen = 'calendar'
notification.screenParams = {
  scheduleId: '123',
  tab: 'pending'  // optional
}

// Mobile navigation
navigation.navigate(notification.screen, notification.screenParams)

// Maps to:
// calendar → CalendarScreen (schedules view)
// payments → PaymentsScreen
// schedules → ScheduleDetailScreen with scheduleId
// profile → ProfileScreen
```

---

## Part 8: API Plan for Unified Notification System

### 8.1 New API Endpoints Required

#### **Notification Management**

```
GET    /api/notifications
       Query: ?limit=20&offset=0&filter=unread|all|archived
       Response: { data: [Notification], total, unread }

GET    /api/notifications/unread-count
       Response: { count: number }

GET    /api/notifications/{id}
       Response: Notification

PUT    /api/notifications/{id}/read
       Response: { success: true }

PUT    /api/notifications/read-all
       Response: { success: true, count: number }

PUT    /api/notifications/{id}/archive
       Response: { success: true }

DELETE /api/notifications/{id}
       Response: { success: true }

DELETE /api/notifications/expired
       Admin endpoint for cleanup
       Response: { deleted: number }
```

#### **Device Token Management (New)**

```
PUT    /api/user/device-token
       Body: { token: string, device: { type, platform, osVersion } }
       Response: { success: true, deviceTokenId: string }

GET    /api/user/device-tokens
       Response: { tokens: [DeviceToken] }

DELETE /api/user/device-tokens/{id}
       Response: { success: true }

POST   /api/user/device-tokens/cleanup
       Admin: Delete inactive tokens
       Response: { deleted: number }
```

#### **Notification Preferences**

```
GET    /api/notifications/preferences
       Response: NotificationPreferences

PUT    /api/notifications/preferences
       Body: { preferences: {...} }
       Response: NotificationPreferences
```

#### **Enhanced Sending Endpoint** (PUT /api/notify)

```
Current: PUT /api/notify?action=single|multiple
Changes:
- Add notificationType parameter for tracking
- Add store=true to save to notification history
- Return notification IDs for tracking

Request:
{
  fcm: "token",
  title: "...",
  body: "...",
  notificationType: "booking_approved",
  relatedId: "scheduleId",
  store: true  // Save to DB
}

Response:
{
  success: true,
  notificationId: "..."
}
```

### 8.2 Modified Existing Endpoints

#### **PUT /api/user/fcm** → **PUT /api/user/device-token**

```
Old: ?id=userId&token=fcmToken
     - Single token per user
     - Overwrites previous token

New: Body: { token, device: { type, platform, osVersion } }
     - Multiple tokens per user
     - Adds device metadata
     - Appends instead of overwriting
```

### 8.3 Internal Service Changes

#### **New NotificationService**

```javascript
// app/api/services/notificationService.js

class NotificationService {
  
  async createNotification(data) {
    // Save to DB
    // Return notification ID
  }
  
  async sendNotification(userId, notification) {
    // Get user's device tokens
    // Send to all active tokens
    // Update sent status
  }
  
  async broadcastNotification(userIds, notification) {
    // Send to multiple users
    // Track delivery per user
  }
  
  async getNotifications(userId, options) {
    // Query with filtering
    // Return paginated results
  }
  
  async markAsRead(notificationId) {
    // Update status
    // Record readAt timestamp
  }
}
```

#### **Update Webhook Handlers**

File: [app/api/services/webHooksService.js](app/api/services/webHooksService.js)

```javascript
// Add notification creation to payment success handler
const handlePaymentIntentSucceeded = async (event) => {
  // ... existing code ...
  
  // Create notifications
  await notificationService.broadcastNotification(
    [receivingIntegrator.owner, payingIntegrator.owner, engineer],
    {
      type: 'payment_succeeded',
      title: 'Payment Completed',
      body: `Payment of ${amount} completed`,
      schedule: schedulerId,
      screen: 'payments'
    }
  )
}
```

#### **Update Scheduler Service**

File: [app/api/services/scheduler.js](app/api/services/scheduler.js)

```javascript
// Enhance updateByStatus to create notifications on each transition
export async function updateByStatus(scheduleId, user, body) {
  const schedule = await Scheduler.findById(scheduleId)
  const targetStatus = body.status
  
  // Get status update
  const update = buildStatusUpdate(schedule, actor, targetStatus, body)
  
  // Update schedule
  const updated = await Scheduler.findByIdAndUpdate(scheduleId, update)
  
  // Create notifications based on new status
  if (targetStatus === 'Accepted') {
    await notificationService.sendNotification(receivingIntegrator, {
      type: 'engineer_accepted',
      title: 'Engineer Accepted',
      body: `${engineer.name} accepted your booking`,
      schedule: scheduleId,
      screen: 'schedules'
    })
  }
  
  // ... other status transitions ...
  
  return updated
}
```

---

## Part 9: Safety & Permission Controls

### 9.1 Authorization Matrix

#### **Who Can See Notifications**

| User Type | Can See Own | Can See Other User | Can See Team | Admin Access |
|-----------|------------|------------------|--------------|--------------|
| Engineer | ✅ YES | ❌ NO | ❌ NO | ❌ NO |
| Integrator Staff | ✅ YES | ❌ NO (unless manager) | ✅ Company team | ❌ NO |
| Manager | ✅ YES | ✅ Team members | ✅ Company team | ✅ Company |
| Admin | ✅ YES | ✅ ANY | ✅ ANY | ✅ YES |

#### **Recipient Validation Rules**

```javascript
// app/api/middleware/notificationAuth.js

async function validateNotificationAccess(user, notificationId) {
  const notification = await Notification.findById(notificationId)
  
  if (!notification) {
    throw new Error('Notification not found')
  }
  
  // Engineer can only see own notifications
  if (user.role === 'engineer') {
    if (notification.recipient.userId?.toString() !== user._id.toString()) {
      throw new Error('Access denied')
    }
  }
  
  // Integrator staff can see own + company notifications
  if (user.role === 'integrator') {
    if (notification.recipient.type === 'user' && 
        notification.recipient.userId?.toString() !== user._id.toString()) {
      throw new Error('Access denied')
    }
    
    if (notification.recipient.type === 'integrator' &&
        notification.recipient.integrator?.toString() !== user.integrator?.toString()) {
      throw new Error('Access denied')
    }
  }
  
  // Admin can see all
  if (user.role === 'admin') {
    return true
  }
  
  throw new Error('Unauthorized')
}
```

### 9.2 Data Leakage Prevention

#### **Schedule-Related Notifications**

✅ **Engineer receives notifications ONLY for:**
- Schedules where `engineer === user._id`
- Only their own booking events

✅ **Receiving Integrator receives ONLY for:**
- Schedules where `receivingIntegratorId === user.integrator`
- Only from engineers they employ

✅ **Paying Integrator receives ONLY for:**
- Schedules where `payingIntegrator === user.integrator`
- Only schedules they initiated

❌ **PREVENT:**
- Engineer seeing another engineer's notifications
- Integrator A seeing Integrator B's internal notifications
- Cross-tenant payment information leakage

#### **Implementation Pattern**

```javascript
async function sendNotificationToEngineer(scheduleId, eventType) {
  const schedule = await Scheduler.findById(scheduleId)
    .populate('engineer')
  
  // Only send to the actual engineer
  await notificationService.sendToUser(
    schedule.engineer._id,
    {
      type: eventType,
      title: '...',
      screen: 'calendar',
      screenParams: { scheduleId }
    }
  )
}

async function sendNotificationToIntegrator(scheduleId, eventType, role) {
  const schedule = await Scheduler.findById(scheduleId)
    .populate('receivingIntegratorId')
    .populate('payingIntegrator')
  
  if (role === 'receiving') {
    const users = await User.find({
      integrator: schedule.receivingIntegratorId,
      role: { $in: ['admin', 'integrator'] }
    })
    
    await notificationService.sendToUsers(
      users.map(u => u._id),
      { type: eventType, ... }
    )
  }
  
  // Similar for payingIntegrator...
}
```

### 9.3 Device Token Security

| Protection | Implementation |
|------------|-----------------|
| **Token belongs to user** | Validate token is in user's device list before sending |
| **Token cleanup** | Remove invalid tokens after failed sends (3+ failures) |
| **Token expiry** | Mark tokens inactive if unused for 30 days |
| **Token rotation** | Request new token every 60 days |
| **Cross-user check** | Prevent user A from sending to user B's token |

```javascript
// app/api/utils/push-notification.js

async function sendNotification(fcmToken, title, body, data = {}) {
  try {
    // Validate token is still active
    const deviceToken = await DeviceToken.findOne({ 
      token: fcmToken,
      'status.active': true
    })
    
    if (!deviceToken) {
      logger.warn(`Invalid or inactive token: ${fcmToken}`)
      return { success: false, reason: 'Token invalid' }
    }
    
    // Send via FCM...
    const result = await axios.post(...)
    
    if (!result.success) {
      // Increment failure count
      deviceToken.status.failCount++
      
      if (deviceToken.status.failCount >= 3) {
        // Deactivate token
        deviceToken.status.active = false
        logger.info(`Token deactivated after 3 failures: ${fcmToken}`)
      }
      
      await deviceToken.save()
    }
    
    return result
  } catch (err) {
    logger.error('FCM send failed', err)
    return { success: false }
  }
}
```

---

## Part 10: Implementation Roadmap

### 10.1 Phase 1: Foundation & Data Model (Weeks 1-2)

**Deliverables:**
- [ ] Create `Notification` model
- [ ] Create `DeviceToken` model for multi-device support
- [ ] Create `NotificationPreferences` model
- [ ] Create `NotificationService` class
- [ ] API endpoints: GET, PUT, DELETE notifications
- [ ] API endpoint: PUT device token
- [ ] Add indexes for performance

**Files to Create:**
```
app/api/models/notification.js
app/api/models/deviceToken.js
app/api/models/notificationPreferences.js
app/api/services/notificationService.js
app/api/notifications/route.js (new endpoint)
app/api/user/device-token/route.js (new endpoint)
app/api/notifications/preferences/route.js (new endpoint)
```

**Testing:**
- Create notifications in database
- Test permission validation
- Test cleanup logic

---

### 10.2 Phase 2: Event Triggers (Weeks 3-4)

**Wire Up Notifications for All Schedule Workflow Events:**
- [ ] Update `updateByStatus` in scheduler service
- [ ] Add notifications to all status transitions
- [ ] Update payment webhook handlers
- [ ] Create notification templates for each event type
- [ ] Add logging for notification sends

**Files to Modify:**
```
app/api/services/scheduler.js
app/api/services/webHooksService.js
app/api/services/notificationService.js
app/api/constants/notificationTypes.js (create)
```

**Testing:**
- E2E: Create schedule → verify engineer notification
- E2E: Engineer accepts → verify integrator notification
- E2E: Payment success → verify both notified
- Webhook replay to test past events

---

### 10.3 Phase 3: Web Frontend Completion (Week 5)

**Complete Web Push Support:**
- [ ] Initialize Firebase Messaging
- [ ] Create `public/firebase-messaging-sw.js`
- [ ] Create registration component/hook
- [ ] Request notification permission on login
- [ ] Call PUT `/api/user/device-token` on auth
- [ ] Add token refresh logic
- [ ] Display notifications in UI

**Files to Create/Modify:**
```
firebase/index.js (modify)
public/firebase-messaging-sw.js (create)
hooks/useNotificationRegistration.js (create)
components/NotificationPermissionPrompt.jsx (create)
utils/apiUrl.js (add new endpoints)
```

**Testing:**
- Web: Request permission → verify token saved
- Web: Receive FCM message → verify displays
- Web: Click notification → verify deep link works

---

### 10.4 Phase 4: Mobile Integration (Weeks 6-8)

**React Native Push Notifications:**
- [ ] Choose: Expo Notifications OR React Native Firebase
- [ ] Initialize push notification service
- [ ] Device token registration on app startup
- [ ] Handle permission requests (iOS/Android)
- [ ] Create bell icon with unread badge
- [ ] Notification list screen
- [ ] Deep linking from notifications
- [ ] Handle foreground/background notifications

**Files to Create (React Native side):**
```
src/services/notificationService.ts
src/hooks/usePushNotifications.ts
src/screens/NotificationsScreen.tsx
src/components/BellIcon.tsx
src/utils/deepLinking.ts
```

**Testing:**
- Mobile: Register token → verify in DB
- Mobile: Receive notification while app open
- Mobile: Receive while app closed → verify shows
- Mobile: Tap notification → deep link works
- Mobile: Bell icon shows unread count

---

### 10.5 Testing & Deployment Checklist

#### **Pre-Production Validation**

- [ ] Load test notification API (1000+ QPS)
- [ ] Test token cleanup with 100k inactive tokens
- [ ] Verify permissions on all notification queries
- [ ] Check cross-tenant data isolation
- [ ] Webhook replay test for all event types
- [ ] Test notification deduplication
- [ ] Verify FCM quota not exceeded
- [ ] Test notification retention (auto-delete after 90 days)

#### **Deployment Strategy**

1. **Deploy Phase 1** (foundation) → Monitor for errors
2. **Deploy Phase 2** (triggers) → Gradual rollout 50% → 100%
3. **Deploy Phase 3** (web) → Test in staging
4. **Deploy Phase 4** (mobile) → Staged rollout with feature flag

---

## Part 11: Known Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **FCM quota exceeded** | HIGH | Monitor quota usage, set alerts at 80% |
| **Notification spam** | HIGH | Implement rate limiting per user |
| **Token churn** | MEDIUM | Clean up inactive tokens weekly |
| **Duplicate notifications** | MEDIUM | Implement idempotency key in webhook handler |
| **Notification delay** | MEDIUM | Monitor FCM latency, implement retry logic |
| **Data leakage** | CRITICAL | Extensive permission validation, code review |
| **Lost notifications** | MEDIUM | Persist to DB before sending to FCM |
| **Device token conflicts** | MEDIUM | Validate token belongs to user |
| **Mobile app crashes** | MEDIUM | Test deep links with all payload types |

---

## Part 12: Open Questions & Decisions Needed

### 12.1 Technology Decisions

1. **Mobile Push Solution**
   - Option A: Use Expo Notifications (managed)
   - Option B: Use React Native Firebase (direct FCM)
   - **Decision Needed:** Which platform for React Native app?

2. **WebSocket vs Polling for Unread Count**
   - Option A: Real-time socket updates (WebSocket)
   - Option B: Poll every 30 seconds
   - Option C: Poll on foreground app resume
   - **Decision Needed:** Performance vs real-time trade-off?

3. **Notification History Duration**
   - Option A: Keep forever (storage cost)
   - Option B: Keep 90 days (current plan)
   - Option C: Keep 30 days (mobile-centric)
   - **Decision Needed:** Retention policy?

4. **In-App Notifications During Work Hours**
   - Option A: Show all notifications
   - Option B: Respect quiet hours (no sound)
   - Option C: Smart delivery based on activity
   - **Decision Needed:** Notification delivery strategy?

### 12.2 Product Questions

1. **Should notification preferences be per-user or per-integrator company?**
   - Current assumption: Per-user (each staff member chooses own)
   - Alternative: Company-level policy

2. **Should engineers receive notifications about OTHER engineers' schedules?**
   - Current assumption: No (privacy)
   - Alternative: Yes (team awareness)

3. **What happens if engineer has web AND mobile app open?**
   - Current assumption: Send to both, handle deduplication on client
   - Alternative: Send only to most active

### 12.3 Infrastructure Questions

1. **How many Firebase projects do we have?**
   - Currently: 1 (snatchichat)
   - Plan: Keep using same for web + mobile?

2. **Should we use Firebase Realtime Database for unread count?**
   - Current plan: MongoDB
   - Alternative: Firestore for real-time sync

3. **What's the SLA for notification delivery?**
   - Should be similar to FCM standard (varies by carrier)

---

## Part 13: Success Criteria

### Phase 1 Complete ✅
- [ ] Notification model stores 100% of sent notifications
- [ ] API rate limited to 100 req/sec per user
- [ ] Permission validation blocks cross-tenant access
- [ ] Test: 1000 notifications saved and retrieved in <500ms

### Phase 2 Complete ✅
- [ ] All 8 engineer events trigger notifications
- [ ] All payment events trigger notifications
- [ ] Webhook handlers send notifications within 5 seconds
- [ ] Test: 100% of status transitions generate notifications

### Phase 3 Complete ✅
- [ ] Web browser requests permission on first login
- [ ] 90%+ of active web users have tokens registered
- [ ] Push notifications display on web browser
- [ ] Clicking notification deep links to correct screen

### Phase 4 Complete ✅
- [ ] Mobile app registers token on launch
- [ ] Bell icon shows unread count
- [ ] 95%+ of notifications delivered within 5 seconds
- [ ] Tapping notification opens correct schedule/payment screen

---

## Summary: Before Mobile Development

### What's Already Built ✅
- FCM backend service fully functional
- Device token storage in database
- API endpoint for sending notifications
- Webhook infrastructure
- Some schedule workflow notifications

### What's Missing ❌
- Notification history/database tracking
- Unread notification count
- Complete event trigger coverage (only 1 of 8 engineers events wired)
- Frontend token registration (web)
- Multi-device token support
- Notification preferences
- Notification cleanup logic
- Permission validation layer

### What Must Happen Before Mobile Launch
1. **Build notification foundation** (model, API, service)
2. **Wire all schedule workflow events** to create notifications
3. **Complete web frontend** push registration
4. **Design notification deep linking** for all screens
5. **Implement strict permission validation**
6. **Load test and monitor FCM quotas**

### Recommended Approach
- **Don't delay mobile by changing web UI**
- **Use unified backend** for both platforms
- **Implement mobile alongside Phase 3-4 foundation work**
- **Share API design with mobile team early**
- **Test deep linking before mobile implementation**

---

**Report Complete**: All audit and design work done. Ready to proceed with implementation when approved.

**Next Step:** Review recommendations and finalize technology decisions from Section 12.1 before Phase 1 begins.
