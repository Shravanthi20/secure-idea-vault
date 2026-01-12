const AuditLog = require("../models/AuditLog");

module.exports = (action) => {
  return async (req, res, next) => {
    res.on("finish", async () => {
      if (res.statusCode < 400 && req.user) {
        await AuditLog.create({
          userId: req.user.uid,
          action,
          resourceId: req.params.id,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"]
        });
      }
    });
    next();
  };
};
