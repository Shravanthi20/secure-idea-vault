const mongoose = require("mongoose");

const VerificationSchema = new mongoose.Schema({
  ideaId: mongoose.Schema.Types.ObjectId,
  publicHash: String,
  expiresAt: Date
});

module.exports = mongoose.model("VerificationToken", VerificationSchema);
