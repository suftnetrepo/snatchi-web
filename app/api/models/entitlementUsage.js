import mongoose from 'mongoose';

const entitlementUsageSchema = new mongoose.Schema({
  integrator: { type: mongoose.Schema.Types.ObjectId, ref: 'Integrator', required: true, unique: true, index: true },
  activeProjects: { type: Number, required: true, min: 0, default: 0 },
  activeMembers: { type: Number, required: true, min: 0, default: 0 },
  documentPeriodStart: { type: Date, required: false },
  documentPeriodEnd: { type: Date, required: false },
  documentUploads: { type: Number, required: true, min: 0, default: 0 }
}, { timestamps: true });

const EntitlementUsage = mongoose.models.EntitlementUsage || mongoose.model('EntitlementUsage', entitlementUsageSchema);
export default EntitlementUsage;
