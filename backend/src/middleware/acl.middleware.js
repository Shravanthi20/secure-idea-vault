const ACL = require("../models/ACL");
const mongoose = require("mongoose");

/*
  requiredPermission → VIEW / UPLOAD / VERIFY
  resourceType → Idea / Comment / AuditLog (Default: Idea)
*/
module.exports = (requiredPermission, resourceType = "Idea") => {
  return async (req, res, next) => {
    try {
      if (req.user.role === "ADMIN") {
        return next();
      }
      if (req.user.role === "OWNER" && requiredPermission === "UPLOAD") {
        return next();
      }

      const userId = req.user.uid;
      const ideaId = req.params.id || (req.body && req.body.ideaId);

      if (!ideaId) {
        return res.status(400).send("Missing Idea ID");
      }

      if (!mongoose.isValidObjectId(ideaId)) {
        return res.status(400).send("Invalid Idea ID format");
      }

      const aclEntry = await ACL.findOne({
        subjectId: userId,
        objectId: ideaId,
        objectType: resourceType,
        permission: requiredPermission
      });

      if (!aclEntry) {
        return res.status(403).send(`Access denied for ${resourceType}`);
      }

      next();
    } catch (err) {
      console.error("ACL Middleware Crash:", err);
      res.status(500).send("Authorization error");
    }
  };
};
