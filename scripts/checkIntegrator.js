#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/snatchi';

(async () => {
  let client;
  try {
    // Test with raw MongoDB
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ first_name: 'james' });
    
    console.log('\n📊 Integrator Field Analysis:');
    console.log('─'.repeat(40));
    console.log('Type:', typeof user.integrator);
    console.log('Value:', user.integrator);
    console.log('Constructor:', user.integrator?.constructor?.name);
    
    // Test search
    const found = await usersCollection.find({ integrator: user.integrator }).toArray();
    console.log('\nDirect match query results:', found.length);
    
    // Test with string conversion
    const foundAsString = await usersCollection.find({ integrator: String(user.integrator) }).toArray();
    console.log('String conversion match:', foundAsString.length);
    
    // Check the test integrator ID
    const testIntegratorId = '679733468f42d980183f89bd';
    const foundWithTestId = await usersCollection.find({ integrator: testIntegratorId }).toArray();
    console.log(`Search with test ID "${testIntegratorId}":`, foundWithTestId.length);
    
    if (foundWithTestId.length > 0) {
      console.log('  ✅ Test ID matches user integrator');
    } else {
      console.log('  ❌ Test ID does NOT match');
    }
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
    if (client) await client.close();
    process.exit(1);
  }
})();
