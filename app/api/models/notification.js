const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new mongoose.Schema(
  {
    // Recipients
    recipient: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        sparse: true
      },
      integratorId: {
        type: Schema.Types.ObjectId,
        ref: 'Integrator',
        required: false,
        sparse: true
      },
      type: {
        type: String,
        enum: ['user', 'integrator'],
        required: true
      }
    },

    // Content
    type: {
      type: String,
      enum: [
        'booking_created',
        'booking_accepted',
        'booking_approved',
        'booking_declined',
        'payment_completed',
        'payment_failed',
        'ready_to_start',
        'schedule_updated',
        'schedule_cancelled',
        'work_started',
        'work_completed',
        'engineer_accepted',
        'engineer_declined'
      ],
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    // Navigation & Context
    screen: {
      type: String,
      enum: ['calendar', 'payments', 'schedules', 'profile', 'home'],
      required: true
    },

    screenParams: {
      type: Schema.Types.Mixed,
      default: {}
    },

    // Related Objects
    relatedTo: {
      schedule: {
        type: Schema.Types.ObjectId,
        ref: 'Scheduler',
        required: false
      },
      project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: false
      },
      payment: {
        type: Schema.Types.ObjectId,
        ref: 'Payment',
        required: false
      },
      integrator: {
        type: Schema.Types.ObjectId,
        ref: 'Integrator',
        required: false
      }
    },

    // Status Tracking
    status: {
      created: {
        type: Boolean,
        default: true
      },
      delivered: {
        type: Boolean,
        default: false
      },
      read: {
        type: Boolean,
        default: false,
        index: true
      },
      archived: {
        type: Boolean,
        default: false
      }
    },

    // Channels
    channels: [
      {
        type: {
          type: String,
          enum: ['push', 'in-app'],
          required: true
        },
        sent: {
          type: Boolean,
          default: false
        },
        sentAt: {
          type: Date,
          required: false
        },
        error: {
          type: String,
          required: false
        },
        _id: false
      }
    ],

    // Metadata
    priority: {
      type: String,
      enum: ['high', 'normal', 'low'],
      default: 'normal'
    },

    actionUrl: {
      type: String,
      required: false
    },

    actionLabel: {
      type: String,
      required: false
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    deliveredAt: {
      type: Date,
      required: false
    },

    readAt: {
      type: Date,
      required: false
    },

    archivedAt: {
      type: Date,
      required: false
    },

    expiresAt: {
      type: Date,
      required: false,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    }
  },
  { timestamps: true }
);

// Indexes for performance
NotificationSchema.index({ 'recipient.userId': 1, 'status.read': 1, createdAt: -1 });
NotificationSchema.index({ 'recipient.integratorId': 1, 'status.read': 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ 'relatedTo.schedule': 1 });
NotificationSchema.index({ 'relatedTo.payment': 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Query helper for unread
NotificationSchema.query.unread = function () {
  return this.where('status.read', false).where('status.archived', false);
};

// Query helper for user
NotificationSchema.query.forUser = function (userId) {
  return this.where({ 'recipient.userId': userId, 'recipient.type': 'user' });
};

// Query helper for integrator
NotificationSchema.query.forIntegrator = function (integratorId) {
  return this.where({ 'recipient.integratorId': integratorId, 'recipient.type': 'integrator' });
};

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
