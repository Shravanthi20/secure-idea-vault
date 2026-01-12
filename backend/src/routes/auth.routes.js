const router = require("express").Router();
const { register, login, verifyOTP } = require("../controllers/auth.controller");
const rateLimit = require("../middleware/rateLimit.middleware");
router.post("/register", register);
router.post("/verify-otp", rateLimit, verifyOTP);
router.post("/login", rateLimit, login);
module.exports = router;