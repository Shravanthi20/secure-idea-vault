const router= require("express").Router();
const {register, login, verifyOTP}= require("../controllers/auth.controller");
router.post("/register", register);
router.post("/login", login);
router.post("/verify-post",verifyOTP);
module.exports= router;