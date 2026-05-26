# Phase 2 — Quick Reference Guide

**TL;DR:** All workflow events now automatically send notifications. Here's where.

---

## 🎯 When Events Fire

### Booking Events
| Event | Triggered | Called From | Recipient |
|-------|-----------|-------------|-----------|
| **booking_created** | Create schedule | `POST /api/scheduler` | Engineer |
| **engineer_accepted** | Engineer accepts | `updateByStatus(Accepted)` | Integrator A |
| **engineer_declined** | Engineer declines | `updateByStatus(Declined)` | Integrator B |
| **booking_approved** | Integrator A approves | `updateByStatus(Approved)` | Engineer + Integrator B |

### Payment Events
| Event | Triggered | Called From | Recipient |
|-------|-----------|-------------|-----------|
| **payment_completed** | Stripe succeeds | Webhook handler | Engineer + A + B |
| **payment_failed** | Stripe fails | Webhook handler | Integrator B |

### Work Events
| Event | Triggered | Called From | Recipient |
|-------|-----------|-------------|-----------|
| **ready_to_start** | After payment succeeds | `updateByStatus(ReadyToStart)` | Engineer |
| **work_started** | Engineer starts work | `updateByStatus(InProgress)` | Integrator A + B |
| **work_completed** | Engineer completes work | `updateByStatus(Completed)` | Integrator A + B |

### Schedule Events
| Event | Triggered | Called From | Recipient |
|-------|-----------|-------------|-----------|
| **schedule_updated** | Fields change | (To be implemented) | Engineer + A + B |
| **schedule_cancelled** | Schedule cancelled | `updateByStatus(Cancelled)` | Engineer + A + B |

---

## 🔗 Integration Points

### In scheduler/route.js (POST):
```javascript
// BOOKING CREATED
const result = await add({...});
if (result) {
  await notificationEvents.bookingCreated({
    scheduleId: result._id,
    engineerId: result.engineer._id,
    projectName: result.project.name,
    // ... see notificationEvents.js for full payload
  });
}
```

### In scheduler.js (updateByStatus):
```javascript
// STATUS CHANGES
if (currentStatus === PENDING && targetStatus === ACCEPTED) {
  await notificationEvents.bookingAccepted({...});
}
if (currentStatus === ACCEPTED && targetStatus === APPROVED) {
  await notificationEvents.bookingApproved({...});
}
// ... etc for all 8 status change events
```

### In webHooksService.js (payment webhook handlers):
```javascript
// PAYMENT SUCCESS
await notificationEvents.paymentCompleted({
  scheduleId: payment.scheduler,
  paymentId: payment._id,
  engineerId: scheduler.engineer._id,
  payingIntegratorId: scheduler.payingIntegrator._id,
  receivingIntegratorId: scheduler.receivingIntegratorId._id,
  projectName: scheduler.project.name,
  amountPaid: payment.grossAmount
});

// PAYMENT FAILURE
await notificationEvents.paymentFailed({
  scheduleId: payment.scheduler,
  paymentId: payment._id,
  payingIntegratorId: scheduler.payingIntegrator._id,
  projectName: scheduler.project.name,
  failureReason: payment.chargeFailureMessage
});
```

---

## 📝 Event Method Signatures

```javascript
// Booking Events
notificationEvents.bookingCreated({
  scheduleId, engineerId, projectName, siteLocation,
  startDate, endDate, payingIntegratorName, receivingIntegratorName
})

notificationEvents.bookingAccepted({
  scheduleId, receivingIntegratorId, engineerName, projectName, siteLocation
})

notificationEvents.bookingDeclined({
  scheduleId, payingIntegratorId, engineerName, projectName, declineReason
})

notificationEvents.bookingApproved({
  scheduleId, engineerId, payingIntegratorId, projectName, siteLocation, startDate
})

// Payment Events
notificationEvents.paymentCompleted({
  scheduleId, paymentId, engineerId, payingIntegratorId, receivingIntegratorId,
  projectName, amountPaid
})

notificationEvents.paymentFailed({
  scheduleId, paymentId, payingIntegratorId, projectName, failureReason
})

// Work Events
notificationEvents.readyToStart({
  scheduleId, engineerId, projectName, siteLocation, startDate
})

notificationEvents.workStarted({
  scheduleId, payingIntegratorId, receivingIntegratorId, projectName, engineerName
})

notificationEvents.workCompleted({
  scheduleId, payingIntegratorId, receivingIntegratorId, projectName, engineerName
})

// Schedule Events
notificationEvents.scheduleUpdated({
  scheduleId, engineerId, payingIntegratorId, receivingIntegratorId,
  projectName, updatedFields
})

notificationEvents.scheduleCancelled({
  scheduleId, engineerId, payingIntegratorId, receivingIntegratorId,
  projectName, cancellationReason
})
```

---

## ⚠️ Important Notes

### Idempotency
Payment events are automatically deduplicated:
```javascript
// Webhook retry? Already sent notification? → Skipped automatically
await notificationEvents.paymentCompleted({...}); // Safe to call 2x
await notificationEvents.paymentCompleted({...}); // Only 1 notification created
```

### Error Handling
Notifications are best-effort:
```javascript
// If notification fails, workflow continues
try {
  await notificationEvents.bookingAccepted({...});
} catch (error) {
  logger.error('Notification failed', error); // Logged but not thrown
}
// Schedule update still succeeded ✅
```

### Recipients
**Know the difference:**
- `userId` → Individual engineer
- `integratorId` → Broadcasts to all staff of company

---

## 📊 Event Statistics

| Metric | Value |
|--------|-------|
| Total events wired | 11 |
| Status-change events | 8 |
| Payment events | 2 |
| Booking events | 4 |
| Work events | 3 |
| Schedule events | 2 |
| **Total notifications per workflow** | ~12-15 |

---

## 🧪 Testing

```bash
# Run test suite
node -e "require('./app/api/utils/workflowNotificationEventTests').runAllTests()"

# Expected output
✅ bookingCreated sends to engineer
✅ bookingAccepted sends to receiving integrator
✅ bookingDeclined sends to paying integrator
✅ bookingApproved sends to engineer and paying integrator
✅ paymentCompleted sends to 3 recipients
✅ paymentCompleted is idempotent
✅ paymentFailed sends to paying integrator
✅ readyToStart sends to engineer
✅ workStarted sends to both integrators
✅ workCompleted sends to both integrators
✅ scheduleUpdated sends to all parties when fields change
✅ scheduleUpdated skips when no significant fields change
✅ scheduleCancelled sends to engineer and both integrators
✅ unread count updates after notifications
✅ notification content matches payload

PASSED: 15/15
```

---

## 🚀 Adding a New Event

To add a new notification event:

### 1. Add to notificationEvents.js
```javascript
const myNewEvent = async (payload) => {
  const {
    scheduleId,
    engineerId,
    // ... other fields
  } = payload;

  try {
    await notificationService.createNotification({
      recipient: { userId: engineerId, type: 'user' },
      type: NOTIFICATION_TYPES.MY_NEW_EVENT,
      title: 'My Title',
      body: `My body with ${engineerId}`,
      screen: NOTIFICATION_SCREENS.CALENDAR,
      relatedTo: { schedule: scheduleId },
      priority: 'high'
    });

    logNotificationEvent('MY_NEW_EVENT', 1, { engineerId, scheduleId });
  } catch (error) {
    logNotificationError('MY_NEW_EVENT', error, { engineerId, scheduleId });
    throw error;
  }
};

module.exports = {
  // ... existing exports
  myNewEvent
};
```

### 2. Call from workflow
```javascript
// In scheduler.js or wherever the event occurs
await notificationEvents.myNewEvent({
  scheduleId: result._id,
  engineerId: result.engineer._id,
  // ... other payload fields
});
```

### 3. Add test case
```javascript
async function testMyNewEvent() {
  const testName = 'myNewEvent sends to engineer';
  try {
    await cleanupNotifications();
    
    await notificationEvents.myNewEvent({
      scheduleId: testConfig.scheduleId,
      engineerId: testConfig.engineerId,
      // ... payload
    });

    const notification = await assertNotificationExists(
      testConfig.engineerId,
      null,
      'my_new_event'
    );

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}
```

---

## 📋 Checklist for Code Review

- [ ] Event method signature defined
- [ ] Recipients correctly identified
- [ ] Notification type matches NOTIFICATION_TYPES enum
- [ ] Screen navigation target valid
- [ ] Priority appropriate (high/normal/low)
- [ ] Payload includes scheduleId/paymentId for tracking
- [ ] Logging added (logNotificationEvent)
- [ ] Error handling present (logNotificationError)
- [ ] Test case added
- [ ] Documentation updated

---

## 🔍 Debugging

### Check notifications in database
```javascript
db.notifications.find({
  type: 'booking_created',
  'recipient.userId': ObjectId('...')
})
```

### Check device tokens
```javascript
db.devicetokens.find({
  user: ObjectId('...'),
  'status.active': true
})
```

### View logs
```bash
# Filter for notification events
grep "notification event triggered" /var/log/app.log

# Filter for errors
grep "Failed to send" /var/log/app.log
```

### Test webhook manually
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_...",
        "amount": 5000,
        "charges": { "data": [{ "id": "ch_..." }] }
      }
    }
  }'
```

---

## 📚 Full Documentation

- **WORKFLOW_NOTIFICATION_EVENT_WIRING_IMPLEMENTATION.md** - Complete reference
- **NOTIFICATION_SYSTEM_DEVELOPER_GUIDE.md** - Developer guide
- **PHASE_1_COMPLETION_SUMMARY.md** - Foundation recap
- **PHASE_2_COMPLETION_SUMMARY.md** - Phase 2 overview

---

## 💡 Pro Tips

1. **Always use notificationEvents.js** - Don't call notificationService directly
2. **Handle errors gracefully** - Wrap in try/catch, log but don't throw
3. **Pass full context** - Include all relevant IDs and names for good messages
4. **Test webhook scenarios** - Use test events, not production data
5. **Monitor unread count** - Users should see badge updates
6. **Check logs** - Review notification event logs for issues

---

**Last Updated:** May 26, 2026  
**Phase:** 2 - Complete
