const mongoose = require('mongoose');
const { Schema } = mongoose;

const fenceSchema = new mongoose.Schema(
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
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    time: {
      type: String,
      required: true,
      default: '00:00'
    },
    status: {
      type: String,
      required: true,
      enum: ['Enter', 'Exist']
    },
    completeAddress: {
      type: String,
      required: false,
      max: 255
    },
    latitude: {
      type: String,
      required: false,
      max: 50
    },
    longitude: {
      type: String,
      required: false,
      max: 50
    }
  },
  { timestamps: true }
);

const Fence = mongoose.models.Fence || mongoose.model('Fence', fenceSchema);
module.exports = Fence;
