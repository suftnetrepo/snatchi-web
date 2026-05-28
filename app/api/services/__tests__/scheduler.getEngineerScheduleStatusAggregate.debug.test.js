/**
 * Debug test for getEngineerScheduleStatusAggregate with real database
 * 
 * Run with:
 *   npx jest app/api/services/__tests__/scheduler.getEngineerScheduleStatusAggregate.debug.test.js --forceExit --detectOpenHandles
 * 
 * This test uses the REAL database connection and real Scheduler collection
 * to diagnose why aggregate returns zeros when schedules exist.
 */

import { mongoConnect } from '@/utils/connectDb';
import Scheduler from '../../models/scheduler';
import User from '../../models/user';
import { getEngineerScheduleStatusAggregate, getEngineerSchedulesByDateAndStatus } from '../scheduler';

// Test engineer ID from the issue
const TEST_ENGINEER_ID = '679735d6e0a110edbc266745';

describe('getEngineerScheduleStatusAggregate – DEBUG with real database', () => {
  
  beforeAll(async () => {
    await mongoConnect();
  });

  afterAll(async () => {
    // Clean up if needed
  });

  test('DEBUG: Compare working vs broken queries', async () => {
    console.log('\n\n========== DEBUG: Scheduler Query Investigation ==========\n');

    // Step 1: Check if engineer exists
    console.log('Step 1: Checking if engineer exists...');
    const engineer = await User.findById(TEST_ENGINEER_ID).select('_id integrator first_name last_name email');
    console.log('Engineer found:', engineer ? {
      id: engineer._id,
      integrator: engineer.integrator,
      name: `${engineer.first_name} ${engineer.last_name}`
    } : 'NOT FOUND');

    // Step 2: Direct find() query (what getEngineerSchedulesByDateAndStatus uses)
    console.log('\nStep 2: Direct find() query with engineer field...');
    const findResult = await Scheduler.find({ engineer: TEST_ENGINEER_ID })
      .select('_id engineer status startDate endDate');
    console.log(`find() returned ${findResult.length} schedules`);
    if (findResult.length > 0) {
      console.log('Sample schedules from find():');
      findResult.slice(0, 3).forEach(s => {
        console.log(`  - ${s._id}: status=${s.status}, engineer=${s.engineer}`);
      });
    }

    // Step 3: Aggregate query
    console.log('\nStep 3: Aggregate query with $group...');
    const aggregateResult = await Scheduler.aggregate([
      { $match: { engineer: TEST_ENGINEER_ID } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log(`aggregate returned ${aggregateResult.length} status groups`);
    if (aggregateResult.length > 0) {
      console.log('Status groups from aggregate:');
      aggregateResult.forEach(g => {
        console.log(`  - ${g._id}: ${g.count}`);
      });
    }

    // Step 4: Test the service function with no filters
    console.log('\nStep 4: Testing getEngineerScheduleStatusAggregate with no filters...');
    try {
      const aggregateData = await getEngineerScheduleStatusAggregate({
        engineerId: TEST_ENGINEER_ID
      });
      console.log('Service function returned:', JSON.stringify(aggregateData, null, 2));
    } catch (err) {
      console.error('Service function error:', err.message);
    }

    // Step 5: Test getEngineerSchedulesByDateAndStatus for comparison
    console.log('\nStep 5: Testing getEngineerSchedulesByDateAndStatus for comparison...');
    try {
      const scheduleList = await getEngineerSchedulesByDateAndStatus({
        engineerId: TEST_ENGINEER_ID
      });
      console.log(`List function returned ${scheduleList.data.length} schedules`);
      if (scheduleList.data.length > 0) {
        console.log('Sample schedules from list function:');
        scheduleList.data.slice(0, 3).forEach(s => {
          console.log(`  - ${s._id}: status=${s.status}`);
        });
      }
    } catch (err) {
      console.error('List function error:', err.message);
    }

    console.log('\n========== DEBUG COMPLETE ==========\n');

    // Assertion to make test pass
    expect(true).toBe(true);
  });

  test('DEBUG: Test with different engineer ID formats', async () => {
    console.log('\n\n========== DEBUG: ObjectId Format Testing ==========\n');

    const engineerId = TEST_ENGINEER_ID;

    // Test 1: String format
    console.log('Test 1: String format');
    const stringResult = await Scheduler.find({ engineer: engineerId }).countDocuments();
    console.log(`find({ engineer: '${engineerId}' }) => ${stringResult} documents`);

    // Test 2: ObjectId format
    console.log('\nTest 2: ObjectId format');
    const ObjectId = require('mongoose').Types.ObjectId;
    const objIdResult = await Scheduler.find({ engineer: new ObjectId(engineerId) }).countDocuments();
    console.log(`find({ engineer: ObjectId('${engineerId}') }) => ${objIdResult} documents`);

    console.log('\n========== END FORMAT TESTING ==========\n');

    expect(true).toBe(true);
  });
});
