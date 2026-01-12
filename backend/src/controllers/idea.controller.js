const Idea = require("../models/Idea");
const ACL = require("../models/ACL");
const { encryptAES, encryptAESKey, hashData, signHash } = require("../services/crypto.service");
const { toBuffer } = require("../utils/buffer.util");
const { decryptAES, decryptAESKey, verifySignature } = require("../services/crypto.service");
const QRCode = require('qrcode');

exports.generateQRCode = async (req, res) => {
  try {
    const ideaId = req.params.id;
    // Verify user has access to this idea first
    const idea = await Idea.findById(ideaId);
    if (!idea) return res.status(404).send("Idea not found");

    // Generate QR code for the Verification URL
    // Assuming client URL structure, but we can return the Data URL
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/ideas/${ideaId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    res.json({ qrCode: qrCodeDataUrl, message: "QR Code generated successfully" });
  } catch (err) {
    res.status(500).send("Error generating QR Code");
  }
};

exports.uploadIdea = async (req, res) => {
  let dataBuffer;

  if (req.file) {
    // File upload
    dataBuffer = req.file.buffer;
  } else {
    // Text upload
    dataBuffer = toBuffer(req.body.data);
  }

  const dataHash = hashData(dataBuffer);
  const { encryptedData, aesKey, iv } = encryptAES(dataBuffer);
  const encryptedAESKey = encryptAESKey(aesKey, req.user.publicKey);
  const digitalSignature = signHash(dataHash, req.user.privateKey);

  const idea = await Idea.create({
    ownerId: req.user.uid,
    encryptedData,
    encryptedAESKey,
    iv,
    dataHash,
    digitalSignature
  });

  await ACL.create([
    { subjectId: req.user.uid, objectId: idea._id, permission: "VIEW" },
    { subjectId: req.user.uid, objectId: idea._id, permission: "VERIFY" }
  ]);

  res.json({ message: "Idea Stored securely", ideaId: idea._id });
};


exports.viewIdea = async (req, res) => {
  const idea = await Idea.findById(req.params.id);
  if (!idea) return res.status(404).send("Not found");

  const aesKey = decryptAESKey(
    idea.encryptedAESKey,
    req.user.privateKey
  );

  const decryptedData = decryptAES(
    idea.encryptedData,
    aesKey,
    idea.iv
  );

  const isValid = verifySignature(
    idea.dataHash,
    idea.digitalSignature,
    req.user.publicKey
  );

  if (!isValid) return res.status(400).send("Data integrity compromised");

  res.send(decryptedData.toString());
};

exports.downloadIdea = async (req, res) => {
  const idea = await Idea.findById(req.params.id);
  if (!idea) return res.status(404).send("Not found");

  const aesKey = decryptAESKey(
    idea.encryptedAESKey,
    req.user.privateKey
  );

  const decryptedData = decryptAES(
    idea.encryptedData,
    aesKey,
    idea.iv
  );

  res.setHeader("Content-Disposition", "attachment");
  res.send(decryptedData);
};
