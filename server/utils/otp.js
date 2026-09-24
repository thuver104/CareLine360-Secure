const crypto = require("crypto");

// VULNARABLE CODE
// const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000)); // 6 digit

//VULNARABLE FIXED
// Cryptographically secure 6-digit OTP (CWE-338 fix)
const generateOtp = () => String(crypto.randomInt(100000, 1000000));


const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

module.exports = { generateOtp, hashOtp };
