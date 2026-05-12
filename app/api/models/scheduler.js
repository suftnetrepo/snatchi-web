const mongoose = require('mongoose');
const { Schema } = mongoose;

const schedulerSchema = new mongoose.Schema(
  {
    integrator: { type: Schema.Types.ObjectId, ref: 'Integrator', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true }, 
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
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },  
    status: {
      type: String,
      enum: ['Pending', 'Declined', 'Accepted', 'Paid', 'Completed', 'Cancelled', 'Progress'],
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
