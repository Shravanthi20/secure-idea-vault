const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const acl = require("../middleware/acl.middleware");
const upload = require("../middleware/upload.middleware");
const { uploadIdea, viewIdea, downloadIdea, listIdeas } = require("../controllers/idea.controller");
const audit = require("../middleware/audit.middleware");

router.get("/", auth, listIdeas);
router.post("/upload", auth, acl("UPLOAD"), upload.single("file"), audit("UPLOAD"), uploadIdea);

router.get("/:id", auth, acl("VIEW"), audit("VIEW"), viewIdea);

const { generateQRCode, verifyIdeaPublic } = require("../controllers/idea.controller");
router.get("/:id/qrcode", auth, acl("VERIFY"), audit("VIEW"), generateQRCode);
router.get("/:id/verify", verifyIdeaPublic); // Public access for QR Code verification

router.get("/download/:id", auth, acl("VIEW"), audit("DOWNLOAD"), downloadIdea);
module.exports = router;
