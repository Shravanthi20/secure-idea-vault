const User = require("../models/User");
const crypto = require("crypto");

async function getUserWithKeys(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Decrypt Private Key
    // Must match the encryption logic in auth.controller.js
    const masterKey = crypto.createHash("sha256").update(process.env.JWT_SECRET).digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", masterKey, user.privateKeyIV);

    let privateKey;
    try {
        privateKey = Buffer.concat([
            decipher.update(user.encryptedPrivateKey),
            decipher.final()
        ]).toString();
    } catch (err) {
        throw new Error("Account incompatible (Old Key Format). Please Register a NEW account.");
    }

    return {
        _id: user._id,
        role: user.role,
        publicKey: user.publicKey,
        privateKey: privateKey
    };
}

module.exports = { getUserWithKeys };
