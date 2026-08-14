const mongoose = require('mongoose');
const { Schema } = mongoose;

const invoiceSchema = new mongoose.Schema(
  {
    integrator: {
      type: Schema.Types.ObjectId,
      ref: 'Integrator',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    scheduler: {
      type: Schema.Types.ObjectId,
      ref: 'Scheduler',
      required: false,
      index: true
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: false,
      index: true
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    due_on: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Verified', 'Rejected', 'PaymentPending', 'Paid', 'Unpaid', 'Cancelled', 'Approved', 'Converted'],
      required: true
    },
    invoice_type: {
      type: String,
      enum: ['Quote', 'Invoice', 'Save', 'Draft'],
      required: true
    },
    invoice_description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500
    },
    items: [
      {
        description: {
          type: String,
          required: false,
          trim: true
        },
        unit: {
          type: String,
          enum: ['day', 'hour'],
          required: true
        },
        duration: {
          type: Number,
          required: true,
          default: 1
        },
        rate: {
          type: Number,
          required: true,
          default: 0
        },
        date: {
          type: String,
          required: false,
          trim: true
        }
      }
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    tax: {
      type: Number,
      required: true,
      default: 0
    },
    discount: {
      type: Number,
      required: true,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    notes: {
      type: String,
      trim: true
    },
    submittedAt: Date,
    verifiedAt: Date,
    rejectedAt: Date,
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
