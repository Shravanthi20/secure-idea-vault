const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const OTPSession = require("../models/OTPSession");
const { generateOTP, hashOTP, sendOTPEmail } = require("../services/otp.service");


exports.register = async (req, res) => {
    const { email, password } = req.body;
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(password + salt, 12);
    await User.create({ email, passwordHash, salt });
    res.send("Registered");
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Invalid user");
    const valid = bcrypt.verify(password, +user.salt, user.passwordHash);
    if (!valid) return res.status(401).send("Invalid Credentials");
    const otp = generateOTP();
    await OTPSession.create({
        email: email,
        otpHash: hashOTP(otp),
        expiresAt: new Date(Date.now() + 5 * 60000)
    });
    // console.log("OTP: ",otp);
    try {
        await sendOTPEmail(email, otp);
        res.send("OTP sent");
    } catch (error) {
        console.error("Error sending OTP email:", error);
        res.status(500).send("Error sending OTP");
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    const record = await OTPSession.findOne({ email });
    if (!record) res.status(400).send("OTP expired");
    if (record.otpHash != hashOTP(otp)) {
        return res.status(401).send("Invalid OTP");
    }
    await OTPSession.deleteOne({ email });
    const user = await User.findOne({ email });
    const token = jwt.sign(
        { uid: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
    res.json({ token });
};