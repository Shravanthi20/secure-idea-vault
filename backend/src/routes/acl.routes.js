const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const acl = require("../middleware/acl.middleware");
const { grantAccess } = require("../controllers/acl.controller");
router.post("/grant", auth, acl("VERIFY"), grantAccess);
module.exports = router;
