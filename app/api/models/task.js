const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new mongoose.Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: {
      type: String,
      required: true,
      trim: true
    },
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
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        text: {
          type: String,
          required: true,
          trim: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        },
      }
    ],
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

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
module.exports = Task;
