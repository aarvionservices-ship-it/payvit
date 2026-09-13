const authService = require("../service/auth.service");
const otpService = require("../service/otp.service");
const deviceIdUtil = require("../../../core/utils/deviceId.util");

class AuthController {

    async register(req, res) {

        const deviceId = deviceIdUtil.resolveDeviceId(req);

        const user = await authService.register(
            req.body,
            req.ip,
            req.headers["user-agent"] || "",
            deviceId
        );

        res.setHeader("X-Device-Id", user.deviceId);

        res.json({
            success: true,
            message: "User registered successfully",
            data: user,
        });

    }

    async sendRegistrationOtp(req, res) {

        const result = await otpService.sendRegistrationOtp(req.body.email);

        res.json({
            success: true,
            message: "Verification OTP has been sent to your email.",
            data: result
        });

    }

    async verifyRegistrationOtp(req, res) {

        await otpService.verifyRegistrationOtp(req.body.email, req.body.otp);

        res.json({
            success: true,
            message: "Email verified successfully."
        });

    }

    async resendRegistrationOtp(req, res) {

        const result = await otpService.sendRegistrationOtp(req.body.email);

        res.json({
            success: true,
            message: "A new verification OTP has been sent to your email.",
            data: result
        });

    }

    async sendLoginOtp(req, res) {

        const result = await otpService.sendLoginOtp(req.body.email);

        res.json({
            success: true,
            message: "Login OTP has been sent to your email.",
            data: result
        });

    }

    async resendLoginOtp(req, res) {

        const result = await otpService.sendLoginOtp(req.body.email);

        res.json({
            success: true,
            message: "A new login OTP has been sent to your email.",
            data: result
        });

    }

    async loginWithOtp(req, res) {

        const deviceId = deviceIdUtil.resolveDeviceId(req);

        const result = await authService.loginWithOtp(
            req.body,
            req.ip,
            req.headers["user-agent"] || "",
            deviceId
        );

        if (result.deviceId) {
            res.setHeader("X-Device-Id", result.deviceId);
        }

        res.json({
            success: true,
            message: "Login successful",
            data: result,
        });

    }

    async getDeviceId(req, res) {

        const deviceId = deviceIdUtil.generateDeviceId();

        res.setHeader("X-Device-Id", deviceId);

        res.json({
            success: true,
            message: "Device ID generated successfully",
            data: { deviceId }
        });

    }

    async login(req, res) {

        const result = await authService.login(
            req.body,
            req.ip
        );

        res.json({
            success: true,
            message: "Login successful",
            data: result,
        });

    }

    async refresh(req, res) {

        const tokens = await authService.refreshToken(
            req.body.refreshToken
        );

        res.json({
            success: true,
            message: "Token refreshed",
            data: tokens,
        });

    }

    async logout(req, res) {

        await authService.logout(req.user.userId);

        res.json({
            success: true,
            message: "Logged out",
        });

    }

    async me(req, res) {

        const user = await authService.getMe(req.user.userId);

        res.json({
            success: true,
            data: user,
        });

    }

    async forgotPassword(req, res) {
        await authService.forgotPassword(req.body.email, req.ip);
        res.json({
            success: true,
            message: "If an account exists with that email, a password reset link has been sent."
        });
    }

    async validateResetToken(req, res) {
        await authService.validateResetToken(req.query.userId, req.query.token);
        res.json({
            success: true,
            message: "Token is valid"
        });
    }

    async resetPassword(req, res) {
        await authService.resetPassword(req.body.userId, req.body.token, req.body.password, req.ip);
        res.json({
            success: true,
            message: "Password has been reset successfully."
        });
    }

}

module.exports = new AuthController();
