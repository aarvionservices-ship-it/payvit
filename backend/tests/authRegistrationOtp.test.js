const request = require("supertest");
const app = require("../src/app");
const mongoose = require("mongoose");
const User = require("../src/modules/auth/model/auth.model");
const Otp = require("../src/modules/auth/model/otp.model");
const otpService = require("../src/modules/auth/service/otp.service");
const deviceIdUtil = require("../src/core/utils/deviceId.util");

describe("Auth - Email OTP Verification & Device ID Generation", () => {
    const testEmail = "newuser@example.com";
    const testPassword = "Password@123";

    beforeEach(async () => {
        await User.deleteMany({});
        await Otp.deleteMany({});
    });

    describe("Device ID Utility & Endpoint", () => {
        it("should generate formatted device ID matching dev_<id>_<hex>", () => {
            const deviceId = deviceIdUtil.generateDeviceId();
            expect(deviceId).toMatch(/^dev_\d+_[a-f0-9]{8}$/);
        });

        it("GET /api/v1/auth/device-id should return a generated device ID and header", async () => {
            const res = await request(app)
                .get("/api/v1/auth/device-id")
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.deviceId).toMatch(/^dev_\d+_[a-f0-9]{8}$/);
            expect(res.headers["x-device-id"]).toBe(res.body.data.deviceId);
        });
    });

    describe("POST /api/v1/auth/send-registration-otp", () => {
        it("should reject invalid email format", async () => {
            const res = await request(app)
                .post("/api/v1/auth/send-registration-otp")
                .send({ email: "invalid-email" })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it("should send OTP and store hashed OTP in database", async () => {
            const res = await request(app)
                .post("/api/v1/auth/send-registration-otp")
                .send({ email: testEmail })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain("Verification OTP has been sent");

            const storedOtp = await Otp.findOne({ email: testEmail, type: "REGISTRATION" });
            expect(storedOtp).not.toBeNull();
            expect(storedOtp.otpHash).toBeDefined();
            expect(storedOtp.attempts).toBe(0);
        });

        it("should enforce 60-second cooldown on consecutive OTP requests", async () => {
            // First request succeeds
            await request(app)
                .post("/api/v1/auth/send-registration-otp")
                .send({ email: testEmail })
                .expect(200);

            // Immediate second request should be rate-limited
            const res = await request(app)
                .post("/api/v1/auth/send-registration-otp")
                .send({ email: testEmail })
                .expect(429);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Please wait");
        });

        it("should reject sending OTP if email is already registered", async () => {
            // Seed existing user
            await User.create({
                userId: "1234567890",
                name: "Existing User",
                email: testEmail,
                password: "hashedPassword",
                phone: "9876543210"
            });

            const res = await request(app)
                .post("/api/v1/auth/send-registration-otp")
                .send({ email: testEmail })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("already registered");
        });
    });

    describe("POST /api/v1/auth/register with Email OTP & Device ID", () => {
        it("should reject registration with invalid or missing OTP", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    name: "Alice Doe",
                    email: testEmail,
                    phone: "9876543210",
                    password: testPassword,
                    otp: "000000"
                })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it("should successfully register user when valid OTP is provided and generate deviceId", async () => {
            // 1. Manually seed a known OTP
            const testOtp = "654321";
            const otpHash = otpService.hashOtp(testOtp, testEmail);

            await Otp.create({
                email: testEmail,
                otpHash,
                type: "REGISTRATION",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });

            // 2. Perform registration
            const res = await request(app)
                .post("/api/v1/auth/register")
                .set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .send({
                    name: "Alice Doe",
                    email: testEmail,
                    phone: "9876543210",
                    password: testPassword,
                    otp: testOtp
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe(testEmail);
            expect(res.body.data.isEmailVerified).toBe(true);
            expect(res.body.data.deviceId).toMatch(/^dev_\d+_[a-f0-9]{8}$/);
            expect(res.headers["x-device-id"]).toBe(res.body.data.deviceId);

            // Verify user in DB
            const createdUser = await User.findOne({ email: testEmail });
            expect(createdUser).not.toBeNull();
            expect(createdUser.isEmailVerified).toBe(true);
            expect(createdUser.deviceId).toBe(res.body.data.deviceId);
            expect(createdUser.devices).toHaveLength(1);
            expect(createdUser.devices[0].deviceId).toBe(res.body.data.deviceId);
            expect(createdUser.devices[0].os).toBe("Windows");

            // Verify OTP record is cleaned up
            const remainingOtp = await Otp.findOne({ email: testEmail });
            expect(remainingOtp).toBeNull();
        });

        it("should accept client-provided deviceId in header or payload", async () => {
            const testOtp = "112233";
            const customDeviceId = "dev_custom_client_device_99";
            const otpHash = otpService.hashOtp(testOtp, testEmail);

            await Otp.create({
                email: testEmail,
                otpHash,
                type: "REGISTRATION",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });

            const res = await request(app)
                .post("/api/v1/auth/register")
                .set("X-Device-Id", customDeviceId)
                .send({
                    name: "Bob Builder",
                    email: testEmail,
                    phone: "9876543210",
                    password: testPassword,
                    otp: testOtp
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.deviceId).toBe(customDeviceId);

            const createdUser = await User.findOne({ email: testEmail });
            expect(createdUser.deviceId).toBe(customDeviceId);
            expect(createdUser.devices[0].deviceId).toBe(customDeviceId);
        });
    });

    describe("POST /api/v1/auth/verify-registration-otp & resend-registration-otp", () => {
        it("should verify OTP via standalone /verify-registration-otp endpoint", async () => {
            const testOtp = "778899";
            const otpHash = otpService.hashOtp(testOtp, testEmail);

            await Otp.create({
                email: testEmail,
                otpHash,
                type: "REGISTRATION",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });

            const res = await request(app)
                .post("/api/v1/auth/verify-registration-otp")
                .send({
                    email: testEmail,
                    otp: testOtp
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain("Email verified successfully");
        });

        it("should track failed attempts and reject on invalid OTP", async () => {
            const testOtp = "123123";
            const otpHash = otpService.hashOtp(testOtp, testEmail);

            await Otp.create({
                email: testEmail,
                otpHash,
                type: "REGISTRATION",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });

            const res = await request(app)
                .post("/api/v1/auth/verify-registration-otp")
                .send({
                    email: testEmail,
                    otp: "999999"
                })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("4 attempts remaining");
        });

        it("should allow resending OTP via /resend-registration-otp after cooldown expires", async () => {
            // Seed expired cooldown OTP
            await Otp.create({
                email: testEmail,
                otpHash: "hash",
                type: "REGISTRATION",
                resendAfter: new Date(Date.now() - 5000), // cooldown already passed
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });

            const res = await request(app)
                .post("/api/v1/auth/resend-registration-otp")
                .send({ email: testEmail })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain("A new verification OTP has been sent");
        });
    });
});

