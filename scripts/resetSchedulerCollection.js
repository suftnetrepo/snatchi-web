const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const mongoConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

const resetSchedulerCollection = async () => {
  try {
    await mongoConnect();

    // Drop the Scheduler collection
    await mongoose.connection.collection('schedulers').drop();
    console.log('✓ Scheduler collection dropped successfully');

    // Verify the collection is gone
    const collections = await mongoose.connection.db.listCollections().toArray();
    const schedulerExists = collections.some(col => col.name === 'schedulers');
    
    if (!schedulerExists) {
      console.log('✓ Confirmed: Scheduler collection no longer exists');
      console.log('✓ The new schema will be created on the first write');
    }

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('✓ Collection does not exist or already dropped');
      await mongoose.disconnect();
      process.exit(0);
    } else {
      console.error('✗ Error resetting collection:', error.message);
      process.exit(1);
    }
  }
};

resetSchedulerCollection();
