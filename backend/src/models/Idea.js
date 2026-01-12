const mongoose = require("mongoose");

const IdeaSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fileName: String,
    fileType: String,
    encryptedData: Buffer,
    encryptedAESKey: Buffer,
    iv: Buffer,
    dataHash: String,
    digitalSignature: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Idea", IdeaSchema);