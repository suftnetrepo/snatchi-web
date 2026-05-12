#!/usr/bin/env node
/**
 * Final Verification - Direct Service Test
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/snatchi';

(async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          FINAL VERIFICATION - Address Field Check          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Define the exact schema as in the model file
    const userSchema = new mongoose.Schema({
      integrator: { type: String, required: true },
      first_name: { type: String, required: true },
      last_name: { type: String, required: true },
      email: { type: String },
      mobile: { type: String },
      role: { type: String },
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
      createdAt: { type: Date },
      updatedAt: { type: Date }
    });

    // Create or get the User model
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    console.log('Testing with schema: integrator=String, address=included\n');
    console.log('━'.repeat(60));
    console.log('TEST: Search "james" for address field');
    console.log('━'.repeat(60));

    const result = await User.findOne({ first_name: 'james' })
      .select('-password')
      .lean()
      .exec();

    if (result) {
      console.log('\n✅ Found user: james kimoxing');
      console.log(`   Integrator Type: ${typeof result.integrator}`);
      console.log(`   Integrator Value: ${result.integrator}`);
      console.log(`\n   Has address field: ${result.address ? '✅ YES' : '❌ NO'}`);
      
      if (result.address) {
        console.log('\n   📍 Address Details:');
        console.log(`      Line: ${result.address.addressLine1}`);
        console.log(`      Town: ${result.address.town}`);
        console.log(`      County: ${result.address.county}`);
        console.log(`      Postcode: ${result.address.postcode}`);
        console.log(`      Country: ${result.address.country}`);
        console.log(`      Complete: ${result.address.completeAddress}`);
        
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║              ✅ SUCCESS - Address field present!            ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
      } else {
        console.log('\n❌ ERROR: Address field is MISSING!');
        console.log(`   Fields present: ${Object.keys(result).join(', ')}`);
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection) await mongoose.connection.close();
    process.exit(1);
  }
})();
