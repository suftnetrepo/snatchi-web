const mongoose = require('mongoose');

const webhookAuditSchema = new mongoose.Schema({
  type: { type: String, required: true, index: true },
  eventId: { type: String, default: '', index: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', index: true },
  eventTypes: [{ type: String }],
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'completed' },
  error: { type: String, default: '' },
  results: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

webhookAuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.models.WebhookAudit || mongoose.model('WebhookAudit', webhookAuditSchema);
