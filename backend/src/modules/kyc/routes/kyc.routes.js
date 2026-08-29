const express = require("express");
const router = express.Router();

const authenticate        = require("../../../middlewares/auth.middleware");
const kycController       = require("../controller/kyc.controller");
const panKycController    = require("../controller/panKyc.controller");
const videoKycController  = require("../controller/videoKyc.controller");

// ─── Aadhaar KYC ─────────────────────────────────────────────────────────────
// POST /api/v1/kyc/initiate       — body: { aadhaarNumber }
router.post("/initiate", authenticate, kycController.initiateKyc);

// POST /api/v1/kyc/verify-otp     — body: { otp }
router.post("/verify-otp", authenticate, kycController.verifyOtp);

// GET  /api/v1/kyc/status
router.get("/status", authenticate, kycController.getStatus);

// ─── PAN KYC (form-based) ────────────────────────────────────────────────────
// POST /api/v1/kyc/pan/start-session
router.post("/pan/start-session", authenticate, panKycController.startSession);

// GET  /api/v1/kyc/pan/session/:sessionId
router.get("/pan/session/:sessionId", authenticate, panKycController.getSession);

// POST /api/v1/kyc/pan/verify-details — body: { sessionId, panNumber, nameOnPAN, answers }
router.post("/pan/verify-details", authenticate, panKycController.verifyDetails);

// POST /api/v1/kyc/pan/verify-otp     — body: { sessionId, otp }
router.post("/pan/verify-otp", authenticate, panKycController.verifyOtp);

// POST /api/v1/kyc/pan/resend-otp     — body: { sessionId }
router.post("/pan/resend-otp", authenticate, panKycController.resendOtp);

// ─── Video KYC AI Agent ───────────────────────────────────────────────────────
// POST /api/v1/kyc/video/start-session
//   Creates a new AI-driven video KYC session; returns sessionId + first agent message
router.post("/video/start-session", authenticate, videoKycController.startSession);

// POST /api/v1/kyc/video/chat
//   Body: { sessionId, message }
//   Send a text message to the AI agent; drives the state machine forward
router.post("/video/chat", authenticate, videoKycController.chat);

// POST /api/v1/kyc/video/upload-image
//   Body: { sessionId, image (base64), mimeType, task: "pan_ocr"|"liveness" }
//   Upload PAN card image (OCR) or selfie (liveness check)
router.post("/video/upload-image", authenticate, videoKycController.uploadImage);

// POST /api/v1/kyc/video/verify-otp
//   Body: { sessionId, otp }
//   Submit 6-digit OTP to complete Video KYC verification
router.post("/video/verify-otp", authenticate, videoKycController.verifyOtp);

// POST /api/v1/kyc/video/resend-otp
//   Body: { sessionId }
//   Resend OTP for the current session (max 3 times)
router.post("/video/resend-otp", authenticate, videoKycController.resendOtp);

// GET  /api/v1/kyc/video/session/:sessionId
//   Returns full session state for polling / re-hydration
router.get("/video/session/:sessionId", authenticate, videoKycController.getSession);

module.exports = router;
