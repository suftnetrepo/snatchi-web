#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const args = new Set(process.argv.slice(2));
const targetArg = process.argv.find((argument) => argument.startsWith('--target='));
const target = targetArg?.split('=')[1];
const apply = args.has('--apply');
const liveConfirmed = args.has('--confirm-live=PROVISION_ADMIN');

const fail = (message) => {
  console.error(`Error: ${message}`);
  process.exit(1);
};

if (!['test', 'live'].includes(target)) {
  fail('Use --target=test or --target=live. No database is selected by default.');
}

if (target === 'live' && apply && !liveConfirmed) {
  fail('Live writes require --confirm-live=PROVISION_ADMIN in addition to --apply.');
}

const uriVariable = target === 'live' ? 'MONGODB_LIVE_URL' : 'MONGODB_TEST_URL';
const mongoUrl = process.env[uriVariable];
const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
const firstName = String(process.env.ADMIN_FIRST_NAME || '').trim();
const lastName = String(process.env.ADMIN_LAST_NAME || '').trim();
const mobile = String(process.env.ADMIN_MOBILE || '').trim();

if (!mongoUrl) fail(`${uriVariable} is required.`);
if (!/^\S+@\S+\.\S+$/.test(email)) fail('ADMIN_EMAIL must be a valid email address.');
if (password.length < 12 || password.length > 72) fail('ADMIN_PASSWORD must be between 12 and 72 characters.');
if (!firstName || !lastName) fail('ADMIN_FIRST_NAME and ADMIN_LAST_NAME are required.');

const redactMongoUrl = (value) => {
  try {
    const parsed = new URL(value);
    if (parsed.username) parsed.username = '***';
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return '[configured MongoDB connection]';
  }
};

async function provisionAdmin() {
  try {
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 15000 });
    const database = mongoose.connection.db;
    const users = database.collection('users');
    const existing = await users.findOne({ email });

    console.log(`Target: ${target.toUpperCase()}`);
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${redactMongoUrl(mongoUrl)}`);
    console.log(`Account: ${email}`);
    console.log('Organisation: none (isolated platform identity)');
    console.log(`Operation: ${existing ? 'update existing account' : 'create new account'}`);

    if (!apply) {
      console.log('Dry run only. No data was changed. Add --apply to perform this operation.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const result = await users.updateOne(
      { email },
      {
        $set: {
          first_name: firstName,
          last_name: lastName,
          mobile,
          password: passwordHash,
          role: 'admin',
          user_status: true,
          chat_status: false,
          visible: 'private',
          updatedAt: now
        },
        $setOnInsert: { createdAt: now },
        $unset: { integrator: '' }
      },
      { upsert: true }
    );

    const user = await users.findOne(
      { email },
      { projection: { email: 1, role: 1, user_status: 1, integrator: 1 } }
    );
    console.log(`Administrator ${result.upsertedCount ? 'created' : 'updated'} successfully.`);
    console.log(JSON.stringify(user, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

provisionAdmin().catch((error) => {
  console.error(`Provisioning failed: ${error.message}`);
  process.exitCode = 1;
});
