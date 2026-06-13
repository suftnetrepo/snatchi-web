const mongoose = require('mongoose');
const { Schema } = mongoose;

const engineerServiceRateSchema = new Schema(
  {
    engineer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    serviceName: {
      type: String,
      required: true,
      trim: true
    },
    rate: {
      type: Number,
      required: true,
      min: 0
    },
    rateType: {
      type: String,
      enum: ['hourly', 'daily', 'fixed'],
      default: 'hourly'
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const EngineerServiceRate =
  mongoose.models.EngineerServiceRate ||
  mongoose.model('EngineerServiceRate', engineerServiceRateSchema);

export default EngineerServiceRate;
