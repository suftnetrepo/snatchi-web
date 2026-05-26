# Phase 3 — Quick Reference Guide

**TL;DR:** Web notification UI is fully implemented and integrated into the header. Users see a bell with unread badge, can click for a dropdown of recent notifications, and access the full notification center at `/protected/engineer/notifications`.

---

## 🔔 User Experience

### 1. Bell Icon in Header
- Always visible in top-right of header
- Shows **unread count badge** (red circle)
- Badge hidden when count = 0
- Badge capped at 99+ for large counts
- Updates every 30 seconds

### 2. Click Bell → Dropdown
- Shows latest **10 notifications**
- Newest first
- Unread highlighted (blue background)
- Click notification → navigate + mark as read
- "View All Notifications" link at bottom
- "Mark All as Read" button at top

### 3. View All → Notification Center
- URL: `/protected/engineer/notifications`
- Shows all notifications (**paginated, 20 per page**)
- Filter by unread/all
- Archive individual notifications
- Delete individual notifications
- Mark all as read

### 4. Click Notification → Action
1. Notification marked as read
2. Unread badge decreases
3. Navigate to related workflow
   - Booking → `/protected/engineer/calendar?scheduleId=XXX`
   - Payment → `/protected/engineer/payments/[id]`
   - Other → relevant screen

---

## 🛠️ For Developers

### Use the Hooks

```javascript
// Get unread count (auto-refreshes every 30 seconds)
import { useNotificationCount } from '@/hooks/useNotificationCount';

const { unreadCount, loading, error, refetch } = useNotificationCount();

// Get notifications list (paginated with actions)
import { useNotifications } from '@/hooks/useNotifications';

const {
  notifications,
  loading,
  error,
  hasMore,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification
} = useNotifications();

// Fetch initial batch
await fetchNotifications({ limit: 10, unreadOnly: false, archived: false });

// Mark single as read
await markAsRead(notificationId);

// Mark all as read
await markAllAsRead();

// Archive
await archiveNotification(notificationId);

// Delete
await deleteNotification(notificationId);

// Load more (pagination)
await fetchNotifications({ 
  limit: 10, 
  unreadOnly: false, 
  archived: false, 
  reset: false 
});
```

### Build Routes from Notifications

```javascript
import { 
  buildNotificationRoute, 
  getNotificationTypeConfig,
  formatRelativeTime,
  truncateText
} from '@/app/utils/notificationNavigation';

// Convert notification to route
const notification = {
  screen: 'calendar',
  relatedTo: { schedule: '123' }
};
const route = buildNotificationRoute(notification);
// → '/protected/engineer/calendar?scheduleId=123'

// Get icon/color/label for notification type
const config = getNotificationTypeConfig('booking_created');
// {
//   icon: 'fa-calendar-plus',
//   color: '#3B82F6',
//   label: 'New Booking'
// }

// Format time human-friendly
formatRelativeTime(new Date());
// → 'just now', '5 minutes ago', 'yesterday', etc.

// Truncate text
truncateText('Long notification body...', 80);
// → 'Long notification body...' (max 80 chars)
```

### Components

```jsx
// Bell icon (auto-updating)
import NotificationBell from '@/src/components/layouts/Header/NotificationBell';
<NotificationBell onClick={handleClick} isOpen={isDropdownOpen} />

// Dropdown panel (integrated into Header)
import NotificationDropdown from '@/src/components/layouts/Header/NotificationDropdown';
<NotificationDropdown />

// Notification center page (already at route)
// /protected/engineer/notifications
```

### Test Selectors

```javascript
// For Playwright tests
data-testid="notification-bell"
data-testid="notification-unread-badge"
data-testid="notification-dropdown"
data-testid="notification-item"
data-testid="notification-view-all"
data-testid="notification-center-page"
data-testid="notification-filter-unread"
data-testid="notification-mark-all-read"
data-testid="notification-item-read"
data-testid="notification-item-unread"
```

---

## 📊 Component Hierarchy

```
Header
├─ NotificationBell
│  └─ useNotificationCount (auto-refresh 30s)
└─ NotificationDropdown
   └─ useNotifications + NotificationBell
      ├─ NotificationItem (×10 per load)
      ├─ Mark All as Read button
      └─ View All link

/protected/engineer/notifications
└─ NotificationCenterPage
   ├─ Filter checkbox (unread/all)
   ├─ NotificationCenterItem (×20 paginated)
   ├─ Archive button per item
   ├─ Delete button per item
   └─ Load more button
```

---

## 🎨 Notification Type Icons & Colors

```
booking_created      fa-calendar-plus   Blue      #3B82F6
booking_accepted     fa-check-circle    Green     #10B981
booking_declined     fa-times-circle    Red       #EF4444
booking_approved     fa-thumbs-up       Purple    #8B5CF6
engineer_accepted    fa-check-circle    Green     #10B981
engineer_declined    fa-times-circle    Red       #EF4444
payment_completed    fa-check-circle    Green     #10B981
payment_failed       fa-exclamation     Red       #EF4444
ready_to_start       fa-play-circle     Blue      #3B82F6
work_started         fa-hourglass       Amber     #F59E0B
work_completed       fa-trophy          Green     #10B981
schedule_updated     fa-edit            Blue      #3B82F6
schedule_cancelled   fa-ban             Red       #EF4444
```

---

## 🧪 Running Tests

```bash
# Run all notification tests
npx playwright test tests/notifications.spec.ts

# Run specific test
npx playwright test tests/notifications.spec.ts -g "should display unread badge"

# Run with browser visible
npx playwright test tests/notifications.spec.ts --headed

# Debug mode
npx playwright test tests/notifications.spec.ts --debug
```

**Coverage:** 40+ test cases across:
- Bell functionality
- Dropdown functionality
- Notification center
- Security/authorization
- Accessibility
- Responsive design

---

## ⚙️ APIs Used

### Fetch Unread Count
```bash
GET /api/notifications/unread-count

Response:
{
  "success": true,
  "data": {
    "count": 5,
    "cappedCount": 5
  }
}
```

### Fetch Notifications
```bash
GET /api/notifications?limit=10&offset=0&unread=false&archived=false

Response:
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "123",
        "title": "New Booking",
        "body": "...",
        "type": "booking_created",
        "status": { "read": false, "archived": false },
        "createdAt": "2026-05-26T10:30:00Z",
        "screen": "calendar",
        "relatedTo": { "schedule": "456" }
      }
    ],
    "total": 25
  }
}
```

### Mark as Read
```bash
PUT /api/notifications
Body: { "action": "read", "notificationId": "123" }

Response:
{
  "success": true,
  "data": { ... }
}
```

### Mark All as Read
```bash
PUT /api/notifications
Body: { "action": "read-all" }

Response:
{
  "success": true,
  "data": { ... }
}
```

### Archive
```bash
PUT /api/notifications
Body: { "action": "archive", "notificationId": "123" }

Response:
{
  "success": true,
  "data": { ... }
}
```

### Delete
```bash
DELETE /api/notifications
Body: { "notificationId": "123" }

Response:
{
  "success": true
}
```

---

## 🚀 Performance Tips

### Unread Count
- Auto-refreshes every **30 seconds**
- Debounced to **minimum 3 seconds** between manual fetches
- Uses simple count query (indexed, fast)
- Lightweight response (just a number)

### Notifications List
- Dropdown shows **10 notifications**
- Center page shows **20 per page**
- Maximum **100 per request** (API-enforced)
- Server-side filtering (reduces payload)
- Pagination prevents loading all at once

### Memory
- Cleanup on component unmount
- All intervals/timeouts cleared
- No memory leaks
- Optimistic UI updates prevent lag

---

## 🔒 Security

### Authorization
- All endpoints require authentication
- Engineers only see own notifications
- Integrators only see tenant-safe notifications
- API validates user context before filtering

### Data Validation
- Input validation on limit (max 100)
- Action validation (read, read-all, archive only)
- NotificationId validation
- No sensitive data in notifications

---

## 📱 Responsive Design

- **Desktop (>768px)** - Full layout
- **Tablet (576-768px)** - Adjusted spacing
- **Mobile (<576px)** - Stacked layout, full-width dropdown

All components tested on:
- Mobile (375×667)
- Tablet (768×1024)
- Desktop (1920×1080)

---

## ♿ Accessibility

- ✅ ARIA labels on bell ("Notifications - X unread")
- ✅ Keyboard navigable (Tab through items)
- ✅ Focus states visible
- ✅ Color contrast meets WCAG standards
- ✅ Semantic HTML

---

## 🔄 Refresh Strategy

### Why Polling?
- Simpler than websockets (Phase 5)
- Good enough for notification center
- Scales well
- Works with existing infrastructure

### Polling Interval
- **Bell:** Every 30 seconds (lightweight)
- **Manual:** Triggers after mark-as-read, archive, delete
- **Debounce:** Minimum 3 seconds between fetches

### Future: Websockets
Phase 5 can upgrade to real-time websockets without changing component API (hooks stay the same).

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [WEB_NOTIFICATION_UI_IMPLEMENTATION.md](WEB_NOTIFICATION_UI_IMPLEMENTATION.md) | Complete technical reference |
| [PHASE_3_COMPLETION_SUMMARY.md](PHASE_3_COMPLETION_SUMMARY.md) | Phase 3 overview |
| [WORKFLOW_NOTIFICATION_EVENT_WIRING_IMPLEMENTATION.md](WORKFLOW_NOTIFICATION_EVENT_WIRING_IMPLEMENTATION.md) | Phase 2 reference |
| [NOTIFICATION_SYSTEM_DEVELOPER_GUIDE.md](NOTIFICATION_SYSTEM_DEVELOPER_GUIDE.md) | Developer guide |

---

## 🎯 Integration Checklist

- [x] Bell icon displays in header
- [x] Unread badge shows/hides correctly
- [x] Bell clickable opens dropdown
- [x] Notifications fetch and display
- [x] Unread filter works
- [x] Mark as read works
- [x] Mark all as read works
- [x] Archive works
- [x] Delete works
- [x] Deep linking works
- [x] Responsive on mobile/tablet/desktop
- [x] Accessible with keyboard/screen reader
- [x] Tests passing
- [x] No console errors
- [x] Performance acceptable

---

## 🚨 Common Issues

### No notifications showing?
1. Check `/api/notifications` endpoint (Phase 2 setup)
2. Verify user is logged in
3. Check browser network tab for 401 errors
4. Look for JavaScript errors in console

### Badge not updating?
1. Check `/api/notifications/unread-count` endpoint
2. Verify polling is running (30 second interval)
3. Check browser DevTools Network tab
4. Look for JavaScript errors

### Deep linking not working?
1. Check `buildNotificationRoute()` in notification data
2. Verify `screen` and `relatedTo` are populated
3. Check notification routes exist (Phase 2 setup)
4. Verify next/navigation import

### Tests failing?
1. Check `/api/notifications` mock responses
2. Verify selectors match component data-testid
3. Check auth mock is working
4. Look at Playwright debug output

---

## 📞 Support

- Check the full docs in [WEB_NOTIFICATION_UI_IMPLEMENTATION.md](WEB_NOTIFICATION_UI_IMPLEMENTATION.md)
- Run tests: `npx playwright test tests/notifications.spec.ts`
- Check component code for JSDoc comments
- Review hook implementations for usage examples

---

**Last Updated:** May 26, 2026  
**Phase:** 3 - Complete ✅
