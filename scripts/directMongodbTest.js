#!/usr/bin/env node

/**
 * Direct MongoDB Test - Check if address data exists in database
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/snatchi';

const testDirect = async () => {
  let client;
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║       DIRECT MONGODB TEST - ADDRESS FIELD CHECK             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📍 MongoDB: ${mongoUri}\n`);

    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Test 1: Check if address field exists in any user
    console.log('━'.repeat(60));
    console.log('TEST 1: Check a user with first_name "james"');
    console.log('━'.repeat(60));

    const jamesUser = await usersCollection.findOne(
      { first_name: 'james' },
      { projection: { _id: 1, first_name: 1, email: 1, address: 1 } }
    );

    if (jamesUser) {
      console.log('✅ Found user: james');
      console.log(`   ID: ${jamesUser._id}`);
      console.log(`   Email: ${jamesUser.email}`);
      console.log(`   Has address field: ${jamesUser.address ? '✅ YES' : '❌ NO'}`);
      
      if (jamesUser.address) {
        console.log(`\n   📍 Address Data:`);
        console.log(JSON.stringify(jamesUser.address, null, 6));
      }
    } else {
      console.log('❌ No user named "james" found');
    }

    // Test 2: Count how many users have address data
    console.log('\n' + '━'.repeat(60));
    console.log('TEST 2: How many users have address data?');
    console.log('━'.repeat(60));

    const usersWithAddress = await usersCollection.countDocuments({
      'address.addressLine1': { $exists: true, $ne: '' }
    });

    const totalUsers = await usersCollection.countDocuments({});

    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with address.addressLine1: ${usersWithAddress}`);

    // Test 3: Sample user with address
    console.log('\n' + '━'.repeat(60));
    console.log('TEST 3: Sample user with address data');
    console.log('━'.repeat(60));

    const sampleWithAddress = await usersCollection.findOne(
      { 'address.addressLine1': { $exists: true, $ne: '' } },
      { projection: { _id: 1, first_name: 1, last_name: 1, address: 1 } }
    );

    if (sampleWithAddress) {
      console.log(`✅ Found user with address: ${sampleWithAddress.first_name} ${sampleWithAddress.last_name}`);
      console.log(`\n   📍 Complete Address Object:`);
      console.log(JSON.stringify(sampleWithAddress.address, null, 6));
    } else {
      console.log('❌ No users with address data found in database');
    }

    // Test 4: Test the actual search query that the service uses
    console.log('\n' + '━'.repeat(60));
    console.log('TEST 4: Execute actual search query (with address projection)');
    console.log('━'.repeat(60));

    const searchQuery = {
      $or: [
        { first_name: { $regex: 'james', $options: 'i' } },
        { last_name: { $regex: 'james', $options: 'i' } },
        { email: { $regex: 'james', $options: 'i' } }
      ]
    };

    const searchResult = await usersCollection
      .find(searchQuery)
      .project({ password: 0 }) // exclude password, like .select('-password')
      .limit(1)
      .toArray();

    console.log(`Query: ${JSON.stringify(searchQuery, null, 2)}`);
    console.log(`\nResults found: ${searchResult.length}`);

    if (searchResult.length > 0) {
      const user = searchResult[0];
      console.log(`\n✅ First result:`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Has address: ${user.address ? '✅ YES' : '❌ NO'}`);
      
      if (user.address) {
        console.log(`\n   📍 Address in result:`);
        console.log(JSON.stringify(user.address, null, 6));
      } else {
        console.log(`\n   ❌ Address field is MISSING!`);
        console.log(`\n   Available fields: ${Object.keys(user).join(', ')}`);
      }
    }

    await client.close();
    console.log('\n🔌 Database connection closed\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
};

testDirect();
