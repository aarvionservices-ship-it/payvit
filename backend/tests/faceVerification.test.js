/**
 * faceVerification.test.js
 *
 * Test suite for Module 3: Face and Liveness Verification
 */

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const faceVerificationService = require("../src/modules/kyc/service/faceVerification.service");
const videoKycService = require("../src/modules/kyc/service/videoKyc.service");
const VideoKycSession = require("../src/modules/kyc/model/VideoKycSession.model");
const config = require("../src/core/config/env.config");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const JWT_SECRET =
    process.env.JWT_ACCESS_SECRET ||
    "345e972cbbab29aa0d9c3b620f1fc6af148277c66cefa11c23d87c848f2ecd2e170a730030622b51494ea0867239aad72a3f8b43a77c95bff6d3e17b8c95217b";

const User = require("../src/modules/auth/model/auth.model");

function generateToken(userId, role = "customer") {
    return jwt.sign({ userId, role }, JWT_SECRET, {
        expiresIn: "1h"
    });
}

// Generate valid 5KB base64 JPEG mock image
const VALID_BASE64_IMAGE = Buffer.alloc(5 * 1024, "a").toString("base64");
const VALID_DOC_BASE64 = Buffer.alloc(6 * 1024, "b").toString("base64");

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("Module 3: Face and Liveness Verification", () => {
    const testUserId = "usr_test_face_1001";
    let token;

    beforeEach(async () => {
        token = generateToken(testUserId);
        process.env.VIDEO_KYC_MOCK_MODE = "true";

        await User.create({
            userId: testUserId,
            name: "Face Test User",
            email: "face.test@payvit.test",
            phone: "9876543210",
            password: "hashed_dummy",
            role: "customer"
        });
    });

    describe("1. Image Quality & Format Validation", () => {
        it("should validate a valid base64 image and return hash and quality metadata", () => {
            const result = faceVerificationService.validateImageQuality(VALID_BASE64_IMAGE, "image/jpeg");
            expect(result).toHaveProperty("cleanedBase64");
            expect(result.cleanedMime).toBe("image/jpeg");
            expect(result).toHaveProperty("imageHash");
            expect(result.quality.faceDetected).toBeUndefined(); // added at capture stage
            expect(result.quality.isResolutionAcceptable).toBe(false); // < 10KB
        });

        it("should strip data URI prefixes correctly", () => {
            const dataUri = `data:image/png;base64,${VALID_BASE64_IMAGE}`;
            const result = faceVerificationService.validateImageQuality(dataUri);
            expect(result.cleanedMime).toBe("image/png");
            expect(result.cleanedBase64).toBe(VALID_BASE64_IMAGE);
        });

        it("should reject unsupported image formats", () => {
            expect(() => {
                faceVerificationService.validateImageQuality(VALID_BASE64_IMAGE, "image/gif");
            }).toThrow(/Unsupported image format/);
        });

        it("should reject empty or missing image data", () => {
            expect(() => {
                faceVerificationService.validateImageQuality("", "image/jpeg");
            }).toThrow(/Image data is required/);
        });

        it("should reject image below minimum byte threshold", () => {
            const tinyImage = Buffer.from("small").toString("base64");
            expect(() => {
                faceVerificationService.validateImageQuality(tinyImage, "image/jpeg");
            }).toThrow(/Image resolution or file size is too low/);
        });
    });

    describe("2. Selfie Capture (POST /api/v1/kyc/face/capture-selfie)", () => {
        it("should capture and register selfie with metadata", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/face/capture-selfie")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    image: VALID_BASE64_IMAGE,
                    mimeType: "image/jpeg"
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.captured).toBe(true);
            expect(res.body.data.selfieId).toMatch(/^slf_/);
            expect(res.body.data.quality.faceDetected).toBe(true);
        });

        it("should require authentication", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/face/capture-selfie")
                .send({ image: VALID_BASE64_IMAGE, mimeType: "image/jpeg" });

            expect(res.status).toBe(401);
        });
    });

    describe("3. Liveness Detection (POST /api/v1/kyc/face/liveness-check)", () => {
        it("should pass passive liveness detection in mock mode", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/face/liveness-check")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    image: VALID_BASE64_IMAGE,
                    mimeType: "image/jpeg",
                    type: "passive"
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.passed).toBe(true);
            expect(res.body.data.confidence).toBeGreaterThanOrEqual(0.9);
            expect(res.body.data.type).toBe("passive");
        });
    });

    describe("4. Active Liveness Challenges", () => {
        it("should generate a randomized active challenge", async () => {
            const res = await request(app)
                .get("/api/v1/kyc/face/active-challenge")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty("challengeId");
            expect(res.body.data.challenge).toHaveProperty("type");
            expect(res.body.data.challenge).toHaveProperty("instruction");
        });

        it("should verify an active challenge response", async () => {
            // 1. Get challenge
            const chalRes = await request(app)
                .get("/api/v1/kyc/face/active-challenge")
                .set("Authorization", `Bearer ${token}`);

            const { challengeId } = chalRes.body.data;

            // 2. Submit verification
            const verifyRes = await request(app)
                .post("/api/v1/kyc/face/verify-active-challenge")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    challengeId,
                    image: VALID_BASE64_IMAGE,
                    mimeType: "image/jpeg"
                });

            expect(verifyRes.status).toBe(200);
            expect(verifyRes.body.success).toBe(true);
            expect(verifyRes.body.data.passed).toBe(true);
            expect(verifyRes.body.data.challengeId).toBe(challengeId);
        });

        it("should reject an invalid or expired challengeId", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/face/verify-active-challenge")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    challengeId: "chl_invalid_9999",
                    image: VALID_BASE64_IMAGE,
                    mimeType: "image/jpeg"
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Invalid or expired challenge ID/);
        });
    });

    describe("5. Anti-Spoof Checks (POST /api/v1/kyc/face/anti-spoof)", () => {
        it("should pass anti-spoof check on clean image capture", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/face/anti-spoof")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    image: VALID_BASE64_IMAGE,
                    mimeType: "image/jpeg"
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.passed).toBe(true);
            expect(res.body.data.isSpoofDetected).toBe(false);
            expect(res.body.data.spoofRiskScore).toBeLessThan(0.3);
        });
    });

    describe("6. AI 1:1 Face Match (POST /api/v1/kyc/face/match)", () => {
        it("should match selfie against document image above threshold", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/face/match")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    selfieImage: VALID_BASE64_IMAGE,
                    selfieMime: "image/jpeg",
                    documentImage: VALID_DOC_BASE64,
                    documentMime: "image/jpeg",
                    threshold: 0.75
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.isMatch).toBe(true);
            expect(res.body.data.similarityScore).toBeGreaterThanOrEqual(0.75);
            expect(res.body.data.similarityPercentage).toBeDefined();
        });

        it("should handle custom thresholds", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/face/match")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    selfieImage: VALID_BASE64_IMAGE,
                    selfieMime: "image/jpeg",
                    documentImage: VALID_DOC_BASE64,
                    documentMime: "image/jpeg",
                    threshold: 0.90
                });

            expect(res.status).toBe(200);
            expect(res.body.data.threshold).toBe(0.90);
        });
    });

    describe("7. Full Face Pipeline (POST /api/v1/kyc/face/verify)", () => {
        it("should execute complete verification pipeline successfully", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/face/verify")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    selfieImage: VALID_BASE64_IMAGE,
                    selfieMime: "image/jpeg",
                    documentImage: VALID_DOC_BASE64,
                    documentMime: "image/jpeg",
                    threshold: 0.75
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.verified).toBe(true);
            expect(res.body.data.selfie.captured).toBe(true);
            expect(res.body.data.antiSpoof.passed).toBe(true);
            expect(res.body.data.liveness.passed).toBe(true);
            expect(res.body.data.faceMatch.isMatch).toBe(true);
        });
    });

    describe("8. Video KYC Session Image Pipeline Integration", () => {
        let sessionId;

        beforeEach(async () => {
            const sessionRes = await videoKycService.startSession(testUserId);
            sessionId = sessionRes.sessionId;
            // Advance stage to LIVENESS_CHECK
            await VideoKycSession.findOneAndUpdate(
                { sessionId },
                { $set: { stage: "LIVENESS_CHECK" } }
            );
        });

        it("should process anti_spoof task in Video KYC session", async () => {
            const res = await videoKycService.uploadImage(
                sessionId,
                testUserId,
                VALID_BASE64_IMAGE,
                "image/jpeg",
                "anti_spoof",
                "127.0.0.1"
            );

            expect(res.extractedData.antiSpoofPassed).toBe(true);
            const session = await VideoKycSession.findOne({ sessionId });
            expect(session.antiSpoof.passed).toBe(true);
        });

        it("should process face_match task in Video KYC session", async () => {
            const res = await videoKycService.uploadImage(
                sessionId,
                testUserId,
                VALID_BASE64_IMAGE,
                "image/jpeg",
                "face_match",
                "127.0.0.1"
            );

            expect(res.extractedData.faceMatched).toBe(true);
            const session = await VideoKycSession.findOne({ sessionId });
            expect(session.faceMatch.isMatched).toBe(true);
        });
    });
});
