const mongoose = require("mongoose");

const AuditSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  action: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  ip: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AuditLog", AuditSchema);
