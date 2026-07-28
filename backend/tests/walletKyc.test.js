/**
 * Wallet KYC Onboarding — Integration Test Suite
 *
 * Covers the complete wallet onboarding flow using Supertest against a live
 * Express app connected to the dedicated `payvit-test` MongoDB database.
 *
 * Prerequisites are seeded directly into MongoDB via Mongoose models wherever
 * a prior API call would be redundant (e.g., wallet-create preconditions).
 *
 * Aadhaar mock mode  : 999999990019  |  OTP: 123456
 * PAN   mock mode    : any 10-char alphanumeric value
 */

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const mongoose = require("mongoose");

// Models (for direct DB seeding)
const User = require("../src/modules/auth/model/auth.model");
const CustomerProfile = require("../src/modules/user/model/customerProfile.model");
const Wallet = require("../src/modules/wallet/model/wallet.model");
const Kyc = require("../src/modules/kyc/model/kyc.model");
const WalletPan = require("../src/modules/wallet/model/walletPan.model");
const BankAccount = require("../src/modules/wallet/model/bankAccount.model");
const WalletConsent = require("../src/modules/wallet/model/walletConsent.model");

// Test identity
// Use the JWT secret from .env (loaded by setup.js) with a hard-coded fallback
const JWT_SECRET =
    process.env.JWT_ACCESS_SECRET ||
    "345e972cbbab29aa0d9c3b620f1fc6af148277c66cefa11c23d87c848f2ecd2e170a730030622b51494ea0867239aad72a3f8b43a77c95bff6d3e17b8c95217b";

const USER_ID = "178403219823010";
const TEST_EMAIL = "testuser@payvit.test";

// Helpers

/** Create a signed JWT valid for 1 hour — mirrors the auth.middleware checks. */
function makeToken(userId = USER_ID) {
    return jwt.sign({ userId, role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
}

/**
 * Seed the bare-minimum User + CustomerProfile that kyc.service requires when
 * it calls `User.findOne({ userId })` during Aadhaar OTP verification.
 */
async function seedTestUser() {
    await User.create({
        userId: USER_ID,
        name: "Test User",
        email: TEST_EMAIL,
        password: "hashed_password",
        role: "admin",
        isActive: true,
        isProfileComplete: false
    });
    await CustomerProfile.create({ userId: USER_ID });
}

// Test Suite

describe("Wallet KYC Onboarding Flow — Integration Tests", () => {
    let token;

    beforeAll(() => {
        token = makeToken();
    });

    // 1. Auth Guard

    test("GET /api/v1/wallet/status — should return 401 without token", async () => {
        const res = await request(app).get("/api/v1/wallet/status");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    // 2. Wallet Status (no wallet yet)

    test("GET /api/v1/wallet/status — returns walletExists=false when authorised but no wallet", async () => {
        const res = await request(app)
            .get("/api/v1/wallet/status")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.walletExists).toBe(false);
        expect(res.body.data.walletStatus).toBeNull();
    });

    // 3. Aadhaar — Send OTP

    test("POST /api/v1/wallet/kyc/aadhaar/send-otp — sends mock OTP successfully", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/aadhaar/send-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ aadhaarNumber: "999999990019" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("OTP sent successfully");
    });

    // 4. Aadhaar — Verify OTP

    test("POST /api/v1/wallet/kyc/aadhaar/verify — verifies mock OTP and returns identity", async () => {
        // kyc.service.verifyKycOtp calls User.findOne({ userId })
        // → seed the user so it does not throw 404
        await seedTestUser();

        // Initiate OTP session first
        await request(app)
            .post("/api/v1/wallet/kyc/aadhaar/send-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ aadhaarNumber: "999999990019" });

        const res = await request(app)
            .post("/api/v1/wallet/kyc/aadhaar/verify")
            .set("Authorization", `Bearer ${token}`)
            .send({ otp: "123456" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Varsha Sharma");
        expect(res.body.data.aadhaarLast4).toBe("0019");
    });

    // 5. PAN Verification

    test("POST /api/v1/wallet/kyc/pan — verifies PAN and returns masked number", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/pan")
            .set("Authorization", `Bearer ${token}`)
            .send({ panNumber: "ABCDE1234F" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.panMasked).toBe("ABCDE****F");
    });

    // 6. Bank Account Linking

    test("POST /api/v1/wallet/bank/link — links bank account and returns masked number", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/bank/link")
            .set("Authorization", `Bearer ${token}`)
            .send({
                accountHolderName: "Super Admin",
                accountNumber: "123456789012",
                ifscCode: "HDFC0000123",
                bankName: "HDFC Bank",
                accountType: "savings"
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.bankAccount.accountNumberMasked).toBe("XXXX9012");
    });

    // 7. Consent

    test("POST /api/v1/wallet/kyc/consent — records consent and returns success message", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/consent")
            .set("Authorization", `Bearer ${token}`)
            .send({
                termsAccepted: true,
                privacyAccepted: true,
                kycConsent: true
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("Consent recorded successfully");
    });

    // 8. Wallet Creation (full preconditions)

    test("POST /api/v1/wallet/create — creates wallet when all preconditions are met", async () => {
        /**
         * Each test runs against a clean DB (setup.js wipes all collections in
         * beforeEach). Seed all four preconditions directly instead of repeating
         * earlier API calls, keeping this test deterministic and independent.
         */

        // Precondition 1 — Aadhaar KYC verified
        await Kyc.create({
            userId: USER_ID,
            kycId: "test-kyc-id-create",
            aadhaarLast4: "0019",
            aadhaarEncrypted: "encrypted-placeholder",
            status: "verified",
            txnId: "mock-txn-999999990019",
            nameOnAadhaar: "Varsha Sharma",
            dobOnAadhaar: new Date("1995-01-01"),
            genderOnAadhaar: "female",
            verifiedAt: new Date()
        });

        // Precondition 2 — PAN verified
        const testPan = "ABCDE1234F";
        await WalletPan.create({
            userId: USER_ID,
            panEncrypted: WalletPan.encryptPan(testPan),
            panLast4: testPan.slice(-4),                      // "234F"
            panMasked: testPan.slice(0, 5) + "****" + testPan.slice(-1), // "ABCDE****F"
            status: "verified",
            nameOnPan: "Mock PAN Holder",
            verifiedAt: new Date()
        });

        // Precondition 3 — Bank account linked
        const { encrypted: accEncrypted, masked: accMasked } =
            BankAccount.encryptAccountNumber("123456789012");
        await BankAccount.create({
            userId: USER_ID,
            accountHolderName: "Super Admin",
            accountNumberEncrypted: accEncrypted,
            accountNumberMasked: accMasked,
            ifscCode: "HDFC0000123",
            bankName: "HDFC Bank",
            accountType: "savings",
            isPrimary: true
        });

        // Precondition 4 — Consent accepted
        await WalletConsent.create({
            userId: USER_ID,
            termsAccepted: true,
            privacyAccepted: true,
            kycConsent: true,
            acceptedAt: new Date()
        });

        // Trigger wallet creation
        const res = await request(app)
            .post("/api/v1/wallet/create")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.walletStatus).toBe("active");

        // GET /status should now reflect a fully onboarded wallet
        const statusRes = await request(app)
            .get("/api/v1/wallet/status")
            .set("Authorization", `Bearer ${token}`);

        expect(statusRes.status).toBe(200);
        expect(statusRes.body.data.walletExists).toBe(true);
        expect(statusRes.body.data.aadhaarVerified).toBe(true);
        expect(statusRes.body.data.panVerified).toBe(true);
        expect(statusRes.body.data.bankLinked).toBe(true);
        expect(statusRes.body.data.consentAccepted).toBe(true);
    });
});
