const mongoose = require("mongoose");

const AuditSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  action: String,
  ip: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AuditLog", AuditSchema);
