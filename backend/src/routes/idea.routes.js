const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const acl = require("../middleware/acl.middleware");
const upload = require("../middleware/upload.middleware");
const { uploadIdea, viewIdea, downloadIdea } = require("../controllers/idea.controller");
const audit = require("../middleware/audit.middleware");
router.post("/upload", auth, acl("UPLOAD"), upload.single("file"), audit("UPLOAD"), uploadIdea);

router.get("/:id", auth, acl("VIEW"), audit("VIEW"), viewIdea);

const { generateQRCode } = require("../controllers/idea.controller");
router.get("/:id/qrcode", auth, acl("VERIFY"), audit("VIEW"), generateQRCode);

router.get("/download/:id", auth, acl("VIEW"), audit("DOWNLOAD"), downloadIdea);
module.exports = router;
