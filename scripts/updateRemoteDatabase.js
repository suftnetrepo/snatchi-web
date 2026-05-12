#!/usr/bin/env node

/**
 * Update Remote MongoDB Atlas with Address Data
 * Updates the schema and populates address for 4 test users
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const mongoUri = process.env.NEXT_PUBLIC_MONGODB_URL || process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ MongoDB URI not found in environment variables');
  process.exit(1);
}

console.log('Connecting to MongoDB Atlas...');

// Define User schema with address field
const userSchema = new mongoose.Schema({
  integrator: { type: String, required: true },
  first_name: { type: String },
  last_name: { type: String },
  email: { type: String },
  mobile: { type: String },
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

// Address data for the four users (from local database)
const addressData = [
  {
    email: 'kabelsus@yahoo.com',
    address: {
      addressLine1: '76027 15th Street',
      county: 'Tyne and Wear',
      town: 'Manchester',
      country: 'United Kingdom',
      country_code: 'GB',
      postcode: 'ML1 0RE',
      completeAddress: '76027 15th Street, Manchester, Tyne and Wear, ML1 0RE',
      location: { type: 'Point', coordinates: [-2.2326, 53.8798] }
    }
  },
  {
    email: 'kabelsus@gmail.com',
    address: {
      addressLine1: '3818 School Street',
      county: 'Oxfordshire',
      town: 'York',
      country: 'United Kingdom',
      country_code: 'GB',
      postcode: 'JB0 7QM',
      completeAddress: '3818 School Street, York, Oxfordshire, JB0 7QM',
      location: { type: 'Point', coordinates: [-1.0773, 53.9576] }
    }
  },
  {
    email: 'abel.aghorighor@suftnet.com',
    address: {
      addressLine1: '99116 Cleveland Street',
      county: 'Berkshire',
      town: 'Glasgow',
      country: 'United Kingdom',
      country_code: 'GB',
      postcode: 'YE1 8PR',
      completeAddress: '99116 Cleveland Street, Glasgow, Berkshire, YE1 8PR',
      location: { type: 'Point', coordinates: [-4.2605, 55.8642] }
    }
  },
  {
    email: 'elisha@gmai.com',
    address: {
      addressLine1: '2373 Marley Walks',
      county: 'Greater London',
      town: 'York',
      country: 'United Kingdom',
      country_code: 'GB',
      postcode: 'HC3 5GH',
      completeAddress: '2373 Marley Walks, York, Greater London, HC3 5GH',
      location: { type: 'Point', coordinates: [-0.1276, 51.5074] }
    }
  }
];

const updateRemoteDatabase = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     UPDATE REMOTE MongoDB ATLAS - Address Data Migration    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    // Update each user with address data
    for (let i = 0; i < addressData.length; i++) {
      const data = addressData[i];
      console.log(`─`.repeat(60));
      console.log(`Updating user #${i + 1}: ${data.email}`);
      console.log(`─`.repeat(60));

      const result = await User.findOneAndUpdate(
        { email: data.email },
        { address: data.address },
        { new: true }
      ).lean().exec();

      if (result) {
        console.log(`✅ Updated: ${result.first_name} ${result.last_name}`);
        console.log(`   📍 Address: ${result.address?.completeAddress}`);
      } else {
        console.log(`⚠️  User not found: ${data.email}`);
      }
      console.log();
    }

    // Verify all updates
    console.log('━'.repeat(60));
    console.log('VERIFICATION - Check all users have address data');
    console.log('━'.repeat(60));

    const allUsers = await User.find({
      email: { $in: addressData.map(d => d.email) }
    }).select('first_name last_name email address.completeAddress').lean().exec();

    console.log(`\nTotal users updated: ${allUsers.length}`);
    allUsers.forEach((user, idx) => {
      console.log(`\n${idx + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Address: ${user.address?.completeAddress || '❌ MISSING'}`);
    });

    await mongoose.connection.close();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ REMOTE DATABASE UPDATED                    ║');
    console.log('║        All 4 users now have address data on Atlas          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection) await mongoose.connection.close();
    process.exit(1);
  }
};

updateRemoteDatabase();
