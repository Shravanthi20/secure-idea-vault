const crypto= require("crypto");

exports.generateOTP=()=>{
    return crypto.randomInt(100000, 999999).toString();

};

exports.hashOTP= ()=>{
    return crypto.createHash("sha256").update(otp).digest("hex");

};