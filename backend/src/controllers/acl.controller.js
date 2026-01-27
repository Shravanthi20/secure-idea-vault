const ACL = require("../models/ACL");
const User = require("../models/User");
const Idea = require("../models/Idea");

// GET /api/acl/:ideaId
exports.getAccessList = async (req, res) => {
    try {
        const { ideaId } = req.params;
        // Verify Owner
        const idea = await Idea.findById(ideaId);
        if (!idea) return res.status(404).send("Idea not found");
        if (idea.ownerId.toString() !== req.user.uid) return res.status(403).send("Only owner can view access list");

        const acl = await ACL.find({ objectId: ideaId }).populate("subjectId", "email");
        res.json(acl);
    } catch (err) {
        res.status(500).send("Error fetching ACL");
    }
};

// POST /api/acl/:ideaId
exports.grantAccess = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const { email, permissions } = req.body;

        // 1. Verify Owner and Get Owner's Private Key
        const { getUserWithKeys } = require("../utils/user.util");
        const { decryptAESKey, encryptAESKey } = require("../services/crypto.service");

        const owner = await getUserWithKeys(req.user.uid);
        const idea = await Idea.findById(ideaId);

        if (!idea) return res.status(404).send("Idea not found");
        if (idea.ownerId.toString() !== req.user.uid) return res.status(403).send("Only owner can grant access");

        // 2. Find Recipient and Get Public Key
        const recipient = await User.findOne({ email });
        if (!recipient) return res.status(404).send("User not found");

        // 3. Prepare Encrypted Key for Sharing (Access to IDEA object only)
        let sharedKeyForRecipient = null;
        try {
            // Decrypt the Master AES Key using Owner's Private Key
            const aesKeyString = decryptAESKey(idea.encryptedAESKey, owner.privateKey);
            // Encrypt for Recipient
            sharedKeyForRecipient = encryptAESKey(aesKeyString, recipient.publicKey);
        } catch (e) {
            console.error("Owner key decryption failed during share:", e);
            return res.status(500).send("Internal Encryption Error: Cannot decrypt file key.");
        }

        let addedCount = 0;
        if (Array.isArray(permissions)) {
            for (const p of permissions) {
                // Construct the ACL entry object
                const updateData = {
                    subjectId: recipient._id,
                    objectId: ideaId,
                    objectType: p.objectType,
                    permission: p.permission
                };

                // !!! KEY DISTRIBUTION POINT !!! 
                // If granting access to the IDEA itself, include the key encrypted for the recipient
                if (p.objectType === 'Idea' || p.objectType === 'IdeaVersion') {
                    updateData.encryptedSharedKey = sharedKeyForRecipient;
                }

                // Upsert: Create if not exists, Update if exists (to fix missing keys)
                await ACL.findOneAndUpdate(
                    {
                        subjectId: recipient._id,
                        objectId: ideaId,
                        objectType: p.objectType,
                        permission: p.permission
                    },
                    updateData,
                    { upsert: true, new: true }
                );
                addedCount++;
            }
        }

        res.json({ message: "Access granted", added: addedCount });
    } catch (err) {
        console.error("Grant Access Error:", err);
        res.status(500).send("Error granting access");
    }
};

// DELETE /api/acl/:id (Delete specific ACL entry)
exports.revokeAccess = async (req, res) => {
    try {
        const aclId = req.params.id;
        const aclEntry = await ACL.findById(aclId).populate("objectId"); // Populate to check owner of the Idea
        if (!aclEntry) return res.status(404).send("Entry not found");

        // Verify Owner of the Resource (Idea)
        const idea = await Idea.findById(aclEntry.objectId); // Actually aclEntry.objectId might be just ID if not populated deep enough?
        // Wait, ACLSchema: objectId ref Idea.
        // We need to check if req.user.uid === idea.ownerId

        // Let's refetch Idea to be sure
        const realIdea = await Idea.findById(aclEntry.objectId);
        if (!realIdea) return res.status(404).send("Resource not found");

        if (realIdea.ownerId.toString() !== req.user.uid) {
            return res.status(403).send("Only owner can revoke access");
        }

        // Prevent revoking Owner's own access?
        if (aclEntry.subjectId.toString() === realIdea.ownerId.toString()) {
            return res.status(400).send("Cannot revoke owner access");
        }

        await ACL.findByIdAndDelete(aclId);
        res.send("Access revoked");
    } catch (err) {
        res.status(500).send("Error revoking access");
    }
};