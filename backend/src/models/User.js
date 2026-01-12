const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  salt: String,

  role: {
    type: String,
    enum: ["OWNER", "VIEWER", "ADMIN", "VERIFIER"],
    default: "OWNER"
  },

  publicKey: String,                  // plaintext
  encryptedPrivateKey: Buffer,         // AES encrypted
  privateKeyIV: Buffer,                // IV for AES

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
