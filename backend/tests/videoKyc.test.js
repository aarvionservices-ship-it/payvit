/**
 * Video KYC AI Agent — Integration Test Suite
 *
 * Tests the complete AI-driven Video KYC flow end-to-end.
 * All AI (Gemini) calls are bypassed — VIDEO_KYC_MOCK_MODE is always true in tests.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  Mock values                                                 │
 * │  Mock OTP    : 654321  (VIDEO_KYC_MOCK_OTP default)          │
 * │  Mock PAN    : ADHPB7061Q  (returned by mock OCR)            │
 * │  Mock PAN L4 : 061Q                                          │
 * │  Mock name   : VARSHA SHARMA  (from mock OCR)                │
 * │  User DOB    : 14/07/1966                                    │
 * │  Phone last4 : 3210                                          │
 * │  Stage flow  : WELCOME → PAN_CAPTURE → LIVENESS_CHECK        │
 * │                → QUESTIONS → OTP_SENT → COMPLETE             │
 * └──────────────────────────────────────────────────────────────┘
 *
 * NOTE: setup.js wipes ALL collections before EACH test.
 * Each test is therefore fully self-contained.
 * The Happy Path is a SINGLE test that runs all 14 steps sequentially.
 *
 * Run:  npm run test:video
 */

const request = require("supertest");
const jwt     = require("jsonwebtoken");
const app     = require("../src/app");

const User            = require("../src/modules/auth/model/auth.model");
const CustomerProfile = require("../src/modules/user/model/customerProfile.model");
const Kyc             = require("../src/modules/kyc/model/kyc.model");
const VideoKycSession = require("../src/modules/kyc/model/VideoKycSession.model");

// ─── Constants ────────────────────────────────────────────────────────────────

const JWT_SECRET =
    process.env.JWT_ACCESS_SECRET ||
    "345e972cbbab29aa0d9c3b620f1fc6af148277c66cefa11c23d87c848f2ecd2e170a730030622b51494ea0867239aad72a3f8b43a77c95bff6d3e17b8c95217b";

const USER_ID    = "vid-kyc-test-001";
const USER_EMAIL = "video.kyc@payvit.test";
const USER_PHONE = "9876543210";               // last 4 → "3210"
const USER_NAME  = "Sangeeta Barde";
const USER_DOB   = new Date("1966-07-14");     // formatted → "14/07/1966"

// Values injected by videoKycAgent.service.js in mock mode
const MOCK_OTP    = "654321";
const MOCK_PAN    = "ADHPB7061Q";
const MOCK_PAN_L4 = "061Q";                   // last 4 of ADHPB7061Q
const MOCK_NAME   = "VARSHA SHARMA";           // mock OCR result

// 1×1 white PNG — valid base64 image; Gemini is bypassed in test/mock mode
const DUMMY_B64  = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const DUMMY_MIME = "image/png";

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Mint a signed JWT for the given userId */
function makeToken(userId = USER_ID) {
    return jwt.sign({ userId, role: "customer" }, JWT_SECRET, { expiresIn: "1h" });
}

/**
 * Seed a User + CustomerProfile into the test DB.
 * Accepts overrides to create multiple isolated users per test.
 */
async function seedUser(opts = {}) {
    const userId = opts.userId || USER_ID;
    const email  = opts.email  || USER_EMAIL;
    const name   = opts.name   || USER_NAME;
    const phone  = opts.phone  || USER_PHONE;
    const dob    = opts.dob    || USER_DOB;

    await User.create({
        userId,
        name,
        phone,
        email,
        password: "hashed_dummy",
        role:     "customer",
        isActive: true
    });
    await CustomerProfile.create({ userId, dob });
}

/** POST /start-session — asserts 200, returns data */
async function startSession(token = makeToken()) {
    const res = await request(app)
        .post("/api/v1/kyc/video/start-session")
        .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    return res.body.data;           // { sessionId, stage, agentMessage }
}

/** POST /upload-image  task=pan_ocr */
async function uploadPan(token, sessionId) {
    return request(app)
        .post("/api/v1/kyc/video/upload-image")
        .set("Authorization", `Bearer ${token}`)
        .send({ sessionId, image: DUMMY_B64, mimeType: DUMMY_MIME, task: "pan_ocr" });
}

/** POST /upload-image  task=liveness */
async function uploadSelfie(token, sessionId) {
    return request(app)
        .post("/api/v1/kyc/video/upload-image")
        .set("Authorization", `Bearer ${token}`)
        .send({ sessionId, image: DUMMY_B64, mimeType: DUMMY_MIME, task: "liveness" });
}

/** POST /upload-video */
async function uploadVideo(token, sessionId, durationSeconds = 20) {
    return request(app)
        .post("/api/v1/kyc/video/upload-video")
        .set("Authorization", `Bearer ${token}`)
        .send({ sessionId, video: DUMMY_B64, mimeType: "video/webm", durationSeconds });
}


/** POST /chat */
async function chat(token, sessionId, message) {
    return request(app)
        .post("/api/v1/kyc/video/chat")
        .set("Authorization", `Bearer ${token}`)
        .send({ sessionId, message });
}

/** GET /session/:sessionId */
async function getSession(token, sessionId) {
    return request(app)
        .get(`/api/v1/kyc/video/session/${sessionId}`)
        .set("Authorization", `Bearer ${token}`);
}

/**
 * Return the correct answer for a given question id, based on the seeded user.
 */
function correctAnswer(questionId) {
    const d = USER_DOB;
    const dd  = String(d.getDate()).padStart(2, "0");
    const mm  = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    const answers = {
        q_dob:         `${dd}/${mm}/${yyyy}`,
        q_phone_last4: USER_PHONE.slice(-4),
        q_name:        USER_NAME,
        q_email:       USER_EMAIL
    };
    return answers[questionId] ?? "correct_fallback_answer";
}

/**
 * Drive a fresh session (for a freshly seeded user) all the way to OTP_SENT.
 * Returns { sessionId, token } ready for OTP tests.
 *
 * Assumes seedUser() has already been called for USER_ID.
 */
async function driveToOtpSent() {
    const token = makeToken(USER_ID);

    // Start session (WELCOME)
    const { sessionId } = await startSession(token);

    // WELCOME → PAN_CAPTURE via chat
    const c1 = await chat(token, sessionId, "Yes, I am ready.");
    expect(c1.status).toBe(200);
    expect(c1.body.data.stage).toBe("PAN_CAPTURE");

    // PAN_CAPTURE → LIVENESS_CHECK via pan_ocr upload
    const p1 = await uploadPan(token, sessionId);
    expect(p1.status).toBe(200);
    expect(p1.body.data.stage).toBe("LIVENESS_CHECK");

    // LIVENESS_CHECK → VIDEO_RECORDING via liveness upload
    const l1 = await uploadSelfie(token, sessionId);
    expect(l1.status).toBe(200);
    expect(l1.body.data.stage).toBe("VIDEO_RECORDING");

    // VIDEO_RECORDING → QUESTIONS via upload-video
    const v1 = await uploadVideo(token, sessionId);
    expect(v1.status).toBe(200);
    expect(v1.body.data.stage).toBe("QUESTIONS");


    // Retrieve the two drawn questions
    const sr = await getSession(token, sessionId);
    const { questions } = sr.body.data;

    // Answer Q1
    const a1 = await chat(token, sessionId, correctAnswer(questions[0].id));
    expect(a1.status).toBe(200);

    // Answer Q2 → OTP sent, stage → OTP_SENT
    const a2 = await chat(token, sessionId, correctAnswer(questions[1].id));
    expect(a2.status).toBe(200);
    expect(a2.body.data.stage).toBe("OTP_SENT");

    return { sessionId, token };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTH GUARD — every endpoint must reject unauthenticated / invalid JWTs
// ─────────────────────────────────────────────────────────────────────────────

describe("1. Auth Guard — every endpoint rejects requests without a valid JWT", () => {

    const ENDPOINTS = [
        { method: "post", path: "/api/v1/kyc/video/start-session" },
        { method: "post", path: "/api/v1/kyc/video/chat" },
        { method: "post", path: "/api/v1/kyc/video/upload-image" },
        { method: "post", path: "/api/v1/kyc/video/verify-otp" },
        { method: "post", path: "/api/v1/kyc/video/resend-otp" },
        { method: "get",  path: "/api/v1/kyc/video/session/fake-id" }
    ];

    test.each(ENDPOINTS)(
        "$method $path → 401 without token",
        async ({ method, path }) => {
            const res = await request(app)[method](path);
            expect(res.status).toBe(401);
        }
    );

    test("tampered / malformed JWT → 401", async () => {
        const res = await request(app)
            .post("/api/v1/kyc/video/start-session")
            .set("Authorization", "Bearer this.is.totally.invalid");
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. HAPPY PATH — full end-to-end flow from WELCOME to COMPLETE
//    (single test so DB state is preserved across all 14 steps)
// ─────────────────────────────────────────────────────────────────────────────

describe("2. Happy Path — WELCOME → PAN_CAPTURE → LIVENESS → QUESTIONS → OTP_SENT → COMPLETE", () => {

    test("Full 14-step KYC flow completes successfully", async () => {
        await seedUser();
        const token = makeToken();

        // ── Step 1: start-session ─────────────────────────────────────────────
        const startRes = await request(app)
            .post("/api/v1/kyc/video/start-session")
            .set("Authorization", `Bearer ${token}`);

        expect(startRes.status).toBe(200);
        expect(startRes.body.success).toBe(true);
        const { sessionId, stage: s0, agentMessage: greeting } = startRes.body.data;
        expect(typeof sessionId).toBe("string");
        expect(sessionId.length).toBeGreaterThan(0);
        expect(s0).toBe("WELCOME");
        expect(typeof greeting).toBe("string");
        expect(greeting.length).toBeGreaterThan(10);

        // ── Step 2: GET session after start ──────────────────────────────────
        const sr1 = await getSession(token, sessionId);
        expect(sr1.status).toBe(200);
        const sess1 = sr1.body.data;
        expect(sess1.sessionId).toBe(sessionId);
        expect(sess1.status).toBe("active");
        expect(sess1.stage).toBe("WELCOME");
        expect(sess1.questions).toHaveLength(2);
        expect(sess1.livenessVerified).toBe(false);
        expect(sess1.questionsAnswered).toBe(0);
        expect(sess1.agentLog).toHaveLength(1);
        expect(sess1.agentLog[0].role).toBe("agent");
        expect(sess1.agentLog[0].stage).toBe("WELCOME");
        expect(sess1.panLast4).toBeNull();
        // Sensitive fields must not leak
        expect(sess1.panEncrypted).toBeUndefined();
        expect(sess1.otpHash).toBeUndefined();

        const questions = sess1.questions;

        // ── Step 3: chat to advance WELCOME → PAN_CAPTURE ────────────────────
        const c1 = await chat(token, sessionId, "I am ready to begin.");
        expect(c1.status).toBe(200);
        expect(c1.body.success).toBe(true);
        const d3 = c1.body.data;
        expect(d3.stage).toBe("PAN_CAPTURE");
        expect(d3.done).toBe(false);
        expect(d3.nextAction).toBe("upload_pan");
        expect(typeof d3.agentMessage).toBe("string");

        // ── Step 4: upload-image PAN OCR → LIVENESS_CHECK ────────────────────
        const panRes = await uploadPan(token, sessionId);
        expect(panRes.status).toBe(200);
        expect(panRes.body.success).toBe(true);
        const d4 = panRes.body.data;
        expect(d4.stage).toBe("LIVENESS_CHECK");
        expect(d4.agentMessage).toContain(MOCK_PAN_L4);   // masked PAN in message
        expect(d4.extractedData.panLast4).toBe(MOCK_PAN_L4);
        expect(d4.extractedData.nameOnPAN).toBe(MOCK_NAME);
        expect(d4.extractedData.panEncrypted).toBeUndefined(); // full encrypted PAN never exposed

        // ── Step 5: GET session confirms PAN stored ───────────────────────────
        const sr2 = await getSession(token, sessionId);
        expect(sr2.status).toBe(200);
        const sess2 = sr2.body.data;
        expect(sess2.stage).toBe("LIVENESS_CHECK");
        expect(sess2.panLast4).toBe(MOCK_PAN_L4);
        expect(sess2.nameOnPAN).toBe(MOCK_NAME);
        expect(sess2.panEncrypted).toBeUndefined();

        // ── Step 6: upload-image liveness → VIDEO_RECORDING ───────────────────
        const selfieRes = await uploadSelfie(token, sessionId);
        expect(selfieRes.status).toBe(200);
        expect(selfieRes.body.success).toBe(true);
        const d6 = selfieRes.body.data;
        expect(d6.stage).toBe("VIDEO_RECORDING");
        expect(d6.extractedData.livenessVerified).toBe(true);
        expect(typeof d6.agentMessage).toBe("string");

        // ── Step 6b: upload-video 20s recording → QUESTIONS ───────────────────
        const videoRes = await uploadVideo(token, sessionId, 20);
        expect(videoRes.status).toBe(200);
        expect(videoRes.body.success).toBe(true);
        const d6b = videoRes.body.data;
        expect(d6b.stage).toBe("QUESTIONS");
        expect(typeof d6b.agentMessage).toBe("string");


        // ── Step 7: GET session confirms liveness ─────────────────────────────
        const sr3 = await getSession(token, sessionId);
        expect(sr3.status).toBe(200);
        const sess3 = sr3.body.data;
        expect(sess3.stage).toBe("QUESTIONS");
        expect(sess3.livenessVerified).toBe(true);
        expect(sess3.questionsAnswered).toBe(0);
        expect(sess3.steps.liveness.status).toBe("completed");

        // ── Step 8: answer Q1 → still QUESTIONS, awaiting Q2 ─────────────────
        const a1 = await chat(token, sessionId, correctAnswer(questions[0].id));
        expect(a1.status).toBe(200);
        const d8 = a1.body.data;
        expect(d8.stage).toBe("QUESTIONS");
        expect(d8.done).toBe(false);

        // ── Step 9: answer Q2 → OTP sent, stage → OTP_SENT ───────────────────
        const a2 = await chat(token, sessionId, correctAnswer(questions[1].id));
        expect(a2.status).toBe(200);
        const d9 = a2.body.data;
        expect(d9.stage).toBe("OTP_SENT");
        expect(d9.nextAction).toBe("enter_otp");
        expect(d9.done).toBe(false);
        expect(d9.agentMessage).toContain(MOCK_OTP); // mock mode exposes OTP in message

        // ── Step 10: GET session confirms OTP state ────────────────────────────
        const sr4 = await getSession(token, sessionId);
        expect(sr4.status).toBe(200);
        const sess4 = sr4.body.data;
        expect(sess4.stage).toBe("OTP_SENT");
        expect(sess4.status).toBe("otp_sent");
        expect(sess4.questionsAnswered).toBe(2);
        expect(sess4.steps.questions.status).toBe("completed");
        expect(sess4.otpHash).toBeUndefined();

        // ── Step 11: verify-otp → COMPLETE ────────────────────────────────────
        const otpRes = await request(app)
            .post("/api/v1/kyc/video/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });

        expect(otpRes.status).toBe(200);
        expect(otpRes.body.success).toBe(true);
        const d11 = otpRes.body.data;
        expect(d11.stage).toBe("COMPLETE");
        expect(d11.done).toBe(true);
        expect(d11.agentMessage).toMatch(/congratulations|complete|verified/i);

        // ── Step 12: Kyc document in DB reflects verified PAN ─────────────────
        const kyc = await Kyc.findOne({ userId: USER_ID });
        expect(kyc).not.toBeNull();
        expect(kyc.panVerified).toBe(true);
        expect(kyc.panLast4).toBe(MOCK_PAN_L4);
        expect(kyc.nameOnPAN).toBe(MOCK_NAME);
        expect(kyc.panVerifiedAt).not.toBeNull();
        expect(kyc.panKycSessionId).toBe(sessionId);
        expect(kyc.panEncrypted).toBeTruthy();           // stored encrypted, not plain
        expect(kyc.panEncrypted).not.toBe(MOCK_PAN);    // definitely not plain text

        // ── Step 13: VideoKycSession document fully completed ──────────────────
        const finalSession = await VideoKycSession.findOne({ sessionId });
        expect(finalSession).not.toBeNull();
        expect(finalSession.status).toBe("verified");
        expect(finalSession.stage).toBe("COMPLETE");
        expect(finalSession.completedAt).not.toBeNull();
        expect(finalSession.livenessVerified).toBe(true);
        expect(finalSession.questionsAnswered).toBe(2);
        expect(finalSession.steps.panCapture.status).toBe("completed");
        expect(finalSession.steps.liveness.status).toBe("completed");
        expect(finalSession.steps.questions.status).toBe("completed");
        expect(finalSession.steps.otpVerify.status).toBe("completed");
        expect(finalSession.panEncrypted).toBeTruthy();

        // ── Step 14: verify-otp again on completed session → 400 ──────────────
        const reOtp = await request(app)
            .post("/api/v1/kyc/video/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });
        expect(reOtp.status).toBe(400);
        expect(reOtp.body.message).toMatch(/complete/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. INPUT VALIDATION — missing / malformed fields must return 400
// ─────────────────────────────────────────────────────────────────────────────

describe("3. Input Validation — missing or malformed fields return 400", () => {

    let token, sessionId;

    beforeEach(async () => {
        await seedUser();
        token = makeToken();
        ({ sessionId } = await startSession(token));
    });

    // /chat ────────────────────────────────────────────────────────────────────
    test("chat — missing sessionId → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/chat")
            .set("Authorization", `Bearer ${token}`).send({ message: "hello" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/sessionId/i);
    });

    test("chat — missing message → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/chat")
            .set("Authorization", `Bearer ${token}`).send({ sessionId });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/message/i);
    });

    test("chat — whitespace-only message → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/chat")
            .set("Authorization", `Bearer ${token}`).send({ sessionId, message: "   " });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/message/i);
    });

    // /upload-image ────────────────────────────────────────────────────────────
    test("upload-image — missing sessionId → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/upload-image")
            .set("Authorization", `Bearer ${token}`)
            .send({ image: DUMMY_B64, task: "pan_ocr" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/sessionId/i);
    });

    test("upload-image — missing image → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/upload-image")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, task: "pan_ocr" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/image/i);
    });

    test("upload-image — missing task → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/upload-image")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, image: DUMMY_B64 });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/task/i);
    });

    test("upload-image — invalid task value → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/upload-image")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, image: DUMMY_B64, task: "unknown_task" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid task/i);
    });

    // /verify-otp ──────────────────────────────────────────────────────────────
    test("verify-otp — missing sessionId → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/verify-otp")
            .set("Authorization", `Bearer ${token}`).send({ otp: MOCK_OTP });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/sessionId/i);
    });

    test("verify-otp — missing otp → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/verify-otp")
            .set("Authorization", `Bearer ${token}`).send({ sessionId });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/otp/i);
    });

    // /resend-otp ──────────────────────────────────────────────────────────────
    test("resend-otp — missing sessionId → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/resend-otp")
            .set("Authorization", `Bearer ${token}`).send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/sessionId/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. STAGE GUARDS — actions valid only at specific stages are rejected elsewhere
// ─────────────────────────────────────────────────────────────────────────────

describe("4. Stage Guards — wrong action at wrong stage returns 400", () => {

    let token, sessionId;

    beforeEach(async () => {
        await seedUser();
        token = makeToken();
        ({ sessionId } = await startSession(token));
    });

    test("pan_ocr upload at WELCOME stage (before chat) → 400 (wrong stage)", async () => {
        // Session is at WELCOME; pan_ocr expects PAN_CAPTURE
        const res = await uploadPan(token, sessionId);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/not valid at stage/i);
    });

    test("liveness upload at PAN_CAPTURE stage → 400 (expects LIVENESS_CHECK)", async () => {
        // Advance to PAN_CAPTURE
        await chat(token, sessionId, "Ready");
        // Liveness only valid at LIVENESS_CHECK
        const res = await uploadSelfie(token, sessionId);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/not valid at stage/i);
    });

    test("verify-otp before any OTP has been sent → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/no otp|complete.*steps/i);
    });

    test("resend-otp before reaching OTP_SENT stage → 400", async () => {
        const res = await request(app).post("/api/v1/kyc/video/resend-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/not yet complete|otp_sent/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. OTP GUARD RAILS — wrong / expired / resend limits
// ─────────────────────────────────────────────────────────────────────────────

describe("5. OTP Guard Rails — invalid, expired, and rate-limited OTP attempts", () => {

    let token, sessionId;

    beforeEach(async () => {
        await seedUser();
        ({ sessionId, token } = await driveToOtpSent());
    });

    test("wrong OTP → 400 with 'invalid otp' message", async () => {
        const res = await request(app).post("/api/v1/kyc/video/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: "000000" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid otp/i);
    });

    test("correct OTP → 200 with done=true", async () => {
        const res = await request(app).post("/api/v1/kyc/video/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });
        expect(res.status).toBe(200);
        expect(res.body.data.done).toBe(true);
    });

    test("expired OTP (backdated manually) → 400 with 'expired' message", async () => {
        await VideoKycSession.findOneAndUpdate(
            { sessionId },
            { $set: { otpExpiresAt: new Date(Date.now() - 1000) } }
        );
        const res = await request(app).post("/api/v1/kyc/video/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/expired/i);
    });

    test("resend-otp → 200 and otpSentCount increments to 2", async () => {
        const res = await request(app).post("/api/v1/kyc/video/resend-otp")
            .set("Authorization", `Bearer ${token}`).send({ sessionId });
        expect(res.status).toBe(200);

        const session = await VideoKycSession.findOne({ sessionId });
        expect(session.otpSentCount).toBe(2);
    });

    test("resend-otp 3× total then 4th → 400 limit exceeded", async () => {
        // Already sent once (from driveToOtpSent). Resend twice more.
        await request(app).post("/api/v1/kyc/video/resend-otp")
            .set("Authorization", `Bearer ${token}`).send({ sessionId });
        await request(app).post("/api/v1/kyc/video/resend-otp")
            .set("Authorization", `Bearer ${token}`).send({ sessionId });

        // 4th attempt is blocked
        const res = await request(app).post("/api/v1/kyc/video/resend-otp")
            .set("Authorization", `Bearer ${token}`).send({ sessionId });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/limit/i);
    });

    test("fresh OTP after resend is still accepted by verify-otp", async () => {
        await request(app).post("/api/v1/kyc/video/resend-otp")
            .set("Authorization", `Bearer ${token}`).send({ sessionId });

        // Mock mode always uses MOCK_OTP even after resend
        const res = await request(app).post("/api/v1/kyc/video/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });
        expect(res.status).toBe(200);
        expect(res.body.data.done).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SECURITY QUESTIONS — wrong answer terminates session immediately
// ─────────────────────────────────────────────────────────────────────────────

describe("6. Security Questions — wrong answer terminates session immediately", () => {

    /** Helper: drive to QUESTIONS stage, return { token, sessionId, questions } */
    async function driveToQuestions() {
        await seedUser();
        const token = makeToken();
        const { sessionId } = await startSession(token);

        await chat(token, sessionId, "Ready");
        await uploadPan(token, sessionId);
        await uploadSelfie(token, sessionId);
        await uploadVideo(token, sessionId);

        const sr = await getSession(token, sessionId);
        const { questions } = sr.body.data;
        return { token, sessionId, questions };
    }

    test("wrong answer to Q1 → response stage='failed', done=true", async () => {
        const { token, sessionId } = await driveToQuestions();
        const res = await chat(token, sessionId, "definitely_wrong_answer_xyz");
        expect(res.status).toBe(200);
        expect(res.body.data.stage).toBe("failed");
        expect(res.body.data.done).toBe(true);
    });

    test("session DB status='failed', steps.questions.status='failed' after wrong Q1", async () => {
        const { token, sessionId } = await driveToQuestions();
        await chat(token, sessionId, "wrong answer");

        const session = await VideoKycSession.findOne({ sessionId });
        expect(session.status).toBe("failed");
        expect(session.steps.questions.status).toBe("failed");
    });

    test("any action on a failed session → 400", async () => {
        const { token, sessionId, questions } = await driveToQuestions();
        await chat(token, sessionId, "wrong answer"); // session → failed

        const res = await chat(token, sessionId, correctAnswer(questions[0].id));
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/failed/i);
    });

    test("correct Q1 + wrong Q2 → session also fails", async () => {
        const { token, sessionId, questions } = await driveToQuestions();

        await chat(token, sessionId, correctAnswer(questions[0].id)); // Q1 correct
        const res = await chat(token, sessionId, "wrong_answer_for_q2"); // Q2 wrong
        expect(res.status).toBe(200);
        expect(res.body.data.stage).toBe("failed");
        expect(res.body.data.done).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. BUSINESS RULES — already verified, session ownership, duplicate, expiry
// ─────────────────────────────────────────────────────────────────────────────

describe("7. Business Rules — ownership, duplicates, already verified, expiry", () => {

    test("Cannot start a session when PAN already verified → 400", async () => {
        await seedUser();
        await Kyc.create({
            kycId:            "kyc-pre-verified",
            userId:           USER_ID,
            aadhaarLast4:     "0000",
            aadhaarEncrypted: "placeholder",
            panVerified:      true,
            panLast4:         "061Q",
            nameOnPAN:        "Test User"
        });
        const res = await request(app)
            .post("/api/v1/kyc/video/start-session")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already verified/i);
    });

    test("User B cannot read User A's session → 403", async () => {
        await seedUser({ userId: "vid-a", email: "a@test.com" });
        await seedUser({ userId: "vid-b", email: "b@test.com" });

        const tokenA = makeToken("vid-a");
        const tokenB = makeToken("vid-b");
        const { sessionId } = await startSession(tokenA);

        const res = await getSession(tokenB, sessionId);
        expect(res.status).toBe(403);
    });

    test("User B cannot chat in User A's session → 403", async () => {
        await seedUser({ userId: "vid-c", email: "c@test.com" });
        await seedUser({ userId: "vid-d", email: "d@test.com" });

        const tokenC = makeToken("vid-c");
        const tokenD = makeToken("vid-d");
        const { sessionId } = await startSession(tokenC);

        const res = await chat(tokenD, sessionId, "hijack attempt");
        expect(res.status).toBe(403);
    });

    test("GET session with non-existent sessionId → 404", async () => {
        await seedUser();
        const res = await getSession(makeToken(), "session-does-not-exist-999");
        expect(res.status).toBe(404);
    });

    test("Starting a new session expires all previous active sessions for that user", async () => {
        await seedUser();
        const token = makeToken();
        const { sessionId: firstId } = await startSession(token);

        // Start a second session
        await startSession(token);

        const first = await VideoKycSession.findOne({ sessionId: firstId });
        expect(first.status).toBe("expired");
    });

    test("Expired session (backdated expiresAt) → 400 on any action", async () => {
        await seedUser();
        const token = makeToken();
        const { sessionId } = await startSession(token);

        await VideoKycSession.findOneAndUpdate(
            { sessionId },
            { $set: { expiresAt: new Date(Date.now() - 1000) } }
        );

        const res = await chat(token, sessionId, "hello");
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/expired/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. DATA SANITISATION — sensitive fields must never appear in API responses
// ─────────────────────────────────────────────────────────────────────────────

describe("8. Data Sanitisation — sensitive fields never exposed in responses", () => {

    test("GET session never exposes panEncrypted or otpHash", async () => {
        await seedUser();
        const token = makeToken();
        const { sessionId } = await startSession(token);
        const res = await getSession(token, sessionId);

        expect(res.status).toBe(200);
        expect(res.body.data.panEncrypted).toBeUndefined();
        expect(res.body.data.otpHash).toBeUndefined();
    });

    test("upload-image (pan_ocr) response exposes only panLast4 — not full PAN", async () => {
        await seedUser();
        const token = makeToken();
        const { sessionId } = await startSession(token);

        await chat(token, sessionId, "ready");         // WELCOME → PAN_CAPTURE
        const res = await uploadPan(token, sessionId); // PAN_CAPTURE → LIVENESS_CHECK

        expect(res.status).toBe(200);
        const data = res.body.data;
        expect(data.extractedData.panLast4).toBe(MOCK_PAN_L4);
        // Full plain-text PAN must not appear anywhere in the response
        expect(JSON.stringify(data)).not.toContain(MOCK_PAN);
        expect(data.extractedData.panEncrypted).toBeUndefined();
    });

    test("Kyc document stores RSA-encrypted PAN (not plain text)", async () => {
        await seedUser();
        const { sessionId, token } = await driveToOtpSent();

        await request(app).post("/api/v1/kyc/video/verify-otp")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, otp: MOCK_OTP });

        const kyc = await Kyc.findOne({ userId: USER_ID });
        expect(kyc.panEncrypted).toBeTruthy();
        expect(kyc.panEncrypted).not.toBe(MOCK_PAN);   // not plain text
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. QUESTION BANK — randomness and uniqueness guarantees
// ─────────────────────────────────────────────────────────────────────────────

describe("9. Question Bank — 2 unique questions drawn from the bank per session", () => {

    const VALID_IDS = ["q_dob", "q_phone_last4", "q_name", "q_email"];

    test("Each session gets exactly 2 questions with valid IDs", async () => {
        await seedUser();
        const token = makeToken();
        const { sessionId } = await startSession(token);
        const { data } = (await getSession(token, sessionId)).body;

        expect(data.questions).toHaveLength(2);
        data.questions.forEach(q => {
            expect(VALID_IDS).toContain(q.id);
            expect(typeof q.question).toBe("string");
            expect(q.question.length).toBeGreaterThan(5);
        });
    });

    test("No duplicate question IDs within a single session", async () => {
        await seedUser();
        const token = makeToken();
        const { sessionId } = await startSession(token);
        const { questions } = (await getSession(token, sessionId)).body.data;

        const ids    = questions.map(q => q.id);
        const unique = [...new Set(ids)];
        expect(unique).toHaveLength(ids.length);
    });

    test("Questions never expose an answer field (answers are never stored)", async () => {
        await seedUser();
        const token = makeToken();
        const { sessionId } = await startSession(token);
        const { questions } = (await getSession(token, sessionId)).body.data;

        questions.forEach(q => {
            expect(q.answer).toBeUndefined();
            expect(q.validate).toBeUndefined();
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. AGENT LOG INTEGRITY — conversation history is correctly recorded
// ─────────────────────────────────────────────────────────────────────────────

describe("10. Agent Log — conversation history integrity", () => {

    let token, sessionId;

    beforeEach(async () => {
        await seedUser();
        token = makeToken();
        ({ sessionId } = await startSession(token));
    });

    test("Log starts with exactly 1 agent entry at WELCOME stage", async () => {
        const { data } = (await getSession(token, sessionId)).body;
        expect(data.agentLog).toHaveLength(1);
        expect(data.agentLog[0].role).toBe("agent");
        expect(data.agentLog[0].stage).toBe("WELCOME");
        expect(data.agentLog[0].timestamp).toBeDefined();
    });

    test("After one chat turn, log has 3 entries: agent greeting + user + agent reply", async () => {
        await chat(token, sessionId, "I am ready");
        const { data } = (await getSession(token, sessionId)).body;

        // greeting (1) + user message (2) + agent reply (3)
        expect(data.agentLog).toHaveLength(3);
        expect(data.agentLog[0].role).toBe("agent");
        expect(data.agentLog[1].role).toBe("user");
        expect(data.agentLog[2].role).toBe("agent");
    });

    test("Every log entry has role, message, stage, and timestamp", async () => {
        await chat(token, sessionId, "hello");
        const { data } = (await getSession(token, sessionId)).body;

        data.agentLog.forEach(entry => {
            expect(["agent", "user", "system"]).toContain(entry.role);
            expect(typeof entry.message).toBe("string");
            expect(entry.message.length).toBeGreaterThan(0);
            expect(entry.stage).toBeDefined();
            expect(entry.timestamp).toBeDefined();
        });
    });
});
