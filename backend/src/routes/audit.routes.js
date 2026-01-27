const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const acl = require("../middleware/acl.middleware");
const AuditLog = require("../models/AuditLog");

// View Audit Logs: Requires 'VIEW' permission on 'AuditLog' object type
// The ACL entry must exist for (subject=User, object=IdeaId, objectType='AuditLog')
router.get("/:id/audit", auth, acl("VIEW", "AuditLog"), async (req, res) => {
    try {
        const logs = await AuditLog.find({ resourceId: req.params.id })
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).send("Error fetching audit logs");
    }
});

module.exports = router;
