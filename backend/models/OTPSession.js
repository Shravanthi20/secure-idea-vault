const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  email: String,
  otpHash: String,
  expiresAt: { type: Date, expires: 300 }   // auto delete in 5 min
});

module.exports = mongoose.model("OTPSession", OTPSchema);
