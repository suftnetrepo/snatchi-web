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
      enum: ['Paid', 'Unpaid', 'Cancelled'],
      required: true
    },
    invoice_type: {
      type: Boolean,
      default: false,
      required: false
    },
    invoice_description: {
      type: String,
      required: false,
      trim: true
    },
    items: [
      {
        description: {
          type: String,
          required: false,
          trim: true
        },
        hour: {
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
        },
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
