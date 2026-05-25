const argon2 = require("argon2");
const crypto = require("crypto");
const env = require("../../../core/config/env.config");


const authRepo = require("../repository/auth.repository");
const tokenService = require("./token.service");
const emailTemplateService = require("../../emailTemplate/service/emailTemplate.service");

const snowflake = require("../../../core/utils/distributedId");
const auditService = require("../../../core/audit/audit.service");

const eventBus = require("../../../core/eventBus");

const AppError = require("../../../core/utils/AppError");

class AuthService {

    async register(data, ip) {

        const existing = await authRepo.findByEmail(data.email);

        if (existing)
            throw new AppError("Email address already registered. Please try logging in.", 400);

        const hashedPassword = await argon2.hash(data.password);

        const user = await authRepo.createUser({
            userId: snowflake.nextId(),
            name: data.name,
            phone: data.phone,
            email: data.email,
            password: hashedPassword,
        });

        await auditService.log(
            "USER_REGISTER",
            user.userId,
            "user",
            user.userId,
            {},
            ip
        );

        eventBus.emit("user.registered", user);

        return user;

    }

    async login(data, ip) {

        const user = await authRepo.findByEmail(data.email);

        if (!user)
            throw new Error("Invalid credentials");


        if (user.lockUntil && user.lockUntil > Date.now()) {
            throw new Error("Account locked. Try again later.");
        }

        // CHECK ACTIVE STATUS
        if (user.isActive === false) {
            throw new Error("Your account has been deactivated. Please contact support.");
        }


        // VERIFY PASSWORD

        const valid = await argon2.verify(user.password, data.password);

        if (!valid) {

            await authRepo.incrementLoginAttempts(user.userId);

            if (user.loginAttempts + 1 >= 5) {

                const lockTime = Date.now() + 15 * 60 * 1000;

                await authRepo.lockAccount(user.userId, lockTime);

                await auditService.log(
                    "ACCOUNT_LOCKED",
                    user.userId,
                    "user",
                    user.userId,
                    {},
                    ip
                );

                throw new Error("Account locked for 15 minutes");

            }

            throw new Error("Invalid credentials");

        }


        // SUCCESSFUL LOGIN

        await authRepo.resetLoginAttempts(user.userId);

        const payload = {
            userId: user.userId,
            role: user.role
        };

        const accessToken = tokenService.generateAccessToken(payload);
        const refreshToken = tokenService.generateRefreshToken(payload);

        const hashedRefresh = await argon2.hash(refreshToken);

        await authRepo.updateRefreshToken(user.userId, hashedRefresh);

        let userObj = user.toJSON ? user.toJSON() : user;
        if (userObj.profileImage && userObj.profileImage.data) {
            userObj.profileImage = `data:${userObj.profileImage.contentType};base64,${Buffer.from(userObj.profileImage.data).toString("base64")}`;
        } else {
            userObj.profileImage = null;
        }
        delete userObj.password;
        delete userObj.refreshToken;

        return {
            accessToken,
            refreshToken,
            user: userObj
        };

    }

    async refreshToken(token) {

        const decoded = tokenService.verifyRefreshToken(token);

        const user = await authRepo.findById(decoded.userId);

        if (!user)
            throw new Error("User not found");

        const valid = await argon2.verify(user.refreshToken, token);

        if (!valid)
            throw new Error("Invalid refresh token");

        const payload = {
            userId: user.userId,
            role: user.role,
        };

        const accessToken = tokenService.generateAccessToken(payload);
        const refreshToken = tokenService.generateRefreshToken(payload);

        const hashed = await argon2.hash(refreshToken);

        await authRepo.updateRefreshToken(user.userId, hashed);

        return { accessToken, refreshToken };

    }

    async logout(userId) {

        await authRepo.updateRefreshToken(userId, null);
    }

    async getMe(userId) {
        let user = await authRepo.findById(userId);
        if (user) {
            user = user.toJSON ? user.toJSON() : user;
            if (user.profileImage && user.profileImage.data) {
                user.profileImage = `data:${user.profileImage.contentType};base64,${Buffer.from(user.profileImage.data).toString("base64")}`;
            } else {
                user.profileImage = null;
            }
            delete user.password;
            delete user.refreshToken;
        }
        return user;
    }

    async forgotPassword(email, ip) {
        const user = await authRepo.findByEmail(email);
        if (!user) {
            // To prevent email enumeration, we return success even if user doesn't exist
            return true;
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        
        await authRepo.update(user.userId, {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: Date.now() + 900000 // 15 minutes
        });

        const resetLink = `${env.frontendUrl}/reset-password?token=${resetToken}&userId=${user.userId}`;

        await emailTemplateService.sendEmailWithTemplate("password-reset", user.email, {
            username: user.name,
            link: resetLink
        });

        await auditService.log(
            "PASSWORD_RESET_REQUESTED",
            user.userId,
            "user",
            user.userId,
            {},
            ip
        );

        return true;
    }

    async validateResetToken(userId, token) {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await authRepo.findById(userId);

        if (!user || user.resetPasswordToken !== hashedToken || user.resetPasswordExpires < Date.now()) {
            throw new AppError("Invalid or expired reset token", 400);
        }

        return true;
    }

    async resetPassword(userId, token, newPassword, ip) {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await authRepo.findById(userId);

        if (!user || user.resetPasswordToken !== hashedToken || user.resetPasswordExpires < Date.now()) {
            throw new AppError("Invalid or expired reset token", 400);
        }

        const hashedPassword = await argon2.hash(newPassword);
        await authRepo.update(user.userId, {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
            loginAttempts: 0,
            lockUntil: null
        });

        await auditService.log(
            "PASSWORD_RESET_SUCCESS",
            user.userId,
            "user",
            user.userId,
            {},
            ip
        );

        return true;
    }

}

module.exports = new AuthService();
