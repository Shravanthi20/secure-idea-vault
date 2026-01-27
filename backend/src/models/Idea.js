const mongoose = require("mongoose");

const IdeaSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true }, // Added title
    version: { type: Number, default: 1 }, // Added version
    rootIdeaId: { type: mongoose.Schema.Types.ObjectId, ref: "Idea" }, // Reference to the first version
    fileName: String,
    fileType: String,
    encryptedData: Buffer,
    encryptedAESKey: Buffer,
    iv: Buffer,
    dataHash: String,
    digitalSignature: Buffer,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Idea", IdeaSchema);