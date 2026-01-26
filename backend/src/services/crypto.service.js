const crypto = require("crypto");

exports.generateRSAKeys = () => {
    return crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "pkcs1", format: "pem" },//Privacy enhanced mail-The key is stored as text
        privateKeyEncoding: { type: "pkcs1", format: "pem" }//pkcs1 is a standard that defines how RSA keys are structured internally.
    });
};

exports.hashData = (dataBuffer) => {//generate hash for data
    return crypto.createHash("sha256").update(dataBuffer).digest("hex");
};

exports.encryptAES = (dataBuffer) => {//generate symmetric AES key for encrypting file
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
    const encryptedData = Buffer.concat([
        cipher.update(dataBuffer),
        cipher.final()
    ]);
    return { encryptedData, aesKey, iv };
};

exports.decryptAES = (encryptedData, aesKey, iv) => {//decrypt data using AES key
    const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
    return Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
    ]);
};

exports.encryptAESKey = (aesKey, publicKey) => {//store AES key using RSA asymmetric encryption
    return crypto.publicEncrypt(publicKey, aesKey);
};

exports.decryptAESKey = (encryptedAESKey, privateKey) => {
    return crypto.privateDecrypt(privateKey, encryptedAESKey);
};

exports.signHash = (hash, privateKey) => {//valid signature, encrypt using private key of owner
    return crypto.privateEncrypt(privateKey, Buffer.from(hash));
};

exports.verifySignature = (hash, signature, publicKey) => {//valid signature, decrypt using public key of owner
    const decryptedHash = crypto.publicDecrypt(publicKey, signature);
    return decryptedHash.toString() == hash;
}