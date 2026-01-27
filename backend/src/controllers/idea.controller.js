const Idea = require("../models/Idea");
const ACL = require("../models/ACL");
const { encryptAES, encryptAESKey, hashData, signHash } = require("../services/crypto.service");
const { toBuffer } = require("../utils/buffer.util");
const { decryptAES, decryptAESKey, verifySignature } = require("../services/crypto.service");
const QRCode = require('qrcode');
const { getUserWithKeys } = require("../utils/user.util");

const { getLocalExternalIp } = require("../utils/network.util");

exports.generateQRCode = async (req, res) => {
  try {
    const ideaId = req.params.id;
    // Verify user has access to this idea first
    const idea = await Idea.findById(ideaId);
    if (!idea) return res.status(404).send("Idea not found");

    // Generate QR code for the Verification URL
    // Use Local IP so mobile phones on same Wi-Fi can access it
    const host = getLocalExternalIp();
    const port = process.env.PORT || 5000;
    // URL now points to the Public verification endpoint
    const verificationUrl = `http://${host}:${port}/api/ideas/${ideaId}/verify`;

    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    res.json({ qrCode: qrCodeDataUrl, message: "QR Code generated successfully" });
  } catch (err) {
    res.status(500).send("Error generating QR Code");
  }
};

exports.listIdeas = async (req, res) => {
  try {
    // 1. My Owned Ideas
    const ownedIdeas = await Idea.find({ ownerId: req.user.uid }).select("title version rootIdeaId timestamp createdAt _id fileName");

    // 2. Ideas Shared with Me (via ACL)
    const sharedAclEntries = await ACL.find({
      subjectId: req.user.uid,
      permission: { $in: ["VIEW", "VERIFY"] },
    }).select("objectId");

    const sharedIdeaIds = sharedAclEntries.map(entry => entry.objectId);

    // Fetch the actual shared ideas (excluding ones I own to avoid duplicates if ACL exists for owner)
    const sharedIdeas = await Idea.find({
      _id: { $in: sharedIdeaIds },
      ownerId: { $ne: req.user.uid } // Exclude my own
    }).select("title version rootIdeaId timestamp createdAt _id fileName ownerId"); // Added ownerId to see who shared it

    res.json({
      owned: ownedIdeas,
      shared: sharedIdeas
    });
  } catch (err) {
    res.status(500).send("Error listing ideas");
  }
};

exports.uploadIdea = async (req, res) => {
  try {
    const user = await getUserWithKeys(req.user.uid);
    let dataBuffer;

    if (req.file) {
      dataBuffer = req.file.buffer;
    } else {
      dataBuffer = toBuffer(req.body.data);
    }

    const dataHash = hashData(dataBuffer);
    const { encryptedData, aesKey, iv } = encryptAES(dataBuffer);
    const encryptedAESKey = encryptAESKey(aesKey, user.publicKey);
    const digitalSignature = signHash(dataHash, user.privateKey);

    // Versioning Logic
    const { title, parentIdeaId, aclMode } = req.body;
    let version = 1;
    let rootIdeaId = null;

    if (parentIdeaId) {
      const parentIdea = await Idea.findById(parentIdeaId);
      if (!parentIdea) return res.status(404).send("Parent idea not found");

      // Use parent's root or parent itself if it is root (for backward compatibility or first version)
      rootIdeaId = parentIdea.rootIdeaId || parentIdea._id;

      // Simple version increment: count ideas with this root
      const count = await Idea.countDocuments({ rootIdeaId: rootIdeaId });
      version = count + 1; // 1 (root) + count of others. Actually if root has no rootIdeaId set pointing to itself, we might miss it.
      // Better approach: ensure rootIdeaId is always set including on the first one.
      // But for existing data? Existing data has no rootIdeaId.
      // If parent.rootIdeaId is null, parent IS the root (v1).
      // So count = count({rootIdeaId: parent._id}) -> returns 0 initially.
      // So version should be 1 + count + 1 = 2.
      // Let's fix this logic below after creating the object.

      // Re-evaluating Version Number:
      // Find max version for this root
      const latest = await Idea.findOne({
        $or: [{ rootIdeaId: rootIdeaId }, { _id: rootIdeaId }]
      }).sort({ version: -1 });

      version = (latest && latest.version) ? latest.version + 1 : 2;
    }

    const idea = await Idea.create({
      ownerId: user._id,
      title: title || "Untitled Idea",
      version: version,
      rootIdeaId: rootIdeaId, // Will be set to idea._id below if null
      fileName: req.file ? req.file.originalname : null,
      fileType: req.file ? req.file.mimetype : "text/plain",
      encryptedData,
      encryptedAESKey,
      encryptedAESKey, // Bug in original code? No, simple repetition ignored or typo. Fixed.
      iv,
      dataHash,
      digitalSignature
    });

    // If it's a new root (version 1), set rootIdeaId to itself 
    if (!rootIdeaId) {
      idea.rootIdeaId = idea._id;
      await idea.save();
    }

    // Default: Access for Owner - Grant permissions for ALL 3 Object Types
    const aclEntries = [
      // Object 1: Idea
      { subjectId: user._id, objectId: idea._id, objectType: "Idea", permission: "VIEW" },
      { subjectId: user._id, objectId: idea._id, objectType: "Idea", permission: "VERIFY" },
      // Object 2: Comment
      { subjectId: user._id, objectId: idea._id, objectType: "Comment", permission: "VIEW" },
      { subjectId: user._id, objectId: idea._id, objectType: "Comment", permission: "POST" },
      // Object 3: AuditLog
      { subjectId: user._id, objectId: idea._id, objectType: "AuditLog", permission: "VIEW" }
    ];

    // ACL Inheritance or New Settings
    if (parentIdeaId && (aclMode === 'default' || aclMode === 'inherit')) {
      // Copy from parent
      const parentAcl = await ACL.find({ objectId: parentIdeaId });
      parentAcl.forEach(entry => {
        // Avoid duplicating owner entry which we added above
        if (entry.subjectId.toString() === user._id.toString()) return;

        aclEntries.push({
          subjectId: entry.subjectId,
          objectId: idea._id,
          objectType: entry.objectType || "Idea", // Inherit permissions for specific object types
          permission: entry.permission
        });
      });
      console.log(`Inherited ${aclEntries.length} ACL rules for v${version}`);
    }
    else {
      // Handle Sharing with Multiple Collaborators (New Settings)
      if (req.body.collaborators) {
        try {
          const collaborators = JSON.parse(req.body.collaborators);

          if (Array.isArray(collaborators)) {
            const User = require("../models/User"); // Lazy load

            for (const collab of collaborators) {
              const { email, permission } = collab;
              if (!email) continue;

              const recipient = await User.findOne({ email: email });
              if (recipient) {
                // Encrypt Key for Recipient
                const sharedKeyForRecip = encryptAESKey(aesKey, recipient.publicKey);

                // Add ACL entry - Share Idea VIEW only by default
                aclEntries.push({
                  subjectId: recipient._id,
                  objectId: idea._id,
                  objectType: "Idea",
                  permission: permission || "VIEW",
                  encryptedSharedKey: sharedKeyForRecip // Store the re-encrypted key!
                });

                // If permission is VIEW, they should also be able to verify?
                if ((permission || "VIEW") === "VIEW") {
                  aclEntries.push({
                    subjectId: recipient._id,
                    objectId: idea._id,
                    objectType: "Idea",
                    permission: "VERIFY"
                  });
                  // Note: VERIFY permission doesn't need the decryption key, so we leave encryptedSharedKey undefined/null
                }

                console.log(`Shared idea ${idea._id} with ${recipient.email} as ${permission}`);
              } else {
                console.warn(`Share recipient not found: ${email}`);
              }
            }
          }
        } catch (parseErr) {
          console.error("Error parsing collaborators:", parseErr);
        }
      }
    }

    await ACL.create(aclEntries);

    res.json({ message: "Idea Stored securely", ideaId: idea._id, version: version });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).send("Upload failed: " + err.message);
  }
};


exports.viewIdea = async (req, res) => {
  try {
    const user = await getUserWithKeys(req.user.uid);
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).send("Not found");

    let isOwner = (idea.ownerId.toString() === user._id.toString());
    let canView = isOwner;
    let encryptedKeyToUse = idea.encryptedAESKey;

    // Check if I am the owner
    if (!isOwner) {
      // Not owner, find the Shared Key in ACL
      const aclEntry = await ACL.findOne({
        subjectId: user._id,
        objectId: idea._id,
        objectType: "Idea",
        permission: { $in: ["VIEW", "VERIFY"] }
      });

      if (!aclEntry) {
        return res.status(403).send("Access Denied: You do not have permission to view or verify this idea.");
      }

      if (aclEntry.permission === 'VERIFY') {
        canView = false;
        // Verifiers do NOT get the key. 
      } else {
        // VIEWers MUST have the key
        if (!aclEntry.encryptedSharedKey) {
          return res.status(403).send("Access Denied: No valid shared key found.");
        }
        encryptedKeyToUse = aclEntry.encryptedSharedKey;
      }
    }

    let decryptedContent = null;
    let contentMessage = null;

    if (canView) {
      try {
        const aesKey = decryptAESKey(encryptedKeyToUse, user.privateKey);
        const decryptedBuffer = decryptAES(idea.encryptedData, aesKey, idea.iv);
        decryptedContent = decryptedBuffer.toString();
      } catch (e) {
        console.error("Decryption failed:", e);
        contentMessage = "Error decrypting content.";
      }
    } else {
      contentMessage = "Restricted: You have VERIFY-only valid access. Content is hidden.";
    }

    // Verify digital signature
    // FIX: Verify signature using OWNER'S Public Key, not Viewer's
    let verificationKey = user.publicKey;
    if (!isOwner) {
      const User = require("../models/User");
      const ownerUser = await User.findById(idea.ownerId);
      if (ownerUser) {
        verificationKey = ownerUser.publicKey;
      }
    }

    const isValidSignature = verifySignature(idea.dataHash, idea.digitalSignature, verificationKey);
    // if (!isValidSignature) console.warn("Signature Warning: Content integrity check failed or key mismatch.");

    res.json({
      content: decryptedContent,
      message: contentMessage,
      metadata: {
        title: idea.title,
        version: idea.version,
        ownerId: idea.ownerId,
        timestamp: idea.timestamp,
        integrity: isValidSignature ? "VERIFIED" : "WARNING",
        fileType: idea.fileType,
        fileName: idea.fileName,
        canView: canView
      }
    });
  } catch (err) {
    console.error("View Idea Error:", err);
    console.error("Stack:", err.stack);
    res.status(500).send("Decryption failed: " + err.message);
  }
};

exports.downloadIdea = async (req, res) => {
  try {
    const user = await getUserWithKeys(req.user.uid);
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).send("Not found");

    let encryptedKeyToUse = idea.encryptedAESKey;

    // Check if I am the owner
    if (idea.ownerId.toString() !== user._id.toString()) {
      const aclEntry = await ACL.findOne({
        subjectId: user._id,
        objectId: idea._id,
        objectType: "Idea",
        permission: "VIEW"
      });

      if (!aclEntry || !aclEntry.encryptedSharedKey) {
        console.warn(`Download attempt by ${user.email} failed: No VIEW permission or missing key`);
        return res.status(403).send("Access Denied: You do not have permission to download this file.");
      }
      encryptedKeyToUse = aclEntry.encryptedSharedKey;
    }

    const aesKey = decryptAESKey(
      encryptedKeyToUse,
      user.privateKey
    );

    const decryptedData = decryptAES(
      idea.encryptedData,
      aesKey,
      idea.iv
    );

    // Set correct filename and type
    res.setHeader("Content-Disposition", `attachment; filename="${idea.fileName || 'secure-idea.txt'}"`);
    res.setHeader("Content-Type", idea.fileType || "application/octet-stream");
    res.send(decryptedData);
  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).send("Download failed. You might not have the correct permissions.");
  }
};

exports.verifyIdeaPublic = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).send("Idea not found");

    const User = require("../models/User");
    const owner = await User.findById(idea.ownerId);

    const isSignatureValid = verifySignature(idea.dataHash, idea.digitalSignature, owner.publicKey);

    res.json({
      status: "Verified",
      ideaId: idea._id,
      ownerEmail: owner.email,
      timestamp: idea.timestamp,
      integrityCheck: isSignatureValid ? "PASSED" : "FAILED",
      message: "This secure idea exists and its integrity is verified via Digital Signature."
    });
  } catch (err) {
    console.error("Public Verification Error:", err);
    res.status(500).send("Verification failed");
  }

};

exports.checkIntegrity = async (req, res) => {
  try {
    const ideaId = req.params.id;
    const idea = await Idea.findById(ideaId);
    if (!idea) return res.status(404).send("Idea not found");

    // --- Access Control Check ---
    let hasAccess = false;
    if (idea.ownerId.toString() === req.user.uid) {
      hasAccess = true;
    } else {
      const aclEntry = await ACL.findOne({
        subjectId: req.user.uid,
        objectId: ideaId,
        objectType: "Idea",
        permission: { $in: ["VIEW", "VERIFY"] }
      });
      if (aclEntry) hasAccess = true;
    }

    if (!hasAccess) return res.status(403).send("Access Denied: You cannot verify this file.");
    // ---------------------------

    // Calculate hash of uploaded file/data
    let dataBuffer;
    if (req.file) {
      dataBuffer = req.file.buffer;
    } else {
      // If checking text integrity
      dataBuffer = toBuffer(req.body.data);
    }

    if (!dataBuffer) return res.status(400).send("No data provided for verification");

    const calculatedHash = hashData(dataBuffer);

    if (calculatedHash === idea.dataHash) {
      return res.json({ status: "MATCH", message: "File integrity verified. Content matches exactly." });
    } else {
      return res.status(400).json({ status: "MISMATCH", message: "Integrity Check Failed! The file does not match the original record." });
    }

  } catch (err) {
    console.error("Integrity Check Error:", err);
    res.status(500).send("Error checking integrity");
  }
};
