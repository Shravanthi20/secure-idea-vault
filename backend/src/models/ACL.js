const mongoose = require("mongoose");

const ACLSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  objectId: { type: mongoose.Schema.Types.ObjectId, ref: "Idea" }, // Anchor to the Idea ID
  objectType: { type: String, enum: ["Idea", "Comment", "AuditLog"], default: "Idea", required: true },
  permission: { type: String, enum: ["VIEW", "SHARE", "VERIFY", "REVOKE", "POST"] } // Added POST for comments
});

module.exports = mongoose.model("ACL", ACLSchema);
