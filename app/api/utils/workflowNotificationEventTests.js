/**
 * Workflow Notification Event Tests
 * 
 * Comprehensive test suite for Phase 2 - Event Wiring
 * 
 * Tests all notification events:
 * - Booking events (created, accepted, declined, approved)
 * - Payment events (completed, failed)
 * - Workflow events (ready-to-start, work-started, work-completed)
 * - Schedule events (updated, cancelled)
 */

const mongoose = require('mongoose');
const notificationEvents = require('../services/notificationEvents');
const notificationService = require('../services/notificationService');
const Notification = require('../models/notification');
const DeviceToken = require('../models/deviceToken');
const { mongoConnect } = require('@/utils/connectDb');
const { logger } = require('../utils/logger');

// Test utilities
const testConfig = {
  engineerId: new mongoose.Types.ObjectId(),
  payingIntegratorId: new mongoose.Types.ObjectId(),
  receivingIntegratorId: new mongoose.Types.ObjectId(),
  scheduleId: new mongoose.Types.ObjectId(),
  paymentId: new mongoose.Types.ObjectId(),
  projectName: 'Test Project A',
  siteLocation: '123 Main St, Boston MA',
  engineerName: 'John Smith'
};

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Helper: Assert notification exists
 */
const assertNotificationExists = async (recipientUserId, recipientIntegratorId, type, options = {}) => {
  const query = { type };
  
  if (recipientUserId) {
    query['recipient.userId'] = recipientUserId;
  } else if (recipientIntegratorId) {
    query['recipient.integratorId'] = recipientIntegratorId;
  }

  const notification = await Notification.findOne(query);

  if (!notification) {
    throw new Error(
      `Notification not found. Type: ${type}, UserId: ${recipientUserId}, IntegratorId: ${recipientIntegratorId}`
    );
  }

  // Verify fields if specified
  if (options.title && notification.title !== options.title) {
    throw new Error(`Title mismatch: expected "${options.title}", got "${notification.title}"`);
  }

  if (options.screen && notification.screen !== options.screen) {
    throw new Error(`Screen mismatch: expected "${options.screen}", got "${notification.screen}"`);
  }

  if (options.priority && notification.priority !== options.priority) {
    throw new Error(`Priority mismatch: expected "${options.priority}", got "${notification.priority}"`);
  }

  return notification;
};

/**
 * Helper: Count notifications by type
 */
const countNotificationsByType = async (type) => {
  return await Notification.countDocuments({ type });
};

/**
 * Helper: Clean up test data
 */
const cleanupNotifications = async () => {
  await Notification.deleteMany({});
  logger.info('Cleaned up notifications');
};

/**
 * Helper: Log test result
 */
const logTestResult = (testName, passed, error = null) => {
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
    if (error) {
      console.log(`   Error: ${error.message}`);
      testResults.errors.push({ test: testName, error: error.message });
    }
  }
};

// ─────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────

/**
 * TEST 1: Booking Created
 */
async function testBookingCreated() {
  const testName = 'bookingCreated sends to engineer';
  try {
    await cleanupNotifications();

    await notificationEvents.bookingCreated({
      scheduleId: testConfig.scheduleId,
      engineerId: testConfig.engineerId,
      projectName: testConfig.projectName,
      siteLocation: testConfig.siteLocation,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      payingIntegratorName: 'Paying Co',
      receivingIntegratorName: 'Receiving Co'
    });

    const notification = await assertNotificationExists(testConfig.engineerId, null, 'booking_created', {
      title: 'New Booking Request',
      screen: 'calendar',
      priority: 'high'
    });

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 2: Booking Accepted
 */
async function testBookingAccepted() {
  const testName = 'bookingAccepted sends to receiving integrator';
  try {
    await cleanupNotifications();

    await notificationEvents.bookingAccepted({
      scheduleId: testConfig.scheduleId,
      receivingIntegratorId: testConfig.receivingIntegratorId,
      engineerName: testConfig.engineerName,
      projectName: testConfig.projectName,
      siteLocation: testConfig.siteLocation
    });

    const notification = await assertNotificationExists(null, testConfig.receivingIntegratorId, 'engineer_accepted', {
      title: 'Engineer Accepted',
      screen: 'schedules',
      priority: 'high'
    });

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 3: Booking Declined
 */
async function testBookingDeclined() {
  const testName = 'bookingDeclined sends to paying integrator';
  try {
    await cleanupNotifications();

    await notificationEvents.bookingDeclined({
      scheduleId: testConfig.scheduleId,
      payingIntegratorId: testConfig.payingIntegratorId,
      engineerName: testConfig.engineerName,
      projectName: testConfig.projectName,
      declineReason: 'Not available'
    });

    const notification = await assertNotificationExists(null, testConfig.payingIntegratorId, 'engineer_declined', {
      title: 'Engineer Declined Booking',
      screen: 'schedules',
      priority: 'high'
    });

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 4: Booking Approved (2 recipients)
 */
async function testBookingApproved() {
  const testName = 'bookingApproved sends to engineer and paying integrator';
  try {
    await cleanupNotifications();

    await notificationEvents.bookingApproved({
      scheduleId: testConfig.scheduleId,
      engineerId: testConfig.engineerId,
      payingIntegratorId: testConfig.payingIntegratorId,
      projectName: testConfig.projectName,
      siteLocation: testConfig.siteLocation,
      startDate: new Date()
    });

    // Verify engineer notification
    const engineerNotification = await assertNotificationExists(
      testConfig.engineerId,
      null,
      'booking_approved',
      { priority: 'high' }
    );

    // Verify paying integrator notification
    const integratorNotification = await assertNotificationExists(
      null,
      testConfig.payingIntegratorId,
      'booking_approved',
      { priority: 'high' }
    );

    // Should have 2 notifications
    const count = await countNotificationsByType('booking_approved');
    if (count !== 2) {
      throw new Error(`Expected 2 notifications, got ${count}`);
    }

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 5: Payment Completed (3 recipients + idempotency)
 */
async function testPaymentCompleted() {
  const testName = 'paymentCompleted sends to 3 recipients';
  try {
    await cleanupNotifications();

    await notificationEvents.paymentCompleted({
      scheduleId: testConfig.scheduleId,
      paymentId: testConfig.paymentId,
      engineerId: testConfig.engineerId,
      payingIntegratorId: testConfig.payingIntegratorId,
      receivingIntegratorId: testConfig.receivingIntegratorId,
      projectName: testConfig.projectName,
      amountPaid: 5000
    });

    // Verify all 3 notifications exist
    const engineerNotification = await assertNotificationExists(testConfig.engineerId, null, 'payment_completed');
    const receivingNotification = await assertNotificationExists(
      null,
      testConfig.receivingIntegratorId,
      'payment_completed'
    );
    const payingNotification = await assertNotificationExists(
      null,
      testConfig.payingIntegratorId,
      'payment_completed'
    );

    const count = await countNotificationsByType('payment_completed');
    if (count !== 3) {
      throw new Error(`Expected 3 notifications, got ${count}`);
    }

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 6: Payment Completed - Idempotency
 */
async function testPaymentCompletedIdempotency() {
  const testName = 'paymentCompleted is idempotent (no duplicates on retry)';
  try {
    await cleanupNotifications();

    // Send once
    await notificationEvents.paymentCompleted({
      scheduleId: testConfig.scheduleId,
      paymentId: testConfig.paymentId,
      engineerId: testConfig.engineerId,
      payingIntegratorId: testConfig.payingIntegratorId,
      receivingIntegratorId: testConfig.receivingIntegratorId,
      projectName: testConfig.projectName,
      amountPaid: 5000
    });

    const countAfterFirst = await countNotificationsByType('payment_completed');

    // Send again (webhook retry)
    await notificationEvents.paymentCompleted({
      scheduleId: testConfig.scheduleId,
      paymentId: testConfig.paymentId,
      engineerId: testConfig.engineerId,
      payingIntegratorId: testConfig.payingIntegratorId,
      receivingIntegratorId: testConfig.receivingIntegratorId,
      projectName: testConfig.projectName,
      amountPaid: 5000
    });

    const countAfterSecond = await countNotificationsByType('payment_completed');

    if (countAfterFirst !== countAfterSecond) {
      throw new Error(
        `Idempotency failed: first send ${countAfterFirst}, second send ${countAfterSecond} (should be same)`
      );
    }

    if (countAfterSecond !== 3) {
      throw new Error(`Expected 3 notifications after retry, got ${countAfterSecond}`);
    }

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 7: Payment Failed
 */
async function testPaymentFailed() {
  const testName = 'paymentFailed sends to paying integrator';
  try {
    await cleanupNotifications();

    await notificationEvents.paymentFailed({
      scheduleId: testConfig.scheduleId,
      paymentId: testConfig.paymentId,
      payingIntegratorId: testConfig.payingIntegratorId,
      projectName: testConfig.projectName,
      failureReason: 'card_declined'
    });

    const notification = await assertNotificationExists(
      null,
      testConfig.payingIntegratorId,
      'payment_failed',
      { priority: 'high' }
    );

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 8: Ready to Start
 */
async function testReadyToStart() {
  const testName = 'readyToStart sends to engineer';
  try {
    await cleanupNotifications();

    await notificationEvents.readyToStart({
      scheduleId: testConfig.scheduleId,
      engineerId: testConfig.engineerId,
      projectName: testConfig.projectName,
      siteLocation: testConfig.siteLocation,
      startDate: new Date()
    });

    const notification = await assertNotificationExists(testConfig.engineerId, null, 'ready_to_start', {
      priority: 'high'
    });

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 9: Work Started (2 recipients)
 */
async function testWorkStarted() {
  const testName = 'workStarted sends to both integrators';
  try {
    await cleanupNotifications();

    await notificationEvents.workStarted({
      scheduleId: testConfig.scheduleId,
      payingIntegratorId: testConfig.payingIntegratorId,
      receivingIntegratorId: testConfig.receivingIntegratorId,
      projectName: testConfig.projectName,
      engineerName: testConfig.engineerName
    });

    const payingNotification = await assertNotificationExists(null, testConfig.payingIntegratorId, 'work_started');
    const receivingNotification = await assertNotificationExists(
      null,
      testConfig.receivingIntegratorId,
      'work_started'
    );

    const count = await countNotificationsByType('work_started');
    if (count !== 2) {
      throw new Error(`Expected 2 notifications, got ${count}`);
    }

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 10: Work Completed (2 recipients)
 */
async function testWorkCompleted() {
  const testName = 'workCompleted sends to both integrators';
  try {
    await cleanupNotifications();

    await notificationEvents.workCompleted({
      scheduleId: testConfig.scheduleId,
      payingIntegratorId: testConfig.payingIntegratorId,
      receivingIntegratorId: testConfig.receivingIntegratorId,
      projectName: testConfig.projectName,
      engineerName: testConfig.engineerName
    });

    const payingNotification = await assertNotificationExists(null, testConfig.payingIntegratorId, 'work_completed');
    const receivingNotification = await assertNotificationExists(
      null,
      testConfig.receivingIntegratorId,
      'work_completed'
    );

    const count = await countNotificationsByType('work_completed');
    if (count !== 2) {
      throw new Error(`Expected 2 notifications, got ${count}`);
    }

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 11: Schedule Updated (with significant fields)
 */
async function testScheduleUpdated() {
  const testName = 'scheduleUpdated sends to all parties when fields change';
  try {
    await cleanupNotifications();

    await notificationEvents.scheduleUpdated({
      scheduleId: testConfig.scheduleId,
      engineerId: testConfig.engineerId,
      payingIntegratorId: testConfig.payingIntegratorId,
      receivingIntegratorId: testConfig.receivingIntegratorId,
      projectName: testConfig.projectName,
      updatedFields: {
        startDate: new Date(),
        siteLocation: '456 Oak Ave'
      }
    });

    const count = await countNotificationsByType('schedule_updated');
    if (count !== 3) {
      throw new Error(`Expected 3 notifications, got ${count}`);
    }

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 12: Schedule Updated (no significant changes - skipped)
 */
async function testScheduleUpdatedNoChanges() {
  const testName = 'scheduleUpdated skips when no significant fields change';
  try {
    await cleanupNotifications();

    await notificationEvents.scheduleUpdated({
      scheduleId: testConfig.scheduleId,
      engineerId: testConfig.engineerId,
      payingIntegratorId: testConfig.payingIntegratorId,
      receivingIntegratorId: testConfig.receivingIntegratorId,
      projectName: testConfig.projectName,
      updatedFields: {
        updatedAt: new Date() // Metadata only, not significant
      }
    });

    const count = await countNotificationsByType('schedule_updated');
    if (count !== 0) {
      throw new Error(`Expected 0 notifications for non-significant changes, got ${count}`);
    }

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 13: Schedule Cancelled (3 recipients)
 */
async function testScheduleCancelled() {
  const testName = 'scheduleCancelled sends to engineer and both integrators';
  try {
    await cleanupNotifications();

    await notificationEvents.scheduleCancelled({
      scheduleId: testConfig.scheduleId,
      engineerId: testConfig.engineerId,
      payingIntegratorId: testConfig.payingIntegratorId,
      receivingIntegratorId: testConfig.receivingIntegratorId,
      projectName: testConfig.projectName,
      cancellationReason: 'Customer request'
    });

    const engineerNotification = await assertNotificationExists(testConfig.engineerId, null, 'schedule_cancelled');
    const payingNotification = await assertNotificationExists(
      null,
      testConfig.payingIntegratorId,
      'schedule_cancelled'
    );
    const receivingNotification = await assertNotificationExists(
      null,
      testConfig.receivingIntegratorId,
      'schedule_cancelled'
    );

    const count = await countNotificationsByType('schedule_cancelled');
    if (count !== 3) {
      throw new Error(`Expected 3 notifications, got ${count}`);
    }

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 14: Unread count updates
 */
async function testUnreadCount() {
  const testName = 'unread count updates after notifications';
  try {
    await cleanupNotifications();

    // Create 5 notifications
    for (let i = 0; i < 5; i++) {
      await notificationService.createNotification({
        recipient: { userId: testConfig.engineerId, type: 'user' },
        type: 'booking_created',
        title: `Notification ${i}`,
        body: `Body ${i}`,
        screen: 'calendar',
        priority: 'normal'
      });
    }

    const unreadCount = await notificationService.getUnreadCount(testConfig.engineerId);

    if (unreadCount !== 5) {
      throw new Error(`Expected 5 unread, got ${unreadCount}`);
    }

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

/**
 * TEST 15: Notification content verification
 */
async function testNotificationContent() {
  const testName = 'notification content matches payload';
  try {
    await cleanupNotifications();

    const projectName = 'Special Project';
    const siteLocation = '999 Test Lane';

    await notificationEvents.bookingCreated({
      scheduleId: testConfig.scheduleId,
      engineerId: testConfig.engineerId,
      projectName,
      siteLocation,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-02'),
      payingIntegratorName: 'Paying Co',
      receivingIntegratorName: 'Receiving Co'
    });

    const notification = await Notification.findOne({ type: 'booking_created' });

    if (!notification.body.includes(projectName)) {
      throw new Error(`Body should contain project name: "${notification.body}"`);
    }

    if (notification.screenParams.projectName !== projectName) {
      throw new Error(`screenParams.projectName should match: ${notification.screenParams.projectName}`);
    }

    if (notification.screenParams.siteLocation !== siteLocation) {
      throw new Error(`screenParams.siteLocation should match: ${notification.screenParams.siteLocation}`);
    }

    logTestResult(testName, true);
  } catch (error) {
    logTestResult(testName, false, error);
  }
}

// ─────────────────────────────────────────────────────────────
// RUN ALL TESTS
// ─────────────────────────────────────────────────────────────

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║    PHASE 2 - WORKFLOW EVENT NOTIFICATION TEST SUITE            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // Run all tests
    await testBookingCreated();
    await testBookingAccepted();
    await testBookingDeclined();
    await testBookingApproved();
    await testPaymentCompleted();
    await testPaymentCompletedIdempotency();
    await testPaymentFailed();
    await testReadyToStart();
    await testWorkStarted();
    await testWorkCompleted();
    await testScheduleUpdated();
    await testScheduleUpdatedNoChanges();
    await testScheduleCancelled();
    await testUnreadCount();
    await testNotificationContent();

    // Print summary
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log(`║  PASSED: ${testResults.passed}/15  |  FAILED: ${testResults.failed}/15${' '.repeat(
      20 - (testResults.passed + testResults.failed).toString().length
    )}║`);
    console.log('╚════════════════════════════════════════════════════════════════╝');

    if (testResults.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      testResults.errors.forEach((err) => {
        console.log(`  - ${err.test}: ${err.error}`);
      });
    }

    if (testResults.failed === 0) {
      console.log('\n✅ ALL TESTS PASSED!\n');
      process.exit(0);
    } else {
      console.log('\n✗ SOME TESTS FAILED\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = {
  runAllTests,
  testBookingCreated,
  testBookingAccepted,
  testBookingDeclined,
  testBookingApproved,
  testPaymentCompleted,
  testPaymentCompletedIdempotency,
  testPaymentFailed,
  testReadyToStart,
  testWorkStarted,
  testWorkCompleted,
  testScheduleUpdated,
  testScheduleUpdatedNoChanges,
  testScheduleCancelled,
  testUnreadCount,
  testNotificationContent
};

// Run if called directly
if (require.main === module) {
  mongoConnect().then(runAllTests).catch(console.error);
}
