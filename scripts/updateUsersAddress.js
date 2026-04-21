#!/usr/bin/env node

/**
 * Update Script: Add UK Address to Specific Users
 * Updates the 4 specific users with UK-based addresses
 * Run with: node scripts/updateUsersAddress.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/snatchi';

// UK-specific data
const UK_COUNTIES = [
  'Greater London', 'Greater Manchester', 'West Yorkshire', 'Merseyside',
  'South Yorkshire', 'Tyne and Wear', 'West Midlands', 'Nottinghamshire',
  'Leicestershire', 'Staffordshire', 'Warwickshire', 'Oxfordshire',
  'Berkshire', 'Hampshire', 'Dorset', 'Devon', 'Cornwall'
];

const UK_CITIES = [
  'London', 'Manchester', 'Leeds', 'Liverpool', 'Sheffield', 'Birmingham',
  'Bristol', 'Newcastle', 'Nottingham', 'Leicester', 'Coventry', 'Edinburgh',
  'Glasgow', 'Cardiff', 'Belfast', 'Oxford', 'Cambridge', 'York'
];

/**
 * Generate random UK address data
 */
const generateRandomUKAddress = () => {
  const streetAddress = faker.location.streetAddress();
  const city = faker.helpers.arrayElement(UK_CITIES);
  const county = faker.helpers.arrayElement(UK_COUNTIES);
  const postcode = faker.location.zipCode('??# #??');

  return {
    addressLine1: streetAddress,
    county: county,
    town: city,
    country: 'United Kingdom',
    country_code: 'GB',
    postcode: postcode,
    completeAddress: `${streetAddress}, ${city}, ${county}, ${postcode}`,
    location: {
      type: 'Point',
      coordinates: [
        parseFloat(faker.location.longitude({ min: -8, max: 2 })),
        parseFloat(faker.location.latitude({ min: 50, max: 59 }))
      ]
    }
  };
};

const updateUsersAddress = async () => {
  try {
    console.log('🔄 Starting address update for specific users...\n');
    console.log(`📍 Connecting to MongoDB: ${mongoUri}\n`);

    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    console.log('✅ Connected to MongoDB\n');

    const usersCollection = db.collection('users');

    // Exact user IDs to update
    const userIds = [
      '679733468f42d980183f89c0',  // james kimoxing
      '679735d6e0a110edbc266745',  // Micheal Hooks
      '67973603e0a110edbc266747',  // bella Aghori
      '68132f34e0e7ea2c3839b91d'   // Elish Omosig
    ];

    // Find the exact users
    const users = await usersCollection
      .find({ _id: { $in: userIds } })
      .toArray();

    console.log(`📊 Found ${users.length} users to update\n`);

    if (users.length === 0) {
      console.log('❌ No users found with those IDs\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Display users before update
    console.log('👥 Users to update:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} (${user.email})`);
    });
    console.log();

    // Build update operations - one for each user
    const updateOperations = userIds.map(userId => ({
      updateOne: {
        filter: { _id: userId },
        update: { $set: { address: generateRandomUKAddress() } }
      }
    }));

    console.log(`⏳ Updating ${updateOperations.length} users with UK addresses...\n`);

    // Perform bulk write operation
    const bulkResult = await usersCollection.bulkWrite(updateOperations);

    console.log('✅ Update completed successfully!\n');
    console.log('📈 Results:');
    console.log(`   - Total users matched: ${bulkResult.matchedCount}`);
    console.log(`   - Total users modified: ${bulkResult.modifiedCount}\n`);

    // Verify updates and display addresses
    const updatedUsers = await usersCollection
      .find({ _id: { $in: userIds } })
      .toArray();

    console.log('✅ Updated Users with UK Addresses:\n');
    updatedUsers.forEach((user, index) => {
      const addr = user.address;
      if (addr) {
        console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
        console.log(`   📧 ${user.email}`);
        console.log(`   📍 ${addr.addressLine1}`);
        console.log(`   🏘️  ${addr.town}, ${addr.county}`);
        console.log(`   📮 ${addr.postcode}`);
        console.log(`   🌍 ${addr.completeAddress}\n`);
      }
    });

    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');

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

// Run update
updateUsersAddress();
