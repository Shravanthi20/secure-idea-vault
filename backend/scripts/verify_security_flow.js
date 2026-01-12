const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';
let AUTH_TOKEN = '';
let USER_EMAIL = `testuser_${Date.now()}@example.com`;
let USER_PASS = 'TestPass123!';

async function runTest() {
    try {
        console.log("1. Registering User...");
        await axios.post(`${BASE_URL}/auth/register`, {
            email: USER_EMAIL,
            password: USER_PASS
        });
        console.log("   Registration Successful.");

        console.log("2. Logging In...");
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASS
        });
        console.log("   Login Initialized. Response data:", loginRes.data);

        const otp = loginRes.data.otp;
        if (!otp) throw new Error("OTP not received in test mode response!");
        console.log(`   OTP Received: ${otp}`);

        console.log("3. Verifying OTP...");
        const verifyRes = await axios.post(`${BASE_URL}/auth/verify-otp`, {
            email: USER_EMAIL,
            otp: otp
        });
        AUTH_TOKEN = verifyRes.data.token;
        console.log("   OTP Verified. Token received.");

        console.log("4. Uploading Idea...");
        const ideaRes = await axios.post(`${BASE_URL}/ideas/upload`, {
            data: "This is a secure research idea."
        }, {
            headers: { Authorization: AUTH_TOKEN }
        });
        const ideaId = ideaRes.data.ideaId;
        console.log(`   Idea Uploaded. ID: ${ideaId}`);

        console.log("5. Generating QR Code...");
        const qrRes = await axios.get(`${BASE_URL}/ideas/${ideaId}/qrcode`, {
            headers: { Authorization: AUTH_TOKEN }
        });
        if (qrRes.data.qrCode && qrRes.data.qrCode.startsWith('data:image/png;base64')) {
            console.log("   QR Code Generated Successfully (Base64 data received).");
        } else {
            throw new Error("Invalid QR Code response");
        }

        console.log("\n✅ ALL SECURITY CHECKS PASSED!");

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        if (error.response) {
            console.error("   Response Data:", error.response.data);
            console.error("   Response Status:", error.response.status);
        }
        process.exit(1);
    }
}

runTest();
