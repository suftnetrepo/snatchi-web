#!/usr/bin/env node
/**
 * Final Verification Test - After Dev Server Restart
 * Verify address field is now returned from the service
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/snatchi';
const integratorId = '679733468f42d980183f89bd';

(async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  FINAL VERIFICATION - Address Field After Dev Server Restart ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get the actual User model from the model file
    // This will trigger a fresh reload with the new schema
    delete require.cache[require.resolve('../app/api/models/user.js')];
    const User = require('../app/api/models/user.js').default;

    console.log('Executing search query...\n');

    // Test 1: Direct MongoDB query through Mongoose
    const result1 = await User.find({ first_name: 'james' })
      .select('-password')
      .lean()
      .exec();

    if (result1.length > 0) {
      const user = result1[0];
      console.log('━'.repeat(60));
      console.log('RESULT FROM USER MODEL:');
      console.log('━'.repeat(60));
      console.log('Name:', user.first_name, user.last_name);
      console.log('Email:', user.email);
      console.log('Integrator Type:', typeof user.integrator);
      console.log('Integrator Value:', user.integrator);
      console.log('Has address field:', user.address ? '✅ YES' : '❌ NO');
      
      if (user.address) {
        console.log('\n📍 Address Details:');
        console.log('  Line:', user.address.addressLine1);
        console.log('  Town:', user.address.town);
        console.log('  County:', user.address.county);
        console.log('  Postcode:', user.address.postcode);
        console.log('  Country:', user.address.country);
        console.log('  Complete:', user.address.completeAddress);
      } else {
        console.log('\n❌ Address is MISSING from result!');
        console.log('Fields returned:', Object.keys(user).join(', '));
      }
    }

    // Test 2: With integrator filter
    console.log('\n' + '━'.repeat(60));
    console.log('WITH INTEGRATOR FILTER:');
    console.log('━'.repeat(60));

    const result2 = await User.find({
      $and: [
        { first_name: { $regex: 'james', $options: 'i' } },
        { integrator: integratorId }
      ]
    })
      .select('-password')
      .lean()
      .exec();

    console.log(`Results found: ${result2.length}`);
    if (result2.length > 0) {
      const user = result2[0];
      console.log(`Name: ${user.first_name} ${user.last_name}`);
      console.log(`Has address: ${user.address ? '✅ YES' : '❌ NO'}`);
      if (user.address) {
        console.log(`Address: ${user.address.completeAddress}`);
      }
    }

    await mongoose.connection.close();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    if (result1[0]?.address) {
      console.log('║              ✅ FIXED - Address field is returned!          ║');
    } else {
      console.log('║         ❌ ISSUE REMAINS - Address still missing             ║');
    }
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection) await mongoose.connection.close();
    process.exit(1);
  }
})();
