/* eslint-disable linebreak-style */
/**
 * Payment Model
 * Tracks cross-integrator engineer-service payments
 * 
 * Architecture:
 * - Paying Integrator (who pays for engineer service)
 * - Receiving Integrator (engineer's owner, gets the transfer)
 * - Engineer (provides service, paid offline by receiving integrator)
 * - Platform (keeps fee from transaction)
 */

const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    // Core Payment References
    payingIntegrator: {
      type: Schema.Types.ObjectId,
      ref: 'Integrator',
      required: true
    },
    receivingIntegrator: {
      type: Schema.Types.ObjectId,
      ref: 'Integrator',
      required: true
    },
    engineer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    scheduler: {
      type: Schema.Types.ObjectId,
      ref: 'Scheduler',
      required: true,
      unique: true // One payment per scheduler booking
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: false
    },

    // Amount Breakdown
    grossAmount: {
      type: Number,
      required: true,
      min: 0
    },
    platformFeePercentage: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    platformFeeAmount: {
      type: Number,
      required: true,
      min: 0
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'gbp',
      enum: ['gbp', 'usd', 'eur']
    },

    // Payment Intent (Stripe)
    paymentIntentId: {
      type: String,
      required: false,
      trim: true
    },
    clientSecret: {
      type: String,
      required: false,
      trim: true
    },
    paymentMethodId: {
      type: String,
      required: false,
      trim: true
    },

    // Charge (Stripe)
    chargeId: {
      type: String,
      required: false,
      trim: true
    },
    chargeFailureCode: {
      type: String,
      default: '',
      max: 50
    },
    chargeFailureMessage: {
      type: String,
      default: '',
      max: 500
    },
    chargeFailureAttempts: {
      type: Number,
      default: 0,
      min: 0
    },
    chargeLastFailureAt: {
      type: Date,
      required: false
    },

    // Payment Status
    paymentStatus: {
      type: String,
      enum: [
        'pending', // Payment intent created, awaiting confirmation
        'succeeded', // Charge succeeded, ready for transfer
        'failed', // Charge failed
        'cancelled', // Payment cancelled by user/admin
        'refunded' // (Phase 2) Payment refunded
      ],
      default: 'pending'
    },

    // Transfer to Receiving Integrator
    transferId: {
      type: String,
      required: false,
      trim: true
    },
    transferStatus: {
      type: String,
      enum: [
        'pending', // Not yet transferred
        'created', // Transfer created with Stripe
        'in_transit', // Transfer in progress
        'paid', // Transfer paid to receiving integrator
        'failed' // Transfer failed
      ],
      default: 'pending'
    },
    transferFailureCode: {
      type: String,
      default: '',
      max: 50
    },
    transferFailureMessage: {
      type: String,
      default: '',
      max: 500
    },

    // Refund Tracking (Phase 2)
    refundId: {
      type: String,
      required: false,
      trim: true
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    refundReason: {
      type: String,
      required: false,
      max: 200
    },
    refundedAt: {
      type: Date,
      required: false
    },

    // Dispute Tracking (Phase 2)
    disputeId: {
      type: String,
      required: false,
      trim: true
    },
    disputeReason: {
      type: String,
      required: false,
      max: 500
    },

    // Audit Trail
    paymentInitiatedAt: {
      type: Date,
      required: false
    },
    paymentAttemptedAt: {
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
    },
    failedAt: {
      type: Date,
      required: false
    },

    // Metadata
    notes: {
      type: String,
      default: '',
      max: 1000
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
PaymentSchema.index({ payingIntegrator: 1, createdAt: -1 });
PaymentSchema.index({ receivingIntegrator: 1, createdAt: -1 });
PaymentSchema.index({ engineer: 1, createdAt: -1 });
PaymentSchema.index({ scheduler: 1 });
PaymentSchema.index({ paymentStatus: 1, createdAt: -1 });
PaymentSchema.index({ transferStatus: 1, createdAt: -1 });
PaymentSchema.index({ paymentIntentId: 1 });
PaymentSchema.index({ chargeId: 1 });
PaymentSchema.index({ transferId: 1 });

// Compound index for payment history queries
PaymentSchema.index({ receivingIntegrator: 1, paymentStatus: 1, paymentSucceededAt: -1 });
PaymentSchema.index({ payingIntegrator: 1, paymentStatus: 1, paymentSucceededAt: -1 });

const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
module.exports = Payment;
