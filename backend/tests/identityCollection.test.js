/**
 * identityCollection.test.js
 *
 * Test suite for Module 2: Identity Collection
 * Tests:
 *   1. Aadhaar capture & Verhoeff validation
 *   2. eKYC response ingestion & CustomerProfile sync
 *   3. PAN capture, validation & name matching
 *   4. Original PAN card image upload, OCR, and authenticity verification
 *   5. Aadhaar image upload (front & back) with masking compliance
 *   6. Overall Identity Collection Status
 */

const request                   = require("supertest");
const jwt                       = require("jsonwebtoken");
const app                       = require("../src/app");
const identityCollectionService = require("../src/modules/kyc/service/identityCollection.service");
const Kyc                       = require("../src/modules/kyc/model/kyc.model");
const CustomerProfile           = require("../src/modules/user/model/customerProfile.model");
const User                      = require("../src/modules/auth/model/auth.model");
const agent                     = require("../src/modules/kyc/service/videoKycAgent.service");

const JWT_SECRET =
    process.env.JWT_ACCESS_SECRET ||
    "345e972cbbab29aa0d9c3b620f1fc6af148277c66cefa11c23d87c848f2ecd2e170a730030622b51494ea0867239aad72a3f8b43a77c95bff6d3e17b8c95217b";

function generateToken(userId, role = "customer") {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1h" });
}

// 5 KB test base64 image
const MOCK_BASE64_IMAGE = Buffer.alloc(5 * 1024, "a").toString("base64");
const MOCK_DOC_BASE64   = Buffer.alloc(6 * 1024, "b").toString("base64");

describe("Module 2: Identity Collection", () => {
    const testUserId  = "usr_id_test_2001";
    const otherUserId = "usr_id_test_2002";
    let token;
    let otherToken;

    beforeEach(async () => {
        token      = generateToken(testUserId);
        otherToken = generateToken(otherUserId);
        process.env.VIDEO_KYC_MOCK_MODE = "true";

        // Seed users
        await User.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
        await Kyc.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
        await CustomerProfile.deleteMany({ userId: { $in: [testUserId, otherUserId] } });

        await User.create({
            userId: testUserId,
            name: "Varsha Sharma",
            email: "varsha.id@payvit.test",
            phone: "9876543210",
            password: "hashedPassword123",
            role: "customer"
        });

        await User.create({
            userId: otherUserId,
            name: "Other User",
            email: "other.id@payvit.test",
            phone: "9876543211",
            password: "hashedPassword123",
            role: "customer"
        });
    });

    afterAll(async () => {
        await User.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
        await Kyc.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
        await CustomerProfile.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    });

    // ─── 1. Aadhaar Number Capture ────────────────────────────────────────────
    describe("POST /api/v1/kyc/identity/aadhaar", () => {
        it("should reject invalid Aadhaar number formats", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/identity/aadhaar")
                .set("Authorization", `Bearer ${token}`)
                .send({ aadhaarNumber: "12345" })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("12 numeric digits");
        });

        it("should reject invalid Verhoeff checksum for non-sandbox Aadhaar", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/identity/aadhaar")
                .set("Authorization", `Bearer ${token}`)
                .send({ aadhaarNumber: "123456789012" })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("checksum");
        });

        it("should successfully capture and encrypt valid test Aadhaar number", async () => {
            const validAadhaar = "999999990019";
            const res = await request(app)
                .post("/api/v1/kyc/identity/aadhaar")
                .set("Authorization", `Bearer ${token}`)
                .send({ aadhaarNumber: validAadhaar })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.aadhaarLast4).toBe("0019");

            const storedKyc = await Kyc.findOne({ userId: testUserId });
            expect(storedKyc).not.toBeNull();
            expect(storedKyc.aadhaarLast4).toBe("0019");
            expect(storedKyc.aadhaarEncrypted).toBeDefined();
            expect(storedKyc.getDecryptedAadhaar()).toBe(validAadhaar);
        });

        it("should prevent linking the same Aadhaar to multiple accounts", async () => {
            const validAadhaar = "999999990019";

            // First user captures Aadhaar
            await request(app)
                .post("/api/v1/kyc/identity/aadhaar")
                .set("Authorization", `Bearer ${token}`)
                .send({ aadhaarNumber: validAadhaar })
                .expect(200);

            // Second user tries to capture same Aadhaar
            const res = await request(app)
                .post("/api/v1/kyc/identity/aadhaar")
                .set("Authorization", `Bearer ${otherToken}`)
                .send({ aadhaarNumber: validAadhaar })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("already linked to another account");
        });
    });

    // ─── 2. eKYC Response Capture ─────────────────────────────────────────────
    describe("POST /api/v1/kyc/identity/ekyc-response", () => {
        it("should reject eKYC payload without required demographic fields", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/identity/ekyc-response")
                .set("Authorization", `Bearer ${token}`)
                .send({ source: "otp_online" })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("name and date of birth");
        });

        it("should ingest valid eKYC response and synchronize CustomerProfile", async () => {
            const ekycData = {
                source: "otp_online",
                name: "Varsha Sharma",
                dob: "1998-05-15",
                gender: "FEMALE",
                aadhaarLast4: "0019",
                txnId: "txn_mock_99990019",
                address: {
                    house: "Flat 101",
                    street: "MG Road",
                    landmark: "Near Metro",
                    district: "Bengaluru",
                    state: "Karnataka",
                    pincode: "560001"
                }
            };

            const res = await request(app)
                .post("/api/v1/kyc/identity/ekyc-response")
                .set("Authorization", `Bearer ${token}`)
                .send(ekycData)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.nameOnAadhaar).toBe("Varsha Sharma");
            expect(res.body.data.status).toBe("verified");

            // Verify Kyc record in DB
            const kyc = await Kyc.findOne({ userId: testUserId });
            expect(kyc.status).toBe("verified");
            expect(kyc.nameOnAadhaar).toBe("Varsha Sharma");
            expect(kyc.genderOnAadhaar).toBe("female");
            expect(kyc.ekycData.source).toBe("otp_online");

            // Verify CustomerProfile synchronization
            const profile = await CustomerProfile.findOne({ userId: testUserId });
            expect(profile).not.toBeNull();
            expect(profile.gender).toBe("female");
            expect(profile.addresses).toHaveLength(1);
            expect(profile.addresses[0].city).toBe("Bengaluru");
            expect(profile.addresses[0].state).toBe("Karnataka");
            expect(profile.addresses[0].pincode).toBe("560001");
        });
    });

    // ─── 3. PAN Number Capture ────────────────────────────────────────────────
    describe("POST /api/v1/kyc/identity/pan", () => {
        it("should reject invalid PAN format", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/identity/pan")
                .set("Authorization", `Bearer ${token}`)
                .send({ panNumber: "12345ABCDE" })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Invalid PAN format");
        });

        it("should capture valid PAN and compute name similarity with Aadhaar", async () => {
            // First ingest Aadhaar name
            await Kyc.create({
                kycId: "kyc_test_pan_01",
                userId: testUserId,
                nameOnAadhaar: "Varsha Sharma",
                aadhaarLast4: "0019",
                status: "verified"
            });

            const res = await request(app)
                .post("/api/v1/kyc/identity/pan")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    panNumber: "ADHPB7061Q",
                    nameOnPAN: "Varsha Sharma"
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.panLast4).toBe("061Q");
            expect(res.body.data.nameOnPAN).toBe("VARSHA SHARMA");
            expect(res.body.data.nameMatchScore).toBe(1); // Exact match

            const kyc = await Kyc.findOne({ userId: testUserId });
            expect(kyc.panVerified).toBe(true);
            expect(kyc.getDecryptedPAN()).toBe("ADHPB7061Q");
        });
    });

    // ─── 4. Upload Original PAN Card Image ────────────────────────────────────
    describe("POST /api/v1/kyc/identity/upload-pan-card", () => {
        it("should reject invalid base64 image data", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/identity/upload-pan-card")
                .set("Authorization", `Bearer ${token}`)
                .send({ image: "", mimeType: "image/jpeg" })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it("should successfully upload and verify an original PAN card image in mock mode", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/identity/upload-pan-card")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    image: MOCK_BASE64_IMAGE,
                    mimeType: "image/jpeg"
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.isOriginal).toBe(true);
            expect(res.body.data.extractedPan).toBe("ADHPB7061Q");
            expect(res.body.data.imageHash).toBeDefined();

            const kyc = await Kyc.findOne({ userId: testUserId });
            expect(kyc.panDocument).not.toBeNull();
            expect(kyc.panDocument.isOriginal).toBe(true);
            expect(kyc.panDocument.imageHash).toBe(res.body.data.imageHash);
            expect(kyc.panDocument.data).toBeDefined(); // raw buffer stored
        });

        it("should reject when image PAN does not match already captured PAN", async () => {
            // Seed a different PAN
            await Kyc.create({
                kycId: "kyc_diff_pan",
                userId: testUserId,
                panEncrypted: Kyc.encryptPAN("ZZZZZ9999Z"),
                panLast4: "9999"
            });

            const res = await request(app)
                .post("/api/v1/kyc/identity/upload-pan-card")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    image: MOCK_BASE64_IMAGE, // mock extracts ADHPB7061Q
                    mimeType: "image/jpeg"
                })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("does not match");
        });
    });

    // ─── 5. Upload Aadhaar Card Image (Front & Back) ──────────────────────────
    describe("POST /api/v1/kyc/identity/upload-aadhaar-card", () => {
        it("should reject when front image is missing", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/identity/upload-aadhaar-card")
                .set("Authorization", `Bearer ${token}`)
                .send({ backImage: MOCK_DOC_BASE64 })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Front image");
        });

        it("should upload front and back Aadhaar card images with masking check", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/identity/upload-aadhaar-card")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    frontImage: MOCK_BASE64_IMAGE,
                    frontMimeType: "image/jpeg",
                    backImage: MOCK_DOC_BASE64,
                    backMimeType: "image/jpeg"
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.isMasked).toBe(true);
            expect(res.body.data.frontImageHash).toBeDefined();
            expect(res.body.data.backImageHash).toBeDefined();

            const kyc = await Kyc.findOne({ userId: testUserId });
            expect(kyc.aadhaarDocument.isMasked).toBe(true);
            expect(kyc.aadhaarDocument.frontData).toBeDefined();
            expect(kyc.aadhaarDocument.backData).toBeDefined();
        });
    });

    // ─── 6. Identity Collection Status ────────────────────────────────────────
    describe("GET /api/v1/kyc/identity/status", () => {
        it("should return initial empty status for new user", async () => {
            const res = await request(app)
                .get("/api/v1/kyc/identity/status")
                .set("Authorization", `Bearer ${otherToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.identityStatus).toBe("pending");
            expect(res.body.data.aadhaar.captured).toBe(false);
            expect(res.body.data.pan.captured).toBe(false);
            expect(res.body.data.documents.panCardUploaded).toBe(false);
            expect(res.body.data.readyForFaceVerification).toBe(false);
        });

        it("should indicate readyForFaceVerification when Aadhaar and PAN documents are present", async () => {
            // 1. Capture Aadhaar
            await request(app)
                .post("/api/v1/kyc/identity/aadhaar")
                .set("Authorization", `Bearer ${token}`)
                .send({ aadhaarNumber: "999999990019" });

            // 2. Upload PAN card
            await request(app)
                .post("/api/v1/kyc/identity/upload-pan-card")
                .set("Authorization", `Bearer ${token}`)
                .send({ image: MOCK_BASE64_IMAGE, mimeType: "image/jpeg" });

            // 3. Upload Aadhaar card
            await request(app)
                .post("/api/v1/kyc/identity/upload-aadhaar-card")
                .set("Authorization", `Bearer ${token}`)
                .send({ frontImage: MOCK_BASE64_IMAGE, frontMimeType: "image/jpeg" });

            const res = await request(app)
                .get("/api/v1/kyc/identity/status")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.aadhaar.captured).toBe(true);
            expect(res.body.data.pan.captured).toBe(true);
            expect(res.body.data.documents.panCardUploaded).toBe(true);
            expect(res.body.data.documents.isPanOriginal).toBe(true);
            expect(res.body.data.documents.aadhaarCardUploaded).toBe(true);
            expect(res.body.data.readyForFaceVerification).toBe(true);
        });
    });
});
