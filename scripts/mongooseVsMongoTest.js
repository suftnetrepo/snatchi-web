#!/usr/bin/env node

/**
 * Mongoose vs MongoDB Comparison Test
 * Tests the same search with both Mongoose and raw MongoDB
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/snatchi';

// Define User model inline to avoid import issues
const userSchema = new mongoose.Schema({
  integrator: { type: mongoose.Schema.Types.ObjectId, ref: 'Integrator', required: true },
  first_name: { type: String, trim: true, required: true },
  last_name: { type: String, trim: true, required: true },
  email: { type: String, unique: true, lowercase: true },
  mobile: { type: String, trim: true },
  address: {
    addressLine1: { type: String, default: '' },
    county: { type: String, default: '' },
    town: { type: String, default: '' },
    country: { type: String, default: '' },
    country_code: { type: String, default: '' },
    postcode: { type: String, default: '' },
    completeAddress: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    }
  },
  password: { type: String },
  role: { type: String }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const compare = async () => {
  let mongoClient;
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     MONGOOSE vs MONGODB COMPARISON TEST                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📍 MongoDB: ${mongoUri}\n`);

    // Test 1: Mongoose Query
    console.log('━'.repeat(60));
    console.log('TEST 1: MONGOOSE QUERY');
    console.log('━'.repeat(60));

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB via Mongoose\n');

    const searchFilter = {
      $or: [
        { first_name: { $regex: 'james', $options: 'i' } },
        { last_name: { $regex: 'james', $options: 'i' } },
        { email: { $regex: 'james', $options: 'i' } },
        { mobile: { $regex: 'james', $options: 'i' } },
        { 'address.addressLine1': { $regex: 'james', $options: 'i' } },
        { 'address.county': { $regex: 'james', $options: 'i' } },
        { 'address.town': { $regex: 'james', $options: 'i' } },
        { 'address.country': { $regex: 'james', $options: 'i' } },
        { 'address.postcode': { $regex: 'james', $options: 'i' } },
        { 'address.completeAddress': { $regex: 'james', $options: 'i' } }
      ]
    };

    console.log('Executing Mongoose Query...\n');

    const mongooseResult = await User.find(searchFilter)
      .select('-password')
      .limit(1)
      .lean()
      .exec();

    if (mongooseResult.length > 0) {
      const user = mongooseResult[0];
      console.log(`✅ Mongoose Result:`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Has address: ${user.address ? '✅ YES' : '❌ NO'}`);
      
      if (user.address) {
        console.log(`   Address: ${user.address.completeAddress}`);
        console.log(`\n   Full Address Object:`);
        console.log(JSON.stringify(user.address, null, 6));
      } else {
        console.log(`   ❌ Address field is MISSING in Mongoose result!`);
      }
    } else {
      console.log('❌ No results found');
    }

    // Test 2: Direct MongoDB Query
    console.log('\n' + '━'.repeat(60));
    console.log('TEST 2: DIRECT MONGODB QUERY (Same query)');
    console.log('━'.repeat(60));

    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB directly\n');

    const db = mongoClient.db();
    const usersCollection = db.collection('users');

    const mongoResult = await usersCollection
      .find(searchFilter)
      .project({ password: 0 })
      .limit(1)
      .toArray();

    if (mongoResult.length > 0) {
      const user = mongoResult[0];
      console.log(`✅ MongoDB Result:`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Has address: ${user.address ? '✅ YES' : '❌ NO'}`);
      
      if (user.address) {
        console.log(`   Address: ${user.address.completeAddress}`);
        console.log(`\n   Full Address Object:`);
        console.log(JSON.stringify(user.address, null, 6));
      } else {
        console.log(`   ❌ Address field is MISSING in MongoDB result!`);
      }
    } else {
      console.log('❌ No results found');
    }

    // Test 3: Compare the integrator field type
    console.log('\n' + '━'.repeat(60));
    console.log('TEST 3: INTEGRATOR FIELD TYPE CHECK');
    console.log('━'.repeat(60));

    const sampleUser = await usersCollection.findOne({}, { projection: { integrator: 1, _id: 0 } });
    
    console.log(`Integrator field type in DB: ${typeof sampleUser.integrator}`);
    console.log(`Integrator value: ${sampleUser.integrator}`);
    console.log(`Is ObjectId: ${sampleUser.integrator?.constructor?.name || 'No'}`);

    // Test 4: Check if address is being excluded anywhere
    console.log('\n' + '━'.repeat(60));
    console.log('TEST 4: CHECK SCHEMA FIELD SETTINGS');
    console.log('━'.repeat(60));

    const userDoc = await User.findOne({}).lean();
    console.log(`Fields in Mongoose result: ${Object.keys(userDoc).join(', ')}`);

    const rawDoc = await usersCollection.findOne({});
    console.log(`Fields in raw MongoDB result: ${Object.keys(rawDoc).join(', ')}`);

    console.log(`\nFields in Mongoose that are NOT in MongoDB: ${
      Object.keys(userDoc).filter(k => !Object.keys(rawDoc).includes(k)).join(', ') || 'None'
    }`);

    console.log(`Fields in MongoDB that are NOT in Mongoose: ${
      Object.keys(rawDoc).filter(k => !Object.keys(userDoc).includes(k)).join(', ') || 'None'
    }`);

    await mongoose.connection.close();
    await mongoClient.close();
    console.log('\n🔌 All connections closed\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    if (mongoClient) {
      await mongoClient.close();
    }
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

compare();
