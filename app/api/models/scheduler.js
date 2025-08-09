const mongoose = require('mongoose');
const { Schema } = mongoose;

const schedulerSchema = new mongoose.Schema(
  {
    integrator: { type: Schema.Types.ObjectId, ref: 'Integrator', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Declined', 'Accepted'],
      required: true
    },
     description: {
      type: String,
      trim: true
    },
  },
  { timestamps: true }
);

const Scheduler = mongoose.models.Scheduler || mongoose.model('Scheduler', schedulerSchema);
module.exports = Scheduler;
