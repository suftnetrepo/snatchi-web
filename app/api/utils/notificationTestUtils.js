/**
 * Notification System - Foundation Test Utilities
 * Use these to test the notification infrastructure
 */

const Notification = require('../models/notification');
const DeviceToken = require('../models/deviceToken');
const notificationService = require('../services/notificationService');
const { NOTIFICATION_TYPES, NOTIFICATION_SCREENS } = require('../constants/notificationTypes');

/**
 * Test: Create a notification
 */
async function testCreateNotification(userId) {
  console.log('\n=== TEST: Create Notification ===');
  try {
    const notification = await notificationService.createNotification({
      recipient: { userId, type: 'user' },
      type: NOTIFICATION_TYPES.BOOKING_CREATED,
      title: 'Test: New Booking',
      body: 'This is a test notification',
      screen: NOTIFICATION_SCREENS.CALENDAR,
      screenParams: { scheduleId: '507f1f77bcf86cd799439011' },
      relatedTo: { schedule: '507f1f77bcf86cd799439011' },
      priority: 'high'
    });

    console.log('✓ Notification created:', notification._id);
    console.log('  Title:', notification.title);
    console.log('  Status:', notification.status);
    return notification;
  } catch (error) {
    console.error('✗ Failed:', error.message);
    throw error;
  }
}

/**
 * Test: Get unread count
 */
async function testGetUnreadCount(userId) {
  console.log('\n=== TEST: Get Unread Count ===');
  try {
    const count = await notificationService.getUnreadCount(userId);
    console.log('✓ Unread count:', count);
    return count;
  } catch (error) {
    console.error('✗ Failed:', error.message);
    throw error;
  }
}

/**
 * Test: Get notifications with pagination
 */
async function testGetNotifications(userId) {
  console.log('\n=== TEST: Get Notifications ===');
  try {
    const result = await notificationService.getNotifications(userId, {
      limit: 10,
      offset: 0,
      unreadOnly: false
    });

    console.log('✓ Notifications retrieved:', result.notifications.length);
    console.log('  Total:', result.total);
    console.log('  Unread:', result.unread);
    return result;
  } catch (error) {
    console.error('✗ Failed:', error.message);
    throw error;
  }
}

/**
 * Test: Mark notification as read
 */
async function testMarkAsRead(userId, notificationId) {
  console.log('\n=== TEST: Mark as Read ===');
  try {
    const notification = await notificationService.markAsRead(notificationId, userId);
    console.log('✓ Marked as read:', notificationId);
    console.log('  Read:', notification.status.read);
    console.log('  ReadAt:', notification.readAt);
    return notification;
  } catch (error) {
    console.error('✗ Failed:', error.message);
    throw error;
  }
}

/**
 * Test: Register device token
 */
async function testRegisterDeviceToken(userId, token) {
  console.log('\n=== TEST: Register Device Token ===');
  try {
    const deviceToken = new DeviceToken({
      user: userId,
      token,
      device: {
        type: 'web',
        platform: 'Chrome',
        appVersion: '1.0.0',
        osVersion: '10.0'
      },
      status: {
        active: true,
        failCount: 0,
        lastUsed: new Date()
      },
      capabilities: {
        supportsPush: true,
        supportsBadge: false,
        supportsSound: true,
        supportsActionButtons: false
      }
    });

    const savedToken = await deviceToken.save();
    console.log('✓ Device token registered:', savedToken._id);
    console.log('  Type:', savedToken.device.type);
    console.log('  Platform:', savedToken.device.platform);
    console.log('  Active:', savedToken.status.active);
    return savedToken;
  } catch (error) {
    console.error('✗ Failed:', error.message);
    throw error;
  }
}

/**
 * Test: Permission check - unauthorized access
 */
async function testPermissionCheck(userId1, userId2, notificationId) {
  console.log('\n=== TEST: Permission Check ===');
  try {
    // Should fail - different user
    await notificationService.markAsRead(notificationId, userId2);
    console.error('✗ SECURITY ISSUE: Should have been denied!');
    return false;
  } catch (error) {
    if (error.message === 'Unauthorized') {
      console.log('✓ Correctly denied unauthorized access');
      return true;
    }
    console.error('✗ Unexpected error:', error.message);
    throw error;
  }
}

/**
 * Test: Multiple device tokens per user
 */
async function testMultipleDeviceTokens(userId) {
  console.log('\n=== TEST: Multiple Device Tokens ===');
  try {
    // Create first token (web)
    const token1 = new DeviceToken({
      user: userId,
      token: 'fcm_token_web_' + Date.now(),
      device: { type: 'web', platform: 'Chrome' },
      status: { active: true, lastUsed: new Date() }
    });
    await token1.save();
    console.log('✓ Created web token:', token1._id);

    // Create second token (mobile)
    const token2 = new DeviceToken({
      user: userId,
      token: 'fcm_token_mobile_' + Date.now(),
      device: { type: 'mobile_ios', platform: 'iOS', osVersion: '14.0' },
      status: { active: true, lastUsed: new Date() }
    });
    await token2.save();
    console.log('✓ Created mobile token:', token2._id);

    // Verify both exist
    const tokens = await DeviceToken.find({ user: userId });
    console.log('✓ Total tokens for user:', tokens.length);
    tokens.forEach((t) => console.log('  -', t.device.type, t.device.platform));

    return tokens;
  } catch (error) {
    console.error('✗ Failed:', error.message);
    throw error;
  }
}

/**
 * Test: Token failure tracking
 */
async function testTokenFailureTracking() {
  console.log('\n=== TEST: Token Failure Tracking ===');
  try {
    const userId = '507f1f77bcf86cd799439012';
    const token = new DeviceToken({
      user: userId,
      token: 'fcm_token_test_' + Date.now(),
      device: { type: 'web', platform: 'Chrome' },
      status: { active: true, failCount: 0 }
    });
    await token.save();
    console.log('✓ Created token with failCount: 0');

    // Record first failure
    await token.recordFailure();
    console.log('✓ After failure 1: failCount =', token.status.failCount);

    // Record second failure
    await token.recordFailure();
    console.log('✓ After failure 2: failCount =', token.status.failCount);

    // Record third failure - should deactivate
    await token.recordFailure();
    console.log('✓ After failure 3: failCount =', token.status.failCount);
    console.log('  Active:', token.status.active);
    console.log('  DeactivatedReason:', token.status.deactivatedReason);

    if (!token.status.active && token.status.deactivatedReason === 'too_many_failures') {
      console.log('✓ Token correctly deactivated after 3 failures');
      return true;
    } else {
      console.error('✗ Token should be deactivated!');
      return false;
    }
  } catch (error) {
    console.error('✗ Failed:', error.message);
    throw error;
  }
}

/**
 * Test: Token reactivation
 */
async function testTokenReactivation() {
  console.log('\n=== TEST: Token Reactivation ===');
  try {
    const userId = '507f1f77bcf86cd799439013';
    const token = new DeviceToken({
      user: userId,
      token: 'fcm_token_reactivate_' + Date.now(),
      device: { type: 'web', platform: 'Chrome' },
      status: {
        active: false,
        failCount: 3,
        deactivatedAt: new Date(),
        deactivatedReason: 'too_many_failures'
      }
    });
    await token.save();
    console.log('✓ Created deactivated token');

    // Reactivate
    await token.reactivate();
    console.log('✓ Token reactivated');
    console.log('  Active:', token.status.active);
    console.log('  FailCount:', token.status.failCount);
    console.log('  DeactivatedAt:', token.status.deactivatedAt);

    if (token.status.active && token.status.failCount === 0) {
      console.log('✓ Token correctly reactivated');
      return true;
    } else {
      console.error('✗ Token should be active with failCount=0!');
      return false;
    }
  } catch (error) {
    console.error('✗ Failed:', error.message);
    throw error;
  }
}

/**
 * Full integration test suite
 */
async function runFullTestSuite() {
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         NOTIFICATION FOUNDATION - TEST SUITE                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const testUserId = '507f1f77bcf86cd799439011';
  const testUserId2 = '507f1f77bcf86cd799439014';

  try {
    // 1. Create notification
    const notification = await testCreateNotification(testUserId);

    // 2. Get unread count
    await testGetUnreadCount(testUserId);

    // 3. Get notifications
    await testGetNotifications(testUserId);

    // 4. Mark as read
    await testMarkAsRead(testUserId, notification._id);

    // 5. Permission check
    await testPermissionCheck(testUserId, testUserId2, notification._id);

    // 6. Register device token
    await testRegisterDeviceToken(testUserId, 'fcm_token_test_' + Date.now());

    // 7. Multiple device tokens
    await testMultipleDeviceTokens(testUserId);

    // 8. Token failure tracking
    await testTokenFailureTracking();

    // 9. Token reactivation
    await testTokenReactivation();

    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✓ ALL TESTS PASSED                          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');
  } catch (error) {
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✗ TEST SUITE FAILED                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\nError:', error.message);
    process.exit(1);
  }
}

module.exports = {
  testCreateNotification,
  testGetUnreadCount,
  testGetNotifications,
  testMarkAsRead,
  testRegisterDeviceToken,
  testPermissionCheck,
  testMultipleDeviceTokens,
  testTokenFailureTracking,
  testTokenReactivation,
  runFullTestSuite
};

// Run if called directly
if (require.main === module) {
  const { mongoConnect } = require('@/utils/connectDb');
  mongoConnect().then(runFullTestSuite).catch(console.error);
}
