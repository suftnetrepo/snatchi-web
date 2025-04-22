const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    integrator: { type: Schema.Types.ObjectId, ref: 'Integrator', required: true },
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
    mobile: {
      type: String,
      trim: true,
      required: false,
      default: ''
    },
    user_status: {
      type: Boolean,
      default: false
    },
    email: { type: String, unique: true, lowercase: true },
    otp: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'integrator', 'engineer', 'guest', 'manager']
    },
    visible: {
      type: String,
      required: false,
      enum: ['private', 'public']
    },
    password: {
      type: String,
      required: false
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
    },
    fcm: {
      type: String,
      required: false,
      default: ''
    },
    attachments: [
      {
        name: {
          type: String,
          required: true,
          trim: true
        },
        description: {
          type: String,
          required: false,
          trim: true,
          default :''
        },
        secure_url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        }
      }
    ]
  },
  { timestamps: true }
);

userSchema.statics.findByEmail = function (email) {
  const user = this.findOne({ email });
  return user;
};

userSchema.methods.generatePasswordHash = function (password) {
  const saltRounds = 10;
  const result = bcrypt.hash(password, saltRounds);
  return result;
};

userSchema.methods.validatePassword = function (password) {
  try {
    return bcrypt.compare(password, this.password);
  } catch (error) {
    console.error(error);
    return false;
  }
};

userSchema.statics.autocomplete = function (searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [{ first_name: regex }, { last_name: regex }, { email: regex }]
  }).limit(10);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
