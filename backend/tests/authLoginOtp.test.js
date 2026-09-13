const request = require("supertest");
const app = require("../src/app");
const User = require("../src/modules/auth/model/auth.model");
const Otp = require("../src/modules/auth/model/otp.model");
const otpService = require("../src/modules/auth/service/otp.service");
const argon2 = require("argon2");

describe("Auth - Login with Email OTP", () => {
    const testEmail = "testloginuser@example.com";
    const testPassword = "Password@123";

    beforeEach(async () => {
        await User.deleteMany({});
        await Otp.deleteMany({});
    });

    describe("POST /api/v1/auth/send-login-otp", () => {
        it("should reject if user does not exist", async () => {
            const res = await request(app)
                .post("/api/v1/auth/send-login-otp")
                .send({ email: "nonexistent@example.com" })
                .expect(404);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("No account found");
        });

        it("should send login OTP if user exists", async () => {
            const hashedPassword = await argon2.hash(testPassword);
            await User.create({
                userId: "1122334455",
                name: "John Doe",
                email: testEmail,
                password: hashedPassword,
                phone: "9876543210"
            });

            const res = await request(app)
                .post("/api/v1/auth/send-login-otp")
                .send({ email: testEmail })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain("Login OTP has been sent");

            const storedOtp = await Otp.findOne({ email: testEmail, type: "LOGIN" });
            expect(storedOtp).not.toBeNull();
            expect(storedOtp.otpHash).toBeDefined();
            expect(storedOtp.attempts).toBe(0);
        });

        it("should enforce 60s cooldown on duplicate send-login-otp requests", async () => {
            const hashedPassword = await argon2.hash(testPassword);
            await User.create({
                userId: "1122334455",
                name: "John Doe",
                email: testEmail,
                password: hashedPassword,
                phone: "9876543210"
            });

            // First send succeeds
            await request(app)
                .post("/api/v1/auth/send-login-otp")
                .send({ email: testEmail })
                .expect(200);

            // Immediate repeat should be rate-limited
            const res = await request(app)
                .post("/api/v1/auth/send-login-otp")
                .send({ email: testEmail })
                .expect(429);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Please wait");
        });
    });

    describe("POST /api/v1/auth/login-otp", () => {
        it("should reject login with wrong OTP and decrement attempts", async () => {
            const hashedPassword = await argon2.hash(testPassword);
            await User.create({
                userId: "1122334455",
                name: "John Doe",
                email: testEmail,
                password: hashedPassword,
                phone: "9876543210"
            });

            const testOtp = "123456";
            const otpHash = otpService.hashOtp(testOtp, testEmail);
            await Otp.create({
                email: testEmail,
                otpHash,
                type: "LOGIN",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });

            const res = await request(app)
                .post("/api/v1/auth/login-otp")
                .send({
                    email: testEmail,
                    otp: "999999"
                })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("4 attempts remaining");
        });

        it("should log in successfully with valid email OTP and return auth tokens", async () => {
            const hashedPassword = await argon2.hash(testPassword);
            await User.create({
                userId: "1122334455",
                name: "John Doe",
                email: testEmail,
                password: hashedPassword,
                phone: "9876543210"
            });

            const testOtp = "654321";
            const otpHash = otpService.hashOtp(testOtp, testEmail);
            await Otp.create({
                email: testEmail,
                otpHash,
                type: "LOGIN",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });

            const res = await request(app)
                .post("/api/v1/auth/login-otp")
                .set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .send({
                    email: testEmail,
                    otp: testOtp
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Login successful");
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
            expect(res.body.data.user.email).toBe(testEmail);
            expect(res.headers["x-device-id"]).toBeDefined();

            // Verify OTP is cleaned up
            const remainingOtp = await Otp.findOne({ email: testEmail, type: "LOGIN" });
            expect(remainingOtp).toBeNull();
        });
    });
});
