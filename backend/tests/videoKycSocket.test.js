/**
 * videoKycSocket.test.js
 *
 * Integration tests for the real-time Video KYC Socket.io layer.
 *
 * Tests the full WebSocket handshake, authentication, session lifecycle,
 * and all major events in mock mode (VIDEO_KYC_MOCK_MODE=true).
 *
 * Run:  npm run test:socket
 */

// Force mock mode for all tests — no real Gemini calls
process.env.VIDEO_KYC_MOCK_MODE = "true";

const http      = require("http");
const jwt       = require("jsonwebtoken");
const { io: ioClient } = require("socket.io-client");

const app         = require("../src/app");
const connectDB   = require("../src/core/database/mongoose.connection");
const mongoose    = require("mongoose");
const { initSocketServer }          = require("../src/core/socket/socketServer");
const { registerVideoKycNamespace } = require("../src/modules/kyc/socket/videoKycSocket.handler");

const User            = require("../src/modules/auth/model/auth.model");
const CustomerProfile = require("../src/modules/user/model/customerProfile.model");
const VideoKycSession = require("../src/modules/kyc/model/VideoKycSession.model");

// ─── Constants ────────────────────────────────────────────────────────────────

const TEST_MONGO_URI = process.env.MONGO_URI_TEST || "mongodb://localhost:27017/payvit-test";
const JWT_SECRET     = process.env.JWT_ACCESS_SECRET ||
    "345e972cbbab29aa0d9c3b620f1fc6af148277c66cefa11c23d87c848f2ecd2e170a730030622b51494ea0867239aad72a3f8b43a77c95bff6d3e17b8c95217b";

const USER_ID    = "socket-test-user-001";
const USER_EMAIL = "socket.test@payvit.test";
const USER_PHONE = "9999988888";
const USER_NAME  = "Socket Test User";
const USER_DOB   = new Date("1990-05-15");
const MOCK_OTP   = process.env.VIDEO_KYC_MOCK_OTP || "654321";

// 1×1 transparent PNG (valid base64 image)
const DUMMY_B64  = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const DUMMY_MIME = "image/png";

// ─── Server / DB Setup ────────────────────────────────────────────────────────

let httpServer;
let serverPort;
let serverUrl;

function makeToken(userId = USER_ID) {
    return jwt.sign({ userId, role: "customer" }, JWT_SECRET, { expiresIn: "1h" });
}

function connectSocket(token, opts = {}) {
    return ioClient(`${serverUrl}/video-kyc`, {
        auth:       { token },
        transports: ["websocket"],
        ...opts
    });
}

function waitFor(socket, event, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout waiting for event '${event}' after ${timeoutMs}ms`));
        }, timeoutMs);

        socket.once(event, (data) => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}

beforeAll(async () => {
    // Connect to test DB
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_MONGO_URI);
    }

    // Stub transactions for standalone Mongo
    const isStandalone =
        mongoose.connection.client?.topology?.description?.type === "Single";
    if (isStandalone) {
        const origStartSession = mongoose.startSession.bind(mongoose);
        mongoose.startSession = async (...args) => {
            const session = await origStartSession(...args);
            session.startTransaction  = () => {};
            session.commitTransaction = async () => {};
            session.abortTransaction  = async () => {};
            return session;
        };
    }

    // Boot http + socket server on a random port
    httpServer = http.createServer(app);
    const io   = initSocketServer(httpServer);
    registerVideoKycNamespace(io);

    await new Promise((resolve) => {
        httpServer.listen(0, () => {
            serverPort = httpServer.address().port;
            serverUrl  = `http://localhost:${serverPort}`;
            resolve();
        });
    });
});

afterAll(async () => {
    await new Promise((resolve) => httpServer.close(resolve));
    await mongoose.connection.close();
});

beforeEach(async () => {
    // Wipe collections before each test
    for (const col of Object.values(mongoose.connection.collections)) {
        await col.deleteMany({});
    }

    // Seed a user
    await User.create({
        userId:   USER_ID,
        name:     USER_NAME,
        phone:    USER_PHONE,
        email:    USER_EMAIL,
        password: "hashed_dummy",
        role:     "customer",
        isActive: true
    });

    await CustomerProfile.create({
        userId: USER_ID,
        dob:    USER_DOB
    });
});

// ─── Helper: create a socket and wait for connection ─────────────────────────

function openSocket(token) {
    return new Promise((resolve, reject) => {
        const s = connectSocket(token);
        s.once("connect",       () => resolve(s));
        s.once("connect_error", (err) => reject(err));
        setTimeout(() => reject(new Error("Socket connect timeout")), 5000);
    });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("VideoKYC Socket — Authentication", () => {

    test("rejects connection with no token", (done) => {
        const s = connectSocket("");   // empty token
        s.once("connect_error", (err) => {
            expect(err.message).toMatch(/AUTH/);
            s.disconnect();
            done();
        });
    });

    test("rejects connection with an invalid token", (done) => {
        const s = connectSocket("invalid.jwt.token");
        s.once("connect_error", (err) => {
            expect(err.message).toMatch(/AUTH/);
            s.disconnect();
            done();
        });
    });

    test("allows connection with a valid JWT", async () => {
        const token = makeToken();
        const s     = await openSocket(token);
        expect(s.connected).toBe(true);
        s.disconnect();
    });
});

describe("VideoKYC Socket — Session Lifecycle (mock mode)", () => {

    let socket;
    let sessionId;

    beforeEach(async () => {
        socket = await openSocket(makeToken());
    });

    afterEach(() => {
        if (socket?.connected) socket.disconnect();
    });

    // ── start_session ──────────────────────────────────────────────────────────
    test("start_session creates a new session and emits session_started", async () => {
        socket.emit("start_session");
        const data = await waitFor(socket, "session_started");

        expect(data).toMatchObject({
            sessionId:    expect.any(String),
            stage:        "WELCOME",
            agentMessage: expect.any(String)
        });

        sessionId = data.sessionId;

        // Verify session exists in DB
        const dbSession = await VideoKycSession.findOne({ sessionId });
        expect(dbSession).not.toBeNull();
        expect(dbSession.status).toBe("active");
    });

    // ── join_session ───────────────────────────────────────────────────────────
    test("join_session emits session_joined with current state", async () => {
        // Create session first via REST-style service call
        socket.emit("start_session");
        const started = await waitFor(socket, "session_started");
        sessionId = started.sessionId;

        // Open a second socket and join
        const s2 = await openSocket(makeToken());
        s2.emit("join_session", { sessionId });
        const joined = await waitFor(s2, "session_joined");

        expect(joined.sessionId).toBe(sessionId);
        expect(joined.stage).toBe("WELCOME");

        s2.disconnect();
    });

    test("join_session emits session_error for unknown sessionId", async () => {
        socket.emit("join_session", { sessionId: "nonexistent-session-id" });
        const err = await waitFor(socket, "session_error");
        expect(err.code).toMatch(/HTTP_404|INTERNAL/);
    });

    // ── send_message — WELCOME → PAN_CAPTURE ──────────────────────────────────
    test("send_message in WELCOME stage advances to PAN_CAPTURE", async () => {
        socket.emit("start_session");
        const started = await waitFor(socket, "session_started");
        sessionId = started.sessionId;

        socket.emit("send_message", { sessionId, message: "Yes, I am ready" });

        const reply = await waitFor(socket, "agent_message", 8000);
        expect(reply.stage).toBe("PAN_CAPTURE");
        expect(reply.nextAction).toBe("upload_pan");
        expect(reply.agentMessage).toBeTruthy();

        const dbSession = await VideoKycSession.findOne({ sessionId });
        expect(dbSession.stage).toBe("PAN_CAPTURE");
    });

    // ── send_frame — PAN OCR ───────────────────────────────────────────────────
    test("send_frame with task=pan_ocr advances to LIVENESS_CHECK", async () => {
        // Get to PAN_CAPTURE stage
        socket.emit("start_session");
        const started = await waitFor(socket, "session_started");
        sessionId = started.sessionId;

        socket.emit("send_message", { sessionId, message: "ready" });
        await waitFor(socket, "agent_message", 8000);

        // Send a PAN frame
        socket.emit("send_frame", {
            sessionId,
            image:    DUMMY_B64,
            mimeType: DUMMY_MIME,
            task:     "pan_ocr"
        });

        const result = await waitFor(socket, "frame_result", 8000);
        expect(result.stage).toBe("LIVENESS_CHECK");
        expect(result.extractedData).toBeDefined();
        expect(result.extractedData.panLast4).toBeDefined();

        const dbSession = await VideoKycSession.findOne({ sessionId });
        expect(dbSession.stage).toBe("LIVENESS_CHECK");
    });

    // ── Full happy path ────────────────────────────────────────────────────────
    test("full KYC flow: WELCOME → PAN → LIVENESS → QUESTIONS → OTP → COMPLETE", async () => {
        // 1. Start session
        socket.emit("start_session");
        const started = await waitFor(socket, "session_started");
        sessionId = started.sessionId;
        expect(started.stage).toBe("WELCOME");

        // 2. WELCOME → PAN_CAPTURE
        socket.emit("send_message", { sessionId, message: "ready" });
        const panStage = await waitFor(socket, "agent_message", 8000);
        expect(panStage.stage).toBe("PAN_CAPTURE");

        // 3. PAN_CAPTURE → LIVENESS_CHECK
        socket.emit("send_frame", { sessionId, image: DUMMY_B64, mimeType: DUMMY_MIME, task: "pan_ocr" });
        const panResult = await waitFor(socket, "frame_result", 8000);
        expect(panResult.stage).toBe("LIVENESS_CHECK");

        // 4. LIVENESS_CHECK → VIDEO_RECORDING
        socket.emit("send_frame", { sessionId, image: DUMMY_B64, mimeType: DUMMY_MIME, task: "liveness" });
        const livenessResult = await waitFor(socket, "frame_result", 8000);
        expect(livenessResult.stage).toBe("VIDEO_RECORDING");

        // 4b. VIDEO_RECORDING → QUESTIONS via upload_video
        socket.emit("upload_video", { sessionId, video: DUMMY_B64, mimeType: "video/webm", durationSeconds: 20 });
        const videoResult = await waitFor(socket, "video_result", 8000);
        expect(videoResult.stage).toBe("QUESTIONS");

        // 5. Get session to know which questions were assigned
        socket.emit("get_session", { sessionId });
        const sessionState = await waitFor(socket, "session_joined", 5000);
        const questions = sessionState.questions;
        expect(questions.length).toBeGreaterThan(0);

        // Answer first question correctly based on question id
        const q1 = questions[0];
        const answer1Map = {
            q_dob:         "15/05/1990",
            q_phone_last4: USER_PHONE.slice(-4),
            q_name:        USER_NAME,
            q_email:       USER_EMAIL
        };
        const ans1 = answer1Map[q1.id];
        socket.emit("send_message", { sessionId, message: ans1 });
        const q1Reply = await waitFor(socket, "agent_message", 8000);

        // If 2 questions, answer the second
        if (questions.length > 1 && q1Reply.stage === "QUESTIONS") {
            const q2 = questions[1];
            const ans2 = answer1Map[q2.id];
            socket.emit("send_message", { sessionId, message: ans2 });
            const q2Reply = await waitFor(socket, "agent_message", 8000);
            expect(q2Reply.stage).toBe("OTP_SENT");
        } else {
            expect(q1Reply.stage).toBe("OTP_SENT");
        }

        // 6. OTP_SENT → COMPLETE
        socket.emit("verify_otp", { sessionId, otp: MOCK_OTP });
        const done = await waitFor(socket, "otp_verified", 8000);
        expect(done.stage).toBe("COMPLETE");
        expect(done.done).toBe(true);

        // Verify DB
        const finalSession = await VideoKycSession.findOne({ sessionId });
        expect(finalSession.status).toBe("verified");
        expect(finalSession.stage).toBe("COMPLETE");
    }, 30000);  // 30 s timeout for full flow

    // ── Error cases ───────────────────────────────────────────────────────────

    test("send_message without sessionId emits session_error", async () => {
        socket.emit("send_message", { message: "hello" });
        const err = await waitFor(socket, "session_error");
        expect(err.code).toBe("MISSING_SESSION_ID");
    });

    test("send_frame without image emits session_error", async () => {
        socket.emit("send_frame", { sessionId: "fake", task: "pan_ocr" });
        const err = await waitFor(socket, "session_error");
        // Either missing image or session not found
        expect(["MISSING_IMAGE", "HTTP_404", "INTERNAL_ERROR"]).toContain(err.code);
    });

    test("verify_otp without otp emits session_error", async () => {
        socket.emit("verify_otp", { sessionId: "fake" });
        const err = await waitFor(socket, "session_error");
        expect(err.code).toBe("MISSING_OTP");
    });

    // ── Keepalive ─────────────────────────────────────────────────────────────

    test("ping_session returns pong_session with expiresAt", async () => {
        socket.emit("start_session");
        const started = await waitFor(socket, "session_started");
        sessionId = started.sessionId;

        socket.emit("ping_session", { sessionId });
        const pong = await waitFor(socket, "pong_session");
        // expiresAt may be null if session not found; if found it's a date string
        expect(pong).toHaveProperty("expiresAt");
    });
});

describe("VideoKYC Socket — Rate Limiter", () => {

    test("emitting send_message rapidly triggers RATE_LIMITED", async () => {
        const socket = await openSocket(makeToken());

        // Flood with 15 messages (bucket capacity = 10)
        const errors = [];
        socket.on("session_error", (e) => errors.push(e));

        for (let i = 0; i < 15; i++) {
            socket.emit("send_message", { sessionId: "fake", message: `msg-${i}` });
        }

        // Wait a moment for all responses
        await new Promise((r) => setTimeout(r, 1000));

        const rateLimited = errors.some((e) => e.code === "RATE_LIMITED");
        expect(rateLimited).toBe(true);

        socket.disconnect();
    });
});
