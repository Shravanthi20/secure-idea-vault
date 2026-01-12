const ACL = require("../models/ACL");

/*
  requiredPermission → VIEW / UPLOAD / VERIFY
*/
module.exports = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.uid;
      const ideaId = req.params.id || req.body.ideaId;

      if (req.user.role === "ADMIN") {
        return next();
      }
      if (req.user.role === "OWNER" && requiredPermission === "UPLOAD") {
        return next();
      }
      const aclEntry = await ACL.findOne({
        subjectId: userId,
        objectId: ideaId,
        permission: requiredPermission
      });

      if (!aclEntry) {
        return res.status(403).send("Access denied");
      }

      next();
    } catch (err) {
      res.status(500).send("Authorization error");
    }
  };
};
