const mongoose = require('mongoose');
const { Schema } = mongoose;

const schedulerSchema = new mongoose.Schema(
  {
    integrator: { type: Schema.Types.ObjectId, ref: 'Integrator', required: true },
    engineer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
    // Payment Fields (Cross-Integrator Payment)
    // Which integrator is paying for this engineer service
    payingIntegrator: {
      type: Schema.Types.ObjectId,
      ref: 'Integrator',
      required: false
    },
    // Which integrator receives the payment (engineer's owner)
    receivingIntegratorId: {
      type: Schema.Types.ObjectId,
      ref: 'Integrator',
      required: false
    },
    // Payment amounts
    estimatedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    platformFeeAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    receiverAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Stripe references
    paymentIntentId: {
      type: String,
      required: false,
      trim: true
    },
    transferId: {
      type: String,
      required: false,
      trim: true
    },
    // Payment status
    paymentStatus: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'cancelled', 'refunded'],
      default: 'pending'
    },
    transferStatus: {
      type: String,
      enum: ['pending', 'created', 'in_transit', 'paid', 'failed'],
      default: 'pending'
    },
    // Payment timestamps
    paymentInitiatedAt: {
      type: Date,
      required: false
    },
    paymentSucceededAt: {
      type: Date,
      required: false
    },
    transferInitiatedAt: {
      type: Date,
      required: false
    },
    transferPaidAt: {
      type: Date,
      required: false
    }
  },
  { timestamps: true }
);

const Scheduler = mongoose.models.Scheduler || mongoose.model('Scheduler', schedulerSchema);
module.exports = Scheduler;
