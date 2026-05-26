const mongoose = require('mongoose');
const { Schema } = mongoose;

const DeviceTokenSchema = new mongoose.Schema(
  {
    // User reference
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Token data
    token: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      index: true
    },

    // Device information
    device: {
      type: {
        type: String,
        enum: ['web', 'mobile_ios', 'mobile_android'],
        required: true
      },
      platform: {
        type: String,
        required: false, // e.g., 'Chrome', 'iOS', 'Android'
        trim: true
      },
      appVersion: {
        type: String,
        required: false,
        trim: true
      },
      osVersion: {
        type: String,
        required: false,
        trim: true
      },
      userAgent: {
        type: String,
        required: false,
        trim: true
      }
    },

    // Status tracking
    status: {
      active: {
        type: Boolean,
        default: true,
        index: true
      },
      failCount: {
        type: Number,
        default: 0,
        min: 0
      },
      lastUsed: {
        type: Date,
        required: false
      },
      lastFailed: {
        type: Date,
        required: false
      },
      deactivatedAt: {
        type: Date,
        required: false
      },
      deactivatedReason: {
        type: String,
        enum: ['too_many_failures', 'manual', 'expired', 'invalid_token'],
        required: false
      }
    },

    // Capabilities
    capabilities: {
      supportsPush: {
        type: Boolean,
        default: true
      },
      supportsBadge: {
        type: Boolean,
        default: true
      },
      supportsSound: {
        type: Boolean,
        default: true
      },
      supportsActionButtons: {
        type: Boolean,
        default: false
      }
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    updatedAt: {
      type: Date,
      default: Date.now
    },

    // For cleanup
    expiresAt: {
      type: Date,
      required: false,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  },
  { timestamps: false } // We manage updatedAt manually
);

// Indexes
DeviceTokenSchema.index({ user: 1, 'status.active': 1 });
DeviceTokenSchema.index({ user: 1, device: 1 }); // Find tokens by device type
DeviceTokenSchema.index({ 'status.active': 1, 'status.lastUsed': 1 }); // For cleanup queries
DeviceTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Query helpers
DeviceTokenSchema.query.active = function () {
  return this.where({ 'status.active': true });
};

DeviceTokenSchema.query.forUser = function (userId) {
  return this.where({ user: userId });
};

DeviceTokenSchema.query.byDeviceType = function (deviceType) {
  return this.where({ 'device.type': deviceType });
};

// Instance methods
DeviceTokenSchema.methods.markUsed = async function () {
  this.status.lastUsed = new Date();
  this.updatedAt = new Date();
  return this.save();
};

DeviceTokenSchema.methods.recordFailure = async function () {
  this.status.failCount += 1;
  this.status.lastFailed = new Date();
  this.updatedAt = new Date();

  // Deactivate after 3 failures
  if (this.status.failCount >= 3) {
    this.status.active = false;
    this.status.deactivatedAt = new Date();
    this.status.deactivatedReason = 'too_many_failures';
  }

  return this.save();
};

DeviceTokenSchema.methods.deactivate = async function (reason = 'manual') {
  this.status.active = false;
  this.status.deactivatedAt = new Date();
  this.status.deactivatedReason = reason;
  this.updatedAt = new Date();
  return this.save();
};

DeviceTokenSchema.methods.reactivate = async function () {
  this.status.active = true;
  this.status.failCount = 0;
  this.status.deactivatedAt = undefined;
  this.status.deactivatedReason = undefined;
  this.status.lastUsed = new Date();
  this.updatedAt = new Date();
  return this.save();
};

const DeviceToken = mongoose.models.DeviceToken || mongoose.model('DeviceToken', DeviceTokenSchema);

module.exports = DeviceToken;
