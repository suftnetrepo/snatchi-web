import mongoose from 'mongoose';

const StripeWebhookEventSchema = new mongoose.Schema(
  {
    stripeEventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    eventType: {
      type: String,
      required: true,
      trim: true
    },
    customerId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    subscriptionId: {
      type: String,
      trim: true,
      default: ''
    },
    processed: {
      type: Boolean,
      default: true,
      index: true
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed'
    },
    errorMessage: {
      type: String,
      trim: true,
      default: ''
    },
    retryCount: {
      type: Number,
      default: 0,
      max: 5
    },
    eventData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    processedAt: {
      type: Date,
      default: Date.now,
      index: true,
      // Auto-delete old records after 90 days
      expires: 7776000
    }
  },
  { timestamps: true }
);

// Index for finding unprocessed events
StripeWebhookEventSchema.index({ processed: 1, processingStatus: 1 });

// Index for cleanup of old events
StripeWebhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const StripeWebhookEvent = mongoose.models.StripeWebhookEvent || mongoose.model('StripeWebhookEvent', StripeWebhookEventSchema);

export default StripeWebhookEvent;
