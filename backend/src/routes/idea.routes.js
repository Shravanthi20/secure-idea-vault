const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const acl = require("../middleware/acl.middleware");
const upload = require("../middleware/upload.middleware");
const { uploadIdea, viewIdea, listIdeas, generateQRCode, checkIntegrity, verifyIdeaPublic, downloadIdea } = require("../controllers/idea.controller");
const audit = require("../middleware/audit.middleware");

router.get("/", auth, listIdeas);
router.post("/upload", auth, acl("UPLOAD"), upload.single("file"), audit("UPLOAD"), uploadIdea);

// acl("VIEW") removed effectively because controller now handles granular VIEW vs VERIFY check
router.get("/:id", auth, audit("VIEW"), viewIdea);
router.post("/:id/integrity", auth, upload.single("file"), checkIntegrity);
router.get("/download/:id", auth, acl("VIEW"), audit("DOWNLOAD"), downloadIdea);
router.get("/:id/qrcode", auth, acl("VERIFY"), audit("VIEW"), generateQRCode);
router.get("/:id/verify", verifyIdeaPublic); // Public access for QR Code verification

router.get("/download/:id", auth, acl("VIEW"), audit("DOWNLOAD"), downloadIdea);
module.exports = router;
