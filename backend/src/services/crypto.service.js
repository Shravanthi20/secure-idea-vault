const crypto= require("crypto");

exports.generateRSAKeys=()=>{
    return crypto.generateKeyPairSync("rsa",{
        modulusLength: 2048,
        publicKeyEncoding: {type:"pkcs1",format: "pem"},
        privateKeyEncoding: {type:"pkcs1", format:"pem"}
    });
};

exports.hashData = (dataBuffer) => {
  return crypto.createHash("sha256").update(dataBuffer).digest("hex");
};

exports.encryptAES= (dataBuffer)=>{
    const aesKey= crypto.randomBytes(32);
    const iv= crypto.randomBytes(16);
    const cipher= crypto.createCipheriv("aes-256-cbc", aesKey, iv);
    const encryptedData= Buffer.concat([
        cipher.update(dataBuffer),
        cipher.final()
    ]);
    return {encryptedData, aesKey, iv};
};

exports.decryptAES= (encryptedData,aesKey, iv)=>{
    const decipher= crypto.createDecipheriv("aes-256-cbc",aesKey, iv);
    return Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
    ]);
};

exports.encryptAESKey = (aesKey, publicKey) => {
  return crypto.publicEncrypt(publicKey, aesKey);
};

exports.decryptAESKey = (encryptedAESKey, privateKey) => {
  return crypto.privateDecrypt(privateKey, encryptedAESKey);
};

exports.signHash= (hash, privateKey)=>{
    return crypto.privateEncrypt(privateKey, Buffer.from(hash));
};

exports.verifySignature= (hash,signature,publicKey)=>{
    const decryptedHash= crypto.publicDecrypt(publicKey, signature);
    return decryptedHash.toString()==hash;
}