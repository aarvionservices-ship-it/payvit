const express = require("express");
const router = express.Router();

const authenticate = require("../../../middlewares/auth.middleware");
const kycController = require("../controller/kyc.controller");

// POST /api/v1/kyc/initiate   — user authenticated, body: { aadhaarNumber }
router.post("/initiate", authenticate, kycController.initiateKyc);

// POST /api/v1/kyc/verify-otp — user authenticated, body: { otp }
router.post("/verify-otp", authenticate, kycController.verifyOtp);

// GET  /api/v1/kyc/status     — user authenticated
router.get("/status", authenticate, kycController.getStatus);

module.exports = router;
