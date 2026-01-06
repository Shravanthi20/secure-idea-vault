const mongoose = require("mongoose");

const ACLSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref:"User" },
  objectId: { type: mongoose.Schema.Types.ObjectId, ref:"Idea" },
  permission: { type: String, enum:["VIEW","SHARE","VERIFY","REVOKE"] }
});

module.exports = mongoose.model("ACL", ACLSchema);
