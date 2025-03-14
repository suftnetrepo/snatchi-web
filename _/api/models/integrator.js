/* eslint-disable linebreak-style */
const mongoose = require('mongoose')
const { Schema } = require('mongoose')

const addressSchema = new Schema({
  addressLine1: {
    type: String,
    required: false,
    default: '',
    max: 100
  },
  county: {
    type: String,
    default: '',
    max: 20
  },
  town: {
    type: String,
    required: false,
    default: '',
    max: 50
  },
  country: {
    type: String,
    required: true,
    min: 3,
    max: 20
  },
  country_code: {
    type: String,
    required: false,
    min: 3,
    max: 5
  },
  postcode: {
    type: String,
    required: false,
    default: '',
    max: 15
  },
  completeAddress: {
    type: String,
    required: false,
    default: '',
    max: 255
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
  }
})

const IntegratorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
      max: 100,
      required: true,
    },
    mobile: {
      type: String,
      trim: false,
      required: true,
      max: 50,
      default: ''
    },
    email: { type: String, unique: true, max: 50, lowercase: true },
    description: {
      type: String,
      min: 3,
      max: 2000,
      default: ''
    },
    address: {
      type: addressSchema,
      required: false
    },      
    push_notifications: [
      {
        title: {
          type: String,
          trim: true,
          default: ''
        },
        message: {
          type: String,
          trim: true,
          default: ''
        },
        status: {
          type: Boolean,
          default: true
        }
      }
    ],   
      
    currency: {
      type: String,
      trim: true,
      default: '£'
    },
    tax_rate: {
      type: Number,
      default: 0,
      max: 9
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: Date.now
    },
    trial_start: {
      type: Date,
      default: Date.now
    },
    trial_end: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      trim: true,
      default: ''
    },  
    subscriptionId: {
      type: String,
      trim: true,
      default: ''
    },
    plan: {
      type: String,
      trim: true,
      default: ''
    },
    priceId: {
      type: String,
      trim: true,
      default: ''
    },
    stripeCustomerId: {
      type: String,
      trim: true,
      default: ''
    },
    fcm_token: {
      type: String,
      trim: true,
      required: false,
      default: ''
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
  },
  { timestamps: true }
)

IntegratorSchema.index({ 'address.location': '2dsphere' })
IntegratorSchema.index({
  name: 'text',
  'address.addressLine1': 'text',
  'address.town': 'text',
  'address.postcode': 'text'
})

const Integrator = mongoose.models.Integrator || mongoose.model('Integrator', IntegratorSchema);
module.exports = Integrator;
