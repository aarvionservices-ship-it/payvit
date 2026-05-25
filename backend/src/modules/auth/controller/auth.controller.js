const authService = require("../service/auth.service");

class AuthController {

    async register(req, res) {

        const user = await authService.register(
            req.body,
            req.ip
        );

        res.json({
            success: true,
            message: "User registered",
            data: user,
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
