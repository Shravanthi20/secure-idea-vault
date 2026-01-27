const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getAccessList, grantAccess, revokeAccess } = require("../controllers/acl.controller");

router.get("/:ideaId", auth, getAccessList);
router.post("/:ideaId", auth, grantAccess);
router.delete("/:id", auth, revokeAccess);

module.exports = router;
