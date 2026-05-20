# Dashboard Data Integrity Verification Guide

This guide helps verify that dashboard numbers are consistent end-to-end from database to display.

## Stat Cards Verification

### 1. Total Projects Card
- **Display:** `data.totalProjects` from `getProjectStatusAggregates()`
- **Database Query:** `db.projects.countDocuments({ integrator: {ObjectId} })`
- **Verification Steps:**
  1. Go to Dashboard
  2. Note "Total Projects" count
  3. Run: `db.projects.countDocuments({ integrator: ObjectId('<integrator_id>') })`
  4. **Check:** Both values should match exactly

### 2. Completed Card
- **Display:** `getAggregate(data?.statuses, PROJECT_STATUS.COMPLETED)`
- **Source:** Status aggregation groups all projects with status = 'Completed'
- **Database Query:** `db.projects.countDocuments({ integrator: {ObjectId}, status: 'Completed' })`
- **Verification Steps:**
  1. Note "Completed" count on dashboard
  2. Run: `db.projects.countDocuments({ integrator: ObjectId('<integrator_id>'), status: 'Completed' })`
  3. **Check:** Both values should match
  4. **Also check:** Sum of all status counts = Total Projects

### 3. In Progress Card
- **Display:** `getAggregate(data?.statuses, PROJECT_STATUS.PROGRESS)`
- **Source:** Status aggregation groups all projects with status = 'Progress'
- **Database Query:** `db.projects.countDocuments({ integrator: {ObjectId}, status: 'Progress' })`
- **Verification Steps:**
  1. Note "In Progress" count
  2. Run: `db.projects.countDocuments({ integrator: ObjectId('<integrator_id>'), status: 'Progress' })`
  3. **Check:** Both values should match

### 4. Pending Card
- **Display:** `getAggregate(data?.statuses, PROJECT_STATUS.PENDING)`
- **Source:** Status aggregation groups all projects with status = 'Pending'
- **Database Query:** `db.projects.countDocuments({ integrator: {ObjectId}, status: 'Pending' })`
- **Verification Steps:**
  1. Note "Pending" count
  2. Run: `db.projects.countDocuments({ integrator: ObjectId('<integrator_id>'), status: 'Pending' })`
  3. **Check:** Both values should match

### Summary Check - All Status Cards
```javascript
// Run this to verify all status counts sum correctly:
db.projects.aggregate([
  { $match: { integrator: ObjectId('<integrator_id>') } },
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: null,
      statuses: {
        $push: {
          status: '$_id',
          count: '$count'
        }
      },
      totalProjects: { $sum: '$count' }
    }
  }
])

// Expected output format:
{
  "_id": null,
  "statuses": [
    { "status": "Pending", "count": 5 },
    { "status": "Progress", "count": 3 },
    { "status": "Completed", "count": 2 }
  ],
  "totalProjects": 10
}

// Then verify:
// - Sum of all status counts = totalProjects
// - Dashboard cards show same values
```

---

## Recent Projects Table Verification

### Progress Calculation Check
Each project row shows: `completed/total` tasks and a progress percentage

**Formula:** `progress = (completedTasks / totalTasks) * 100`

**Verification for a specific project:**
```javascript
// Run this query:
db.projects.aggregate([
  { $match: { _id: ObjectId('<project_id>') } },
  {
    $lookup: {
      from: 'tasks',
      localField: '_id',
      foreignField: 'project',
      as: 'tasks'
    }
  },
  {
    $addFields: {
      totalTasks: { $size: '$tasks' },
      completedTasks: {
        $size: {
          $filter: {
            input: '$tasks',
            as: 'task',
            cond: { $eq: ['$$task.status', 'Completed'] }
          }
        }
      },
      progress: {
        $cond: [
          { $gt: ['$totalTasks', 0] },
          { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] },
          0
        ]
      }
    }
  },
  {
    $project: {
      name: 1,
      totalTasks: 1,
      completedTasks: 1,
      progress: { $round: ['$progress', 2] },
      status: 1
    }
  }
])

// Expected output:
{
  "_id": ObjectId(...),
  "name": "Project Name",
  "totalTasks": 5,
  "completedTasks": 2,
  "progress": 40,    // 2/5 * 100 = 40%
  "status": "Progress"
}

// Verify:
// - completedTasks matches DB tasks with status='Completed'
// - progress % matches expected calculation
// - Dashboard table shows same values
```

### Quick Verification Steps
1. Pick a project from the Recent Projects table
2. Note: completed/total tasks and progress %
3. Run aggregation query above with that project's ID
4. **Check:** All values match between dashboard and query result

---

## Weekly Chart Verification

### What the Weekly Summary Shows
- **X-axis:** Days of week (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
- **Y-axis (Left):** Number of projects created (aggregated by weekday)
- **Y-axis (Right):** Number of tasks created (aggregated by weekday)

**Important:** This chart groups by calendar DAY-OF-WEEK across all time, not by rolling weekly trends.
- Example: "Monday" = all projects created on any Monday (cumulative historical)
- Not: "Last 7 days" or "This week"

### Verification Query
```javascript
// Count projects by day of week:
db.projects.aggregate([
  { $match: { integrator: ObjectId('<integrator_id>') } },
  {
    $group: {
      _id: { $dayOfWeek: '$createdAt' },
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
])

// Expected: Array with _id 1-7 (Sunday=1, Saturday=7)
// Example:
[
  { "_id": 1, "count": 3 },  // Sunday
  { "_id": 2, "count": 5 },  // Monday
  { "_id": 3, "count": 4 },  // Tuesday
  ...
]

// Similarly for tasks:
db.tasks.aggregate([
  { $match: { project: { $in: [projectIds] } } },
  {
    $group: {
      _id: { $dayOfWeek: '$createdAt' },
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
])

// Verify:
// - Array indices 0-6 match chart bars (index 0=Sun, index 6=Sat)
// - Dashboard chart bars match query counts
```

---

## User Role Distribution Chart Verification

### What it Shows
Donut chart displaying count of users by role for the integrator

### Verification Query
```javascript
db.users.aggregate([
  { $match: { integrator: ObjectId('<integrator_id>') } },
  {
    $group: {
      _id: '$role',
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      role: '$_id',
      count: 1,
      _id: 0
    }
  }
])

// Expected output:
[
  { "role": "Admin", "count": 2 },
  { "role": "Manager", "count": 5 },
  { "role": "Developer", "count": 8 }
]

// Verify:
// - Donut chart labels match role names
// - Donut chart segments match counts
// - Sum of all counts shown in browser console logs
```

---

## End-to-End Consistency Check Checklist

- [ ] Total Projects card = sum of all status cards
- [ ] Completed card = projects with status='Completed'
- [ ] In Progress card = projects with status='Progress'
- [ ] Pending card = projects with status='Pending'
- [ ] Recent Projects table: Each project's progress % = (completedTasks / totalTasks) * 100
- [ ] Recent Projects table: Task count format matches "completed/total"
- [ ] Weekly Chart: Bars match $dayOfWeek aggregation results
- [ ] User Donut Chart: Segments and labels match role aggregation

---

## Debugging Console Logs

When navigating to the dashboard, check the browser console for diagnostic logs:

```
[Dashboard] Project status aggregates: { Pending: 5, Progress: 3, Completed: 2 }
[Dashboard] Total projects: 10
[Dashboard Charts] Weekly summary - Projects: [3,5,4,...], Tasks: [2,4,3,...]
```

These logs help verify that data is being fetched and aggregated correctly.

**To disable logs before production:**
1. Remove console.log statements from:
   - `/app/protected/integrator/dashboard/page.jsx` (lines with // DIAGNOSTIC)
   - Keep database logs as-is

---

## Common Issues & Debugging

### Issue: Dashboard shows 0 for all status cards
- **Check:** Is there aggregation data? Log should show empty object
- **Debug:** Run status aggregation query directly
- **Solution:** Ensure projects exist with correct status values

### Issue: Progress percentages incorrect
- **Check:** Are tasks being counted correctly?
- **Debug:** Verify task status values = 'Completed' (case-sensitive)
- **Solution:** Check if task statuses use different values

### Issue: Chart shows no bars
- **Check:** Is there historical data?
- **Debug:** Verify projects/tasks have createdAt dates
- **Solution:** Add test data or check data filtering

### Issue: Status card shows correct total but wrong breakdown
- **Check:** Status values in database
- **Debug:** Run: `db.projects.distinct('status')`
- **Solution:** Verify all status values match PROJECT_STATUS constants

---

## Notes
- All timestamps use ISO 8601 format
- All ObjectIds must be properly formatted
- Status values are case-sensitive (use 'Completed', not 'completed')
- Replace `<integrator_id>` and `<project_id>` with actual values
