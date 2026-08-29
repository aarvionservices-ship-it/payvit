/**
 * PAN KYC — Integration Test Suite
 *
 * Tests the complete video PAN verification flow end-to-end.
 *
 * ┌─────────────────────────────────────────────────┐
 * │  Mock values                                    │
 * │  Valid PAN   : ADHPB7061Q                       │
 * │  Mock OTP    : 654321  (PAN_MOCK_OTP default)   │
 * │  User DOB    : 14/07/1966                       │
 * │  Phone last4 : 3210                             │
 * └─────────────────────────────────────────────────┘
 *
 * Run:  npx jest tests/panKyc.test.js --runInBand --forceExit
 */

const request  = require("supertest");
const jwt      = require("jsonwebtoken");
const app      = require("../src/app");

const User            = require("../src/modules/auth/model/auth.model");
const CustomerProfile = require("../src/modules/user/model/customerProfile.model");
const Kyc             = require("../src/modules/kyc/model/kyc.model");
const PanKycSession   = require("../src/modules/kyc/model/PanKycSession.model");

// ── Test Identity ─────────────────────────────────────────────────────────────

const JWT_SECRET =
    process.env.JWT_ACCESS_SECRET ||
    "345e972cbbab29aa0d9c3b620f1fc6af148277c66cefa11c23d87c848f2ecd2e170a730030622b51494ea0867239aad72a3f8b43a77c95bff6d3e17b8c95217b";

const USER_ID    = "pan-kyc-test-user-001";
const USER_EMAIL = "pan.kyc@payvit.test";
const USER_PHONE = "9876543210";   // last 4 = "3210"
const USER_NAME  = "Sangeeta Barde";
const USER_DOB   = new Date("1966-07-14"); // 14/07/1966

const VALID_PAN  = "ADHPB7061Q";
const MOCK_OTP   = "654321";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeToken(userId = USER_ID) {
    return jwt.sign({ userId, role: "customer" }, JWT_SECRET, { expiresIn: "1h" });
}

async function seedUser(opts = {}) {
    const userId = opts.userId || USER_ID;
    const email  = opts.email  || USER_EMAIL;
    const name   = opts.name   || USER_NAME;
    const phone  = opts.phone  || USER_PHONE;

    await User.create({
        userId,
        name,
        phone,
        email,
        password: "hashed_dummy",
        role: "customer",
        isActive: true
    });

    await CustomerProfile.create({ userId, dob: USER_DOB });
}

async function startSession(token = makeToken()) {
    const res = await request(app)
        .post("/api/v1/kyc/pan/start-session")
        .set("Authorization", `Bearer ${token}`);
    return res.body.data;
}

function buildAnswers(questions) {
    const answerMap = {
        q_dob:
            `${String(USER_DOB.getDate()).padStart(2, "0")}` +
            `/${String(USER_DOB.getMonth() + 1).padStart(2, "0")}` +
            `/${USER_DOB.getFullYear()}`,
        q_phone_last4: USER_PHONE.slice(-4),
        q_name:        USER_NAME,
        q_email:       USER_EMAIL
    };
    return questions.map(q => ({ id: q.id, answer: answerMap[q.id] }));
}

async function pushToOtpSent(token, sessionId, questions) {
    const answers = buildAnswers(questions);
    return request(app)
        .post("/api/v1/kyc/pan/verify-details")
        .set("Authorization", `Bearer ${token}`)
        .send({ sessionId, panNumber: VALID_PAN, nameOnPAN: "SANGEETA R BARDE", answers });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTH GUARD
// ─────────────────────────────────────────────────────────────────────────────

describe("1. Auth Guard — every endpoint must reject unauthenticated calls", () => {

    const ENDPOINTS = [
        { method: "post", path: "/api/v1/kyc/pan/start-session" },
        { method: "get",  path: "/api/v1/kyc/pan/session/fake-id" },
        { method: "post", path: "/api/v1/kyc/pan/verify-details" },
        { method: "post", path: "/api/v1/kyc/pan/verify-otp" },
        { method: "post", path: "/api/v1/kyc/pan/resend-otp" }
    ];

    test.each(ENDPOINTS)(
        "$method $path → 401 without token",
        async ({ method, path }) => {
            const res = await request(app)[method](path);
            expect(res.status).toBe(401);
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. HAPPY PATH — full flow from start to KYC verified
// ─────────────────────────────────────────────────────────────────────────────

describe("2. Happy Path — start → scan PAN → answer questions → OTP → verified", () => {

    let token;
    let sessionId;
    test("Full 8-step PAN KYC Happy Path flow completes successfully", async () => {
        await seedUser();
        const token = makeToken();

        // Step 1 — start-session returns a sessionId + 2 questions
        const startRes = await request(app)
            .post("/api/v1/kyc/pan/start-session")
            .set("Authorization", `Bearer ${token}`);

        expect(startRes.status).toBe(200);
        expect(startRes.body.success).toBe(true);
        expect(typeof startRes.body.data.sessionId).toBe("string");
        expect(startRes.body.data.questions).toHaveLength(2);

        const sessionId = startRes.body.data.sessionId;
        const questions  = startRes.body.data.questions;

        // Step 2 — GET session returns status=active and the agent greeting
        const getRes1 = await request(app)
            .get(`/api/v1/kyc/pan/session/${sessionId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(getRes1.status).toBe(200);
        expect(getRes1.body.data.sessionId).toBe(sessionId);
        expect(getRes1.body.data.status).toBe("active");
        expect(getRes1.body.data.questions).toHaveLength(2);
        expect(getRes1.body.data.agentLog[0].role).toBe("agent");

        // Step 3 — verify-details with correct PAN + answers sends OTP
        const detailsRes = await pushToOtpSent(token, sessionId, questions);
        expect(detailsRes.status).toBe(200);
        expect(detailsRes.body.success).toBe(true);
        expect(detailsRes.body.message).toContain(MOCK_OTP);

        // Step 4 — session status is now otp_sent, panLast4 is stored
        const getRes2 = await request(app)
            .get(`/api/v1/kyc/pan/session/${sessionId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(getRes2.body.data.status).toBe("otp_sent");
        expect(getRes2.body.data.panLast4).toBe("061Q");

        // Step 5 — verify-otp with correct OTP marks PAN as verified
        const otpRes = await request(app)
            .post("/api/v1/kyc/pan/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });

        expect(otpRes.status).toBe(200);
        expect(otpRes.body.success).toBe(true);
        expect(otpRes.body.message).toMatch(/verified/i);
        expect(otpRes.body.panLast4).toBe("061Q");

        // Step 6 — DB confirms panVerified=true with correct fields
        const kyc = await Kyc.findOne({ userId: USER_ID });
        expect(kyc).not.toBeNull();
        expect(kyc.panVerified).toBe(true);
        expect(kyc.panLast4).toBe("061Q");
        expect(kyc.panVerifiedAt).not.toBeNull();
        expect(kyc.panKycSessionId).toBe(sessionId);

        // Step 7 — session doc is marked verified and has completedAt
        const session = await PanKycSession.findOne({ sessionId });
        expect(session.status).toBe("verified");
        expect(session.completedAt).not.toBeNull();
        expect(session.steps.otpVerify.status).toBe("completed");

        // Step 8 — cannot call verify-otp again on an already-closed session
        const closedRes = await request(app)
            .post("/api/v1/kyc/pan/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });

        expect(closedRes.status).toBe(400);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. INPUT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe("3. Input Validation — bad input returns 400 with a useful message", () => {

    let token, sessionId, questions;

    beforeEach(async () => {
        await seedUser();
        token = makeToken();
        const data = await startSession(token);
        sessionId = data.sessionId;
        questions  = data.questions;
    });

    test("verify-details — missing sessionId → 400", async () => {
        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-details")
            .set("Authorization", `Bearer ${token}`)
            .send({ panNumber: VALID_PAN, answers: buildAnswers(questions) });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/sessionId/i);
    });

    test("verify-details — missing panNumber → 400", async () => {
        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-details")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, answers: buildAnswers(questions) });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/panNumber/i);
    });

    test("verify-details — PAN in lowercase → 400", async () => {
        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-details")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, panNumber: "adhpb7061q", answers: buildAnswers(questions) });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid pan/i);
    });

    test("verify-details — PAN too short → 400", async () => {
        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-details")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, panNumber: "ABCD123", answers: buildAnswers(questions) });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid pan/i);
    });

    test("verify-details — wrong security answers → 400", async () => {
        const wrongAnswers = questions.map(q => ({ id: q.id, answer: "this is wrong" }));
        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-details")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, panNumber: VALID_PAN, answers: wrongAnswers });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/incorrect/i);
    });

    test("verify-details — answers for non-existent question IDs → 400", async () => {
        const fakeAnswers = [
            { id: "q_does_not_exist", answer: "anything" },
            { id: "q_also_fake",      answer: "anything" }
        ];
        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-details")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, panNumber: VALID_PAN, answers: fakeAnswers });

        expect(res.status).toBe(400);
    });

    test("verify-otp — missing sessionId → 400", async () => {
        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ otp: MOCK_OTP });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/sessionId/i);
    });

    test("verify-otp — missing otp field → 400", async () => {
        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/otp/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. OTP GUARD RAILS
// ─────────────────────────────────────────────────────────────────────────────

describe("4. OTP Guard Rails — wrong / expired / too many", () => {

    let token, sessionId, questions;

    beforeEach(async () => {
        await seedUser();
        token = makeToken();
        const data = await startSession(token);
        sessionId = data.sessionId;
        questions  = data.questions;
    });

    test("correct OTP after verify-details → 200", async () => {
        await pushToOtpSent(token, sessionId, questions);

        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });

        expect(res.status).toBe(200);
    });

    test("wrong OTP → 400 with invalid message", async () => {
        await pushToOtpSent(token, sessionId, questions);

        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: "000000" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid otp/i);
    });

    test("OTP called before verify-details (session is still active) → 400", async () => {
        // No verify-details called — no OTP dispatched
        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/no otp has been sent/i);
    });

    test("expired OTP (backdated manually) → 400", async () => {
        await pushToOtpSent(token, sessionId, questions);

        // Manually expire it 1 second in the past
        await PanKycSession.findOneAndUpdate(
            { sessionId },
            { $set: { otpExpiresAt: new Date(Date.now() - 1000) } }
        );

        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/expired/i);
    });

    test("resend-otp → 200, otpSentCount increments to 2", async () => {
        await pushToOtpSent(token, sessionId, questions); // count = 1

        const res = await request(app)
            .post("/api/v1/kyc/pan/resend-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId });

        expect(res.status).toBe(200);

        const session = await PanKycSession.findOne({ sessionId });
        expect(session.otpSentCount).toBe(2);
    });

    test("resend-otp 3 times then 4th attempt → 400 limit exceeded", async () => {
        await pushToOtpSent(token, sessionId, questions); // count = 1

        // Resend #2 and #3
        await request(app).post("/api/v1/kyc/pan/resend-otp")
            .set("Authorization", `Bearer ${token}`).send({ sessionId });
        await request(app).post("/api/v1/kyc/pan/resend-otp")
            .set("Authorization", `Bearer ${token}`).send({ sessionId });

        // #4 must fail
        const res = await request(app)
            .post("/api/v1/kyc/pan/resend-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/limit/i);
    });

    test("resend-otp before PAN details submitted → 400", async () => {
        // Session still active, no PAN submitted yet
        const res = await request(app)
            .post("/api/v1/kyc/pan/resend-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/pan/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. BUSINESS RULE ENFORCEMENT
// ─────────────────────────────────────────────────────────────────────────────

describe("5. Business Rules — duplicate PAN, already verified, session ownership", () => {

    test("Cannot start a new session when PAN already verified for this user", async () => {
        await seedUser();
        const token = makeToken();

        // Seed an already-verified KYC record for this user
        await Kyc.create({
            kycId:            "kyc-already-done",
            userId:           USER_ID,
            aadhaarLast4:     "0000",
            aadhaarEncrypted: "placeholder",
            panVerified:      true,
            panLast4:         "061Q",
            nameOnPAN:        "SANGEETA R BARDE"
        });

        const res = await request(app)
            .post("/api/v1/kyc/pan/start-session")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already verified/i);
    });

    test("User B cannot read User A's session (session hijack) → 403", async () => {
        await seedUser({ userId: "user-A", email: "a@test.com" });
        await seedUser({ userId: "user-B", email: "b@test.com" });

        const tokenA = makeToken("user-A");
        const tokenB = makeToken("user-B");

        const dataA = await startSession(tokenA);

        const res = await request(app)
            .get(`/api/v1/kyc/pan/session/${dataA.sessionId}`)
            .set("Authorization", `Bearer ${tokenB}`);

        expect(res.status).toBe(403);
    });

    test("Duplicate PAN already verified by another account → 400", async () => {
        // User X already owns this PAN
        await seedUser({ userId: "user-X", email: "user.x@payvit.test", phone: "9876543218" });
        await Kyc.create({
            kycId:            "kyc-user-x",
            userId:           "user-X",
            aadhaarLast4:     "0000",
            aadhaarEncrypted: "placeholder",
            panVerified:      true,
            panEncrypted:     Kyc.encryptPAN(VALID_PAN),
            panLast4:         "061Q"
        });

        // User Y tries to claim the same PAN
        await seedUser({ userId: "user-Y", email: "user.y@payvit.test", phone: "9876543219" });
        const tokenY = makeToken("user-Y");
        const { sessionId: sid, questions: qs } = await startSession(tokenY);
        const answers = buildAnswers(qs);

        const res = await request(app)
            .post("/api/v1/kyc/pan/verify-details")
            .set("Authorization", `Bearer ${tokenY}`)
            .send({ sessionId: sid, panNumber: VALID_PAN, nameOnPAN: "Copycat", answers });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/linked to another account/i);
    });

    test("GET session with a non-existent session ID → 404", async () => {
        await seedUser();
        const token = makeToken();

        const res = await request(app)
            .get("/api/v1/kyc/pan/session/session-does-not-exist")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. QUESTION RANDOMNESS
// ─────────────────────────────────────────────────────────────────────────────

describe("6. Question Bank — 2 unique questions drawn from the bank each time", () => {

    const VALID_QUESTION_IDS = ["q_dob", "q_phone_last4", "q_name", "q_email"];

    test("Each session gets exactly 2 questions with valid IDs", async () => {
        await seedUser();
        const { questions } = await startSession(makeToken());

        expect(questions).toHaveLength(2);
        questions.forEach(q => {
            expect(VALID_QUESTION_IDS).toContain(q.id);
            expect(q.question.length).toBeGreaterThan(5);
        });
    });

    test("No duplicate question IDs within a single session", async () => {
        await seedUser();
        const { questions } = await startSession(makeToken());

        const ids    = questions.map(q => q.id);
        const unique = [...new Set(ids)];
        expect(unique).toHaveLength(ids.length);
    });
});
