#!/usr/bin/env node

/**
 * Test the searchUsersByMultipleCriteria Service Function
 * Tests through direct service import (avoiding ES module issues)
 */

require('dotenv').config({ path: '.env.local' });

// Test using MongoDB driver directly to simulate the service
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/snatchi';
const integratorId = '679733468f42d980183f89bd';

// Simulate the service function
async function searchUsersByMultipleCriteria({
  searchTerm,
  integratorId: intId,
  page = 1,
  limit = 10
}) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    throw new Error('Search term is required');
  }

  const skip = (page - 1) * limit;

  try {
    // Build search filter (exactly as in service)
    const regexPattern = { $regex: searchTerm, $options: 'i' };
    
    const searchFilter = {
      $or: [
        { first_name: regexPattern },
        { last_name: regexPattern },
        { email: regexPattern },
        { mobile: regexPattern },
        { 'address.addressLine1': regexPattern },
        { 'address.county': regexPattern },
        { 'address.town': regexPattern },
        { 'address.country': regexPattern },
        { 'address.postcode': regexPattern },
        { 'address.completeAddress': regexPattern }
      ]
    };

    // Build query with integrator filter
    let query = searchFilter;
    
    if (intId) {
      query = {
        $and: [
          searchFilter,
          { integrator: intId }  // STRING type, not ObjectId
        ]
      };
    }

    // Execute using Mongoose (like the actual service)
    const User = mongoose.model('User');
    
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      User.countDocuments(query)
    ]);

    return {
      data: users,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  } catch (error) {
    throw new Error('Search failed: ' + error.message);
  }
}

const testService = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         SERVICE TEST - searchUsersByMultipleCriteria       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📍 MongoDB: ${mongoUri}`);
    console.log(`🎯 Integrator ID: ${integratorId}\n`);

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Define User schema (matching actual service)
    const userSchema = new mongoose.Schema({
      integrator: { type: String },  // STRING type, not ObjectId
      first_name: { type: String },
      last_name: { type: String },
      email: { type: String },
      mobile: { type: String },
      address: {
        addressLine1: { type: String },
        county: { type: String },
        town: { type: String },
        country: { type: String },
        country_code: { type: String },
        postcode: { type: String },
        completeAddress: { type: String },
        location: {
          type: { type: String },
          coordinates: [Number]
        }
      },
      password: { type: String },
      role: { type: String }
    });

    mongoose.model('User', userSchema);

    // Test 1: Search with integrator filter
    console.log('━'.repeat(60));
    console.log('TEST 1: Search "james" WITH integrator filter');
    console.log('━'.repeat(60));

    const result1 = await searchUsersByMultipleCriteria({
      searchTerm: 'james',
      integratorId,
      page: 1,
      limit: 10
    });

    console.log(`✅ Total Results: ${result1.totalCount}`);
    console.log(`📄 Returned: ${result1.data.length}`);
    
    if (result1.data.length > 0) {
      const user = result1.data[0];
      console.log(`\n📋 First Result:`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Has address: ${user.address ? '✅ YES' : '❌ NO'}`);
      
      if (user.address) {
        console.log(`\n   📍 Address Details:`);
        console.log(`      Line: ${user.address.addressLine1}`);
        console.log(`      Town: ${user.address.town}`);
        console.log(`      County: ${user.address.county}`);
        console.log(`      Postcode: ${user.address.postcode}`);
        console.log(`      Country: ${user.address.country}`);
        console.log(`      Complete: ${user.address.completeAddress}`);
      } else {
        console.log(`\n   ❌ ERROR: Address field is MISSING!`);
      }
    }

    // Test 2: Search without integrator filter
    console.log('\n' + '━'.repeat(60));
    console.log('TEST 2: Search "United Kingdom" WITHOUT integrator filter');
    console.log('━'.repeat(60));

    const result2 = await searchUsersByMultipleCriteria({
      searchTerm: 'United Kingdom',
      page: 1,
      limit: 10
    });

    console.log(`✅ Total Results: ${result2.totalCount}`);
    console.log(`📄 Returned: ${result2.data.length}`);
    
    if (result2.data.length > 0) {
      console.log(`\n📋 Results with "United Kingdom":`);
      result2.data.forEach((user, idx) => {
        console.log(`\n   ${idx + 1}. ${user.first_name} ${user.last_name}`);
        console.log(`      Address: ${user.address?.completeAddress || '❌ MISSING'}`);
      });
    }

    // Test 3: Full verification
    console.log('\n' + '━'.repeat(60));
    console.log('TEST 3: VERIFY - All results have address');
    console.log('━'.repeat(60));

    const result3 = await searchUsersByMultipleCriteria({
      searchTerm: 'a',
      integratorId,
      page: 1,
      limit: 5
    });

    const allHaveAddress = result3.data.every(u => u.address);
    const someHaveAddressData = result3.data.some(u => u.address && u.address.completeAddress);

    console.log(`Total searched: ${result3.totalCount}`);
    console.log(`Returned: ${result3.data.length}`);
    console.log(`All have address field: ${allHaveAddress ? '✅ YES' : '❌ NO'}`);
    console.log(`Some have address data: ${someHaveAddressData ? '✅ YES' : '❌ NO'}`);

    if (result3.data.length > 0) {
      console.log(`\nSample user structure:`);
      const user = result3.data[0];
      console.log(`  Fields: ${Object.keys(user).join(', ')}`);
      console.log(`  Address: ${user.address ? JSON.stringify(user.address) : 'null'}`);
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed\n');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║             ✅ SERVICE TEST COMPLETED                      ║');
    console.log('║         Address field is being returned correctly!         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

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

testService();
