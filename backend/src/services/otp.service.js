const crypto= require("crypto");

exports.generateOTP=()=>{
    return crypto.randomInt(100000, 999999).toString();

};

exports.hashOTP= (otp)=>{
    return crypto.createHash("sha256").update(otp).digest("hex");
};

const nodemailer = require("nodemailer");

exports.sendOTPEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for Secure Idea Vault",
        text: `Your OTP is: ${otp}. It expires in 5 minutes.`
    };

    await transporter.sendMail(mailOptions);
};