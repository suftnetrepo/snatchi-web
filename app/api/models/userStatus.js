const mongoose = require('mongoose');
const { Schema } = mongoose;

const userStatuSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: ['available', 'not-available', 'on-leave']
    },
    note: {
      type: String,
      maxlength: 500
    }
  },
  { timestamps: true }
);

const UserStatus = mongoose.models.UserStatus || mongoose.model('UserStatus', userStatuSchema);
module.exports = UserStatus;
