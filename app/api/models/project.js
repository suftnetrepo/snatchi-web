const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectSchema = new mongoose.Schema(
  {
    integrator: { type: Schema.Types.ObjectId, ref: 'Integrator', required: true },
    name: {
      type: String,
      required: true,
      trim: true
    },
    project_number: {
      type: String,
      required: false,
      trim: true
    },
    stakeholder: {
      type: String,
      trim: true
    },
    first_name: {
      type: String,
      trim: true,
      required: false,
      default: ''
    },
    last_name: {
      type: String,
      trim: true,
      required: false,
      default: ''
    },
    mobile: {
      type: String,
      trim: true,
      required: false,
      default: ''
    },
    email: { type: String, required: false, lowercase: true, default: '' },
    ppe: [],
    description: {
      type: String,
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
      enum: ['Pending', 'Progress', 'Completed', 'Canceled'],
      required: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true
    },
    assignedTo: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        }
      }
    ],
    attachments: [
      {
        document_name: {
          type: String,
          required: true,
          trim: true
        },
        document_type: {
          type: String,
          required: false,
          trim: true
        },
        secure_url: {
          type: String,
          required: false,
          default: ''
        },
        public_id: {
          type: String,
          required: false,
          default: ''
        }
      }
    ],
    addressLine1: {
      type: String,
      required: false,
      default: '',
      max: 100
    },
    completeAddress: {
      type: String,
      required: false,
      max: 255
    },
    county: {
      type: String,
      required: false,
      default: '',
      max: 50
    },
    town: {
      type: String,
      required: false,
      max: 20
    },
    country: {
      type: String,
      required: false,
      max: 20
    },
    postcode: {
      type: String,
      required: false,
      default: '',
      max: 20
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: false
      },
      coordinates: {
        type: [Number],
        required: false
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    budget: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
module.exports = Project;
