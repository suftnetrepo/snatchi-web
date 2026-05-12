#!/usr/bin/env node

/**
 * Debug Script: Test Service Version of Search Function
 * Tests the actual searchUsersByMultipleCriteria from app/api/services/user.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/snatchi';
const integratorId = '679733468f42d980183f89bd';

// Import the actual service
const userModule = require('../app/api/services/user.js');

const debugSearch = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         SERVICE VERSION SEARCH - DEBUG TEST                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📍 MongoDB: ${mongoUri}`);
    console.log(`🎯 Testing searchUsersByMultipleCriteria service function\n`);

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Search by first name with integrator
    console.log('━'.repeat(60));
    console.log('TEST 1: Search by first name "james" WITH integrator filter');
    console.log('━'.repeat(60));
    
    const result1 = await userModule.searchUsersByMultipleCriteria({
      searchTerm: 'james',
      integratorId,
      page: 1,
      limit: 10
    });

    console.log(`✅ Results: ${result1.totalCount}`);
    if (result1.data.length > 0) {
      console.log('\n📋 First Result:');
      const user = result1.data[0];
      console.log(`Name: ${user.first_name} ${user.last_name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Has address field: ${user.address ? '✅ YES' : '❌ NO'}`);
      
      if (user.address) {
        console.log(`\n📍 Address Details:`);
        console.log(`  - addressLine1: ${user.address.addressLine1}`);
        console.log(`  - town: ${user.address.town}`);
        console.log(`  - county: ${user.address.county}`);
        console.log(`  - postcode: ${user.address.postcode}`);
        console.log(`  - country: ${user.address.country}`);
        console.log(`  - completeAddress: ${user.address.completeAddress}`);
      } else {
        console.log('\n❌ No address data in response');
        console.log(`User object keys: ${Object.keys(user).join(', ')}`);
      }
    }

    // Test 2: Search by country
    console.log('\n' + '━'.repeat(60));
    console.log('TEST 2: Search by country "United Kingdom" WITH integrator');
    console.log('━'.repeat(60));
    
    const result2 = await userModule.searchUsersByMultipleCriteria({
      searchTerm: 'United Kingdom',
      integratorId,
      page: 1,
      limit: 5
    });

    console.log(`✅ Results: ${result2.totalCount}`);
    if (result2.data.length > 0) {
      console.log(`\n📋 Found ${result2.data.length} users with "United Kingdom"`);
      result2.data.forEach((user, idx) => {
        console.log(`\n${idx + 1}. ${user.first_name} ${user.last_name}`);
        console.log(`   Address: ${user.address?.completeAddress || '❌ MISSING'}`);
      });
    }

    // Test 3: Direct query to verify data exists
    console.log('\n' + '━'.repeat(60));
    console.log('TEST 3: Direct MongoDB query to verify address data exists');
    console.log('━'.repeat(60));
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const directResult = await usersCollection.findOne(
      { first_name: 'james' },
      { projection: { address: 1, first_name: 1, email: 1 } }
    );
    
    console.log(`Direct query result:`);
    console.log(`  Has address in DB: ${directResult?.address ? '✅ YES' : '❌ NO'}`);
    if (directResult?.address) {
      console.log(`  Address data: ${JSON.stringify(directResult.address, null, 2)}`);
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

debugSearch();
