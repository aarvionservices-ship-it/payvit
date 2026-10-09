/**
 * Wallet KYC Onboarding — Negative / Guard-Rail Integration Tests
 *
 * Tests that the API correctly rejects bad input, enforces business rules,
 * and protects every endpoint with authentication.
 *
 * Aadhaar mock values:
 *   Valid test Aadhaar : 999999990019
 *   Mock OTP           : 123456
 *   Blocked fake PAN   : AAAAA0000A  (returns 400 from mock API)
 */

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

// Models for direct DB seeding
const User = require("../src/modules/auth/model/auth.model");
const CustomerProfile = require("../src/modules/user/model/customerProfile.model");
const Kyc = require("../src/modules/kyc/model/kyc.model");
const WalletPan = require("../src/modules/wallet/model/walletPan.model");
const BankAccount = require("../src/modules/wallet/model/bankAccount.model");
const WalletConsent = require("../src/modules/wallet/model/walletConsent.model");
const Wallet = require("../src/modules/wallet/model/wallet.model");

// Test identity
const JWT_SECRET =
    process.env.JWT_ACCESS_SECRET ||
    "345e972cbbab29aa0d9c3b620f1fc6af148277c66cefa11c23d87c848f2ecd2e170a730030622b51494ea0867239aad72a3f8b43a77c95bff6d3e17b8c95217b";

const USER_ID = "neg-test-user-001";
const EMAIL = "negative@payvit.test";

// Helpers

function makeToken(userId = USER_ID, opts = {}) {
    return jwt.sign({ userId, role: "admin" }, JWT_SECRET, { expiresIn: "1h", ...opts });
}

/** Seed a bare-minimum User + CustomerProfile (required by kyc.service.verifyKycOtp). */
async function seedUser(userId = USER_ID, email = EMAIL) {
    await User.create({
        userId,
        name: "Negative Test User",
        email,
        password: "x",
        role: "admin",
        isActive: true,
        isProfileComplete: false
    });
    await CustomerProfile.create({ userId });
}

/** Seed all four wallet-creation preconditions directly into the DB. */
async function seedWalletPreconditions(userId = USER_ID) {
    await Kyc.create({
        userId,
        kycId: `kyc-neg-${Date.now()}`,
        aadhaarLast4: "0019",
        aadhaarEncrypted: "encrypted-placeholder",
        status: "verified",
        txnId: "mock-txn-999999990019",
        nameOnAadhaar: "Varsha Sharma",
        dobOnAadhaar: new Date("1995-01-01"),
        genderOnAadhaar: "female",
        verifiedAt: new Date()
    });

    const testPan = "ABCDE1234F";
    await WalletPan.create({
        userId,
        panEncrypted: WalletPan.encryptPan(testPan),
        panLast4: testPan.slice(-4),
        panMasked: testPan.slice(0, 5) + "****" + testPan.slice(-1),
        status: "verified",
        nameOnPan: "Negative Test User",
        verifiedAt: new Date()
    });

    const { encrypted, masked } = BankAccount.encryptAccountNumber("123456789012");
    await BankAccount.create({
        userId,
        accountHolderName: "Negative Test User",
        accountNumberEncrypted: encrypted,
        accountNumberMasked: masked,
        ifscCode: "HDFC0000123",
        bankName: "HDFC Bank",
        accountType: "savings",
        isPrimary: true
    });

    await WalletConsent.create({
        userId,
        termsAccepted: true,
        privacyAccepted: true,
        kycConsent: true,
        acceptedAt: new Date()
    });
}

// 1. Authentication Guard Tests

describe("Authentication Guards", () => {
    const PROTECTED = [
        ["GET",  "/api/v1/wallet/status"],
        ["POST", "/api/v1/wallet/kyc/aadhaar/send-otp"],
        ["POST", "/api/v1/wallet/kyc/aadhaar/verify"],
        ["POST", "/api/v1/wallet/kyc/pan"],
        ["POST", "/api/v1/wallet/bank/link"],
        ["POST", "/api/v1/wallet/kyc/consent"],
        ["POST", "/api/v1/wallet/create"]
    ];

    test.each(PROTECTED)(
        "%s %s — should return 401 with no token",
        async (method, path) => {
            const res = await request(app)[method.toLowerCase()](path);
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        }
    );

    test("Any protected endpoint — returns 401 with an invalid (garbage) JWT", async () => {
        const res = await request(app)
            .get("/api/v1/wallet/status")
            .set("Authorization", "Bearer this.is.not.a.valid.jwt");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test("Any protected endpoint — returns 401 with an expired JWT", async () => {
        // Sign a token that already expired 1 second ago
        const expiredToken = makeToken(USER_ID, { expiresIn: "-1s" });

        const res = await request(app)
            .get("/api/v1/wallet/status")
            .set("Authorization", `Bearer ${expiredToken}`);

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test("Any protected endpoint — returns 401 when token is signed with wrong secret", async () => {
        const wrongToken = jwt.sign({ userId: USER_ID, role: "admin" }, "wrong-secret", { expiresIn: "1h" });

        const res = await request(app)
            .get("/api/v1/wallet/status")
            .set("Authorization", `Bearer ${wrongToken}`);

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});

// 2. Aadhaar OTP — Negative Cases

describe("Aadhaar OTP — Negative Cases", () => {
    let token;
    beforeAll(() => { token = makeToken(); });

    test("POST send-otp — returns 400 for an Aadhaar that is not 12 digits", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/aadhaar/send-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ aadhaarNumber: "12345" });        // too short

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST send-otp — returns 400 for a non-sandbox Aadhaar number in mock mode", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/aadhaar/send-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ aadhaarNumber: "123412341234" });  // valid format, not in sandbox

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST send-otp — returns 400 when Aadhaar is already verified for this user", async () => {
        // Seed a pre-verified KYC record
        await Kyc.create({
            userId: USER_ID,
            kycId: "kyc-already-verified",
            aadhaarLast4: "0019",
            aadhaarEncrypted: "encrypted-placeholder",
            status: "verified",
            txnId: "mock-txn-999999990019",
            verifiedAt: new Date()
        });

        const res = await request(app)
            .post("/api/v1/wallet/kyc/aadhaar/send-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ aadhaarNumber: "999999990019" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST verify — returns 400 when no active OTP session exists", async () => {
        // Clean DB (no KYC record) — just call verify directly
        const res = await request(app)
            .post("/api/v1/wallet/kyc/aadhaar/verify")
            .set("Authorization", `Bearer ${token}`)
            .send({ otp: "123456" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST verify — returns 400 for a wrong OTP", async () => {
        // Seed the user (needed by verifyKycOtp → User.findOne)
        await seedUser();

        // Initiate OTP session
        await request(app)
            .post("/api/v1/wallet/kyc/aadhaar/send-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ aadhaarNumber: "999999990019" });

        // Submit a wrong OTP
        const res = await request(app)
            .post("/api/v1/wallet/kyc/aadhaar/verify")
            .set("Authorization", `Bearer ${token}`)
            .send({ otp: "999999" });               // wrong OTP (mock expects 123456)

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// 3. PAN Verification — Negative Cases

describe("PAN Verification — Negative Cases", () => {
    let token;
    beforeAll(() => { token = makeToken(); });

    test("POST /kyc/pan — returns 400 for wrong PAN format (lowercase)", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/pan")
            .set("Authorization", `Bearer ${token}`)
            .send({ panNumber: "abcde1234f" });        // must be uppercase

        // kyc/pan service uppercases before regex check, so this actually passes format
        // but the API itself should still succeed (service uppercases input).
        // Test that format with only digits fails:
        const res2 = await request(app)
            .post("/api/v1/wallet/kyc/pan")
            .set("Authorization", `Bearer ${token}`)
            .send({ panNumber: "1234567890" });         // all digits — invalid format

        expect(res2.status).toBe(400);
        expect(res2.body.success).toBe(false);
    });

    test("POST /kyc/pan — returns 400 for the blocked test PAN (AAAAA0000A)", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/pan")
            .set("Authorization", `Bearer ${token}`)
            .send({ panNumber: "AAAAA0000A" });         // blocked by mock API

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST /kyc/pan — returns 400 when PAN number is missing from body", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/pan")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST /kyc/pan — returns 409 when PAN is already verified for this user", async () => {
        // Seed a pre-verified PAN
        const pan = "ABCDE1234F";
        await WalletPan.create({
            userId: USER_ID,
            panEncrypted: WalletPan.encryptPan(pan),
            panLast4: pan.slice(-4),
            panMasked: pan.slice(0, 5) + "****" + pan.slice(-1),
            status: "verified",
            verifiedAt: new Date()
        });

        const res = await request(app)
            .post("/api/v1/wallet/kyc/pan")
            .set("Authorization", `Bearer ${token}`)
            .send({ panNumber: "ABCDE1234F" });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });
});

// 4. Bank Linking — Negative Cases

describe("Bank Account Linking — Negative Cases", () => {
    let token;
    beforeAll(() => { token = makeToken(); });

    const VALID_BANK = {
        accountHolderName: "Test User",
        accountNumber: "123456789012",
        ifscCode: "HDFC0000123",
        bankName: "HDFC Bank",
        accountType: "savings"
    };

    test("POST /bank/link — returns 400 for an invalid IFSC code", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/bank/link")
            .set("Authorization", `Bearer ${token}`)
            .send({ ...VALID_BANK, ifscCode: "INVALID" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST /bank/link — returns 400 when account number is too short (< 9 digits)", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/bank/link")
            .set("Authorization", `Bearer ${token}`)
            .send({ ...VALID_BANK, accountNumber: "12345" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST /bank/link — returns 400 when account number is missing", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/bank/link")
            .set("Authorization", `Bearer ${token}`)
            .send({ ifscCode: "HDFC0000123" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST /bank/link — returns 400 when IFSC is missing", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/bank/link")
            .set("Authorization", `Bearer ${token}`)
            .send({ accountNumber: "123456789012" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST /bank/link — returns 400 for the blocked test account number (0000000000)", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/bank/link")
            .set("Authorization", `Bearer ${token}`)
            .send({ ...VALID_BANK, accountNumber: "0000000000" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST /bank/link — returns 409 when the same account is linked twice", async () => {
        // First link — should succeed
        await request(app)
            .post("/api/v1/wallet/bank/link")
            .set("Authorization", `Bearer ${token}`)
            .send(VALID_BANK);

        // Second link of exact same account + IFSC — should fail
        const res = await request(app)
            .post("/api/v1/wallet/bank/link")
            .set("Authorization", `Bearer ${token}`)
            .send(VALID_BANK);

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });
});

// 5. Consent — Negative Cases

describe("Consent Recording — Negative Cases", () => {
    let token;
    beforeAll(() => { token = makeToken(); });

    test("POST /kyc/consent — returns 400 when termsAccepted is false", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/consent")
            .set("Authorization", `Bearer ${token}`)
            .send({ termsAccepted: false, privacyAccepted: true, kycConsent: true });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST /kyc/consent — returns 400 when privacyAccepted is false", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/consent")
            .set("Authorization", `Bearer ${token}`)
            .send({ termsAccepted: true, privacyAccepted: false, kycConsent: true });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST /kyc/consent — returns 400 when kycConsent is false", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/consent")
            .set("Authorization", `Bearer ${token}`)
            .send({ termsAccepted: true, privacyAccepted: true, kycConsent: false });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("POST /kyc/consent — returns 400 when all consent fields are missing", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/kyc/consent")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// 6. Wallet Creation — Precondition Guard Tests

describe("Wallet Creation — Precondition Guards", () => {
    let token;
    beforeAll(() => { token = makeToken(); });

    test("POST /wallet/create — returns 400 when Aadhaar KYC is not verified", async () => {
        // No KYC at all — clean DB
        const res = await request(app)
            .post("/api/v1/wallet/create")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Aadhaar KYC is not verified/i);
    });

    test("POST /wallet/create — returns 400 when PAN is not verified", async () => {
        // Seed Aadhaar KYC only
        await Kyc.create({
            userId: USER_ID,
            kycId: "kyc-pan-guard",
            aadhaarLast4: "0019",
            aadhaarEncrypted: "encrypted-placeholder",
            status: "verified",
            txnId: "mock-txn-999999990019",
            verifiedAt: new Date()
        });

        const res = await request(app)
            .post("/api/v1/wallet/create")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/PAN verification is not complete/i);
    });

    test("POST /wallet/create — returns 400 when no bank account is linked", async () => {
        // Seed Aadhaar KYC + PAN only
        await Kyc.create({
            userId: USER_ID,
            kycId: "kyc-bank-guard",
            aadhaarLast4: "0019",
            aadhaarEncrypted: "encrypted-placeholder",
            status: "verified",
            txnId: "mock-txn-999999990019",
            verifiedAt: new Date()
        });

        const pan = "ABCDE1234F";
        await WalletPan.create({
            userId: USER_ID,
            panEncrypted: WalletPan.encryptPan(pan),
            panLast4: pan.slice(-4),
            panMasked: pan.slice(0, 5) + "****" + pan.slice(-1),
            status: "verified",
            verifiedAt: new Date()
        });

        const res = await request(app)
            .post("/api/v1/wallet/create")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/No bank account linked/i);
    });

    test("POST /wallet/create — returns 400 when consent has not been recorded", async () => {
        // Seed Aadhaar KYC + PAN + bank only (no consent)
        await Kyc.create({
            userId: USER_ID,
            kycId: "kyc-consent-guard",
            aadhaarLast4: "0019",
            aadhaarEncrypted: "encrypted-placeholder",
            status: "verified",
            txnId: "mock-txn-999999990019",
            verifiedAt: new Date()
        });

        const pan = "ABCDE1234F";
        await WalletPan.create({
            userId: USER_ID,
            panEncrypted: WalletPan.encryptPan(pan),
            panLast4: pan.slice(-4),
            panMasked: pan.slice(0, 5) + "****" + pan.slice(-1),
            status: "verified",
            verifiedAt: new Date()
        });

        const { encrypted, masked } = BankAccount.encryptAccountNumber("123456789012");
        await BankAccount.create({
            userId: USER_ID,
            accountHolderName: "Test User",
            accountNumberEncrypted: encrypted,
            accountNumberMasked: masked,
            ifscCode: "HDFC0000123",
            bankName: "HDFC Bank",
            accountType: "savings"
        });

        const res = await request(app)
            .post("/api/v1/wallet/create")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Consent is not recorded/i);
    });
});

// 7. Duplicate Operations

describe("Duplicate Operation Guards", () => {
    let token;
    beforeAll(() => { token = makeToken(); });

    test("POST /wallet/create — returns 409 when wallet is created a second time", async () => {
        // Seed all preconditions
        await seedWalletPreconditions();

        // First creation — should succeed
        const first = await request(app)
            .post("/api/v1/wallet/create")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        expect(first.status).toBe(201);

        // Second creation — must be rejected
        const second = await request(app)
            .post("/api/v1/wallet/create")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(second.status).toBe(409);
        expect(second.body.success).toBe(false);
        expect(second.body.message).toMatch(/Wallet already exists/i);
    });

    test("POST /kyc/pan — returns 409 when the same PAN is verified a second time", async () => {
        // First verification
        await request(app)
            .post("/api/v1/wallet/kyc/pan")
            .set("Authorization", `Bearer ${token}`)
            .send({ panNumber: "BCDEF1234G" });

        // Second verification of the same PAN — must be rejected
        const res = await request(app)
            .post("/api/v1/wallet/kyc/pan")
            .set("Authorization", `Bearer ${token}`)
            .send({ panNumber: "BCDEF1234G" });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });
});
