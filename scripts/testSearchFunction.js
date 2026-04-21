#!/usr/bin/env node

/**
 * Test Script: Search Users by Multiple Criteria
 * Tests the searchUsersByMultipleCriteria function with various test cases
 * Run with: node scripts/testSearchFunction.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/snatchi';
const integratorId = '679733468f42d980183f89bd';

// Search function logic (copied from app/api/services/user.js)
function buildUserSearchFilter(searchTerm) {
  const regexPattern = { $regex: searchTerm, $options: 'i' };
  
  return {
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
}

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
    const searchFilter = buildUserSearchFilter(searchTerm.trim());
    
    let query = searchFilter;
    
    if (intId) {
      query = {
        $and: [
          searchFilter,
          { integrator: intId }
        ]
      };
    }

    const usersCollection = mongoose.connection.db.collection('users');
    
    const [users, totalCount] = await Promise.all([
      usersCollection.find(query)
        .skip(skip)
        .limit(limit)
        .toArray(),
      usersCollection.countDocuments(query)
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

// Test cases
const testCases = [
  // Search by first name
  {
    name: 'Search by first name: "james"',
    params: { searchTerm: 'james', integratorId, page: 1, limit: 10 }
  },
  // Search by last name
  {
    name: 'Search by last name: "Hooks"',
    params: { searchTerm: 'Hooks', integratorId, page: 1, limit: 10 }
  },
  // Search by email
  {
    name: 'Search by email: "kabelsus"',
    params: { searchTerm: 'kabelsus', integratorId, page: 1, limit: 10 }
  },
  // Search by mobile
  {
    name: 'Search by mobile: "7627272727272"',
    params: { searchTerm: '7627272727272', integratorId, page: 1, limit: 10 }
  },
  // Search by town
  {
    name: 'Search by town: "Sheffield"',
    params: { searchTerm: 'Sheffield', integratorId, page: 1, limit: 10 }
  },
  // Search by county
  {
    name: 'Search by county: "Merseyside"',
    params: { searchTerm: 'Merseyside', integratorId, page: 1, limit: 10 }
  },
  // Search by postcode
  {
    name: 'Search by postcode: "FL3"',
    params: { searchTerm: 'FL3', integratorId, page: 1, limit: 10 }
  },
  // Search by address line
  {
    name: 'Search by address line: "Sycamore"',
    params: { searchTerm: 'Sycamore', integratorId, page: 1, limit: 10 }
  },
  // Search by country
  {
    name: 'Search by country: "United Kingdom"',
    params: { searchTerm: 'United Kingdom', integratorId, page: 1, limit: 10 }
  },
  // Search without integrator filter
  {
    name: 'Search by first name WITHOUT integrator filter: "bella"',
    params: { searchTerm: 'bella', page: 1, limit: 10 }
  },
  // Partial search
  {
    name: 'Partial search: "Agh" (should match "Aghori")',
    params: { searchTerm: 'Agh', integratorId, page: 1, limit: 10 }
  },
  // Case insensitive search
  {
    name: 'Case insensitive search: "ELISH" (should match "Elish")',
    params: { searchTerm: 'ELISH', integratorId, page: 1, limit: 10 }
  }
];

const runTests = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║       SEARCH USERS BY MULTIPLE CRITERIA - TEST SUITE        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📍 MongoDB: ${mongoUri}`);
    console.log(`🎯 Integrator ID: ${integratorId}\n`);

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    console.log('━'.repeat(60) + '\n');

    // Run each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`🧪 TEST ${i + 1}: ${testCase.name}`);
      console.log('─'.repeat(60));

      try {
        const result = await searchUsersByMultipleCriteria(testCase.params);

        console.log(`✅ Status: SUCCESS`);
        console.log(`📊 Total Results: ${result.totalCount}`);
        console.log(`📄 Returned: ${result.data.length}`);
        console.log(`📍 Page: ${result.page} | Limit: ${result.limit} | Total Pages: ${result.totalPages}`);

        if (result.data.length > 0) {
          console.log(`\n📋 Results:`);
          result.data.forEach((user, index) => {
            console.log(`\n   ${index + 1}. ${user.first_name} ${user.last_name}`);
            console.log(`      📧 Email: ${user.email}`);
            console.log(`      📱 Mobile: ${user.mobile}`);
            console.log(`      🎭 Role: ${user.role}`);
            if (user.address) {
              console.log(`      📍 Address: ${user.address.addressLine1}`);
              console.log(`      🏘️  ${user.address.town}, ${user.address.county}`);
              console.log(`      📮 Postcode: ${user.address.postcode}`);
            }
          });
        } else {
          console.log(`\n   ℹ️  No results found for this search term`);
        }
      } catch (error) {
        console.log(`❌ Status: FAILED`);
        console.log(`❌ Error: ${error.message}`);
      }

      console.log('\n' + '━'.repeat(60) + '\n');
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUITE COMPLETED                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
    console.error(error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

// Run the tests
runTests();
