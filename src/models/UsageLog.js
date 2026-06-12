import mongoose from 'mongoose';

const usageLogSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  status: { type: Number, required: true },
  ipAddress: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const UsageLog = mongoose.model('UsageLog', usageLogSchema);