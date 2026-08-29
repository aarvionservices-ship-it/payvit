const express = require("express");
const router = express.Router();

const authenticate            = require("../../../middlewares/auth.middleware");
const kycController           = require("../controller/kyc.controller");
const panKycController        = require("../controller/panKyc.controller");
const videoKycController      = require("../controller/videoKyc.controller");
const faceVerificationController = require("../controller/faceVerification.controller");

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
//   Body: { sessionId, image (base64), mimeType, task: "pan_ocr"|"liveness"|"face_match"|"anti_spoof" }
//   Upload PAN card image (OCR) or selfie (liveness/anti-spoof/face match check)
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

// ─── Module 3: Face & Liveness Verification ──────────────────────────────────
// POST /api/v1/kyc/face/capture-selfie
//   Body: { image (base64), mimeType }
router.post("/face/capture-selfie", authenticate, faceVerificationController.captureSelfie);

// POST /api/v1/kyc/face/liveness-check
//   Body: { image (base64), mimeType, type: "passive"|"active", challengeType }
router.post("/face/liveness-check", authenticate, faceVerificationController.detectLiveness);

// GET  /api/v1/kyc/face/active-challenge
//   Generates a randomized active liveness challenge
router.get("/face/active-challenge", authenticate, faceVerificationController.getActiveChallenge);

// POST /api/v1/kyc/face/verify-active-challenge
//   Body: { challengeId, image (base64), mimeType }
router.post("/face/verify-active-challenge", authenticate, faceVerificationController.verifyActiveChallenge);

// POST /api/v1/kyc/face/anti-spoof
//   Body: { image (base64), mimeType }
router.post("/face/anti-spoof", authenticate, faceVerificationController.checkAntiSpoof);

// POST /api/v1/kyc/face/match
//   Body: { selfieImage (base64), selfieMime, documentImage (base64), documentMime, threshold }
router.post("/face/match", authenticate, faceVerificationController.matchFaces);

// POST /api/v1/kyc/face/verify
//   Body: { selfieImage, selfieMime, documentImage, documentMime, challengeId, threshold }
//   All-in-one pipeline: Quality -> Anti-Spoof -> Liveness -> 1:1 Face Match
router.post("/face/verify", authenticate, faceVerificationController.verifyFullFace);

module.exports = router;
