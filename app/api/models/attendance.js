const mongoose = require('mongoose');
const { Schema } = mongoose;

const attendanceSchema = new mongoose.Schema(
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
    first_name: {
      type: String,
      trim: true,
      required: true
    },
    last_name: {
      type: String,
      trim: true,
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      required: true,
      enum: ['chechin', 'checkout']
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
  },
  { timestamps: true }
);

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
