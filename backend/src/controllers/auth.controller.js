const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const OTPSession = require("../models/OTPSession");
const { generateOTP, hashOTP, sendOTPEmail } = require("../services/otp.service");


const { generateRSAKeys, encryptAES, encryptAESKey } = require("../services/crypto.service");

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).send("User already exists");

        if (!password || password.length < 12) {
            return res.status(400).send("Password must be at least 12 characters long");
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).send("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
        }

        const salt = crypto.randomBytes(16).toString("hex");
        const passwordHash = await bcrypt.hash(password + salt, 12);

        // Generate RSA pair
        const { publicKey, privateKey } = generateRSAKeys();
        const masterKey = crypto.createHash("sha256").update(process.env.JWT_SECRET).digest(); // 32 bytes
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-cbc", masterKey, iv);
        const encryptedPrivateKey = Buffer.concat([cipher.update(privateKey), cipher.final()]);

        await User.create({
            email,
            passwordHash,
            salt,
            role: "OWNER",
            publicKey,
            encryptedPrivateKey,
            privateKeyIV: iv
        });
        res.send("Registered");
    } catch (err) {
        console.error(err);
        res.status(500).send("Registration failed");
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Invalid user");
    const valid = await bcrypt.compare(password + user.salt, user.passwordHash);
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