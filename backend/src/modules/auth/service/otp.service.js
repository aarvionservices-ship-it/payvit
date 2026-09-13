const crypto = require("crypto");
const Otp = require("../model/otp.model");
const authRepo = require("../repository/auth.repository");
const emailTemplateService = require("../../emailTemplate/service/emailTemplate.service");
const emailService = require("../../../core/utils/email");
const AppError = require("../../../core/utils/AppError");

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

class OtpService {
    /**
     * Hashes OTP using SHA-256 with email salt
     */
    hashOtp(otp, email) {
        return crypto
            .createHash("sha256")
            .update(`${otp.trim()}:${email.toLowerCase().trim()}`)
            .digest("hex");
    }

    /**
     * Generates a secure 6-digit numeric OTP
     */
    generateOtp() {
        return crypto.randomInt(100000, 1000000).toString();
    }

    /**
     * Sends a registration verification OTP to the user's email
     */
    async sendRegistrationOtp(rawEmail) {
        if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.includes("@")) {
            throw new AppError("A valid email address is required.", 400);
        }

        const email = rawEmail.toLowerCase().trim();

        // 1. Verify that email is not already registered
        const existingUser = await authRepo.findByEmail(email);
        if (existingUser) {
            throw new AppError("Email address already registered. Please try logging in.", 400);
        }

        // 2. Check for existing active OTP and enforce 60s cooldown
        const existingOtp = await Otp.findOne({ email, type: "REGISTRATION" });
        const now = new Date();

        if (existingOtp && existingOtp.resendAfter && existingOtp.resendAfter > now) {
            const waitSeconds = Math.ceil((existingOtp.resendAfter.getTime() - now.getTime()) / 1000);
            throw new AppError(`Please wait ${waitSeconds} seconds before requesting a new OTP.`, 429);
        }

        // 3. Generate 6-digit OTP
        const otp = this.generateOtp();
        const otpHash = this.hashOtp(otp, email);

        const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
        const resendAfter = new Date(now.getTime() + RESEND_COOLDOWN_SECONDS * 1000);

        // 4. Upsert OTP record in database
        await Otp.findOneAndUpdate(
            { email, type: "REGISTRATION" },
            {
                $set: {
                    otpHash,
                    attempts: 0,
                    resendAfter,
                    expiresAt
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        // 5. Send Email with OTP
        await this._dispatchEmail(email, otp);

        return {
            email,
            expiresInMinutes: OTP_EXPIRY_MINUTES,
            resendCooldownSeconds: RESEND_COOLDOWN_SECONDS
        };
    }

    /**
     * Verifies the email OTP for registration
     */
    async verifyRegistrationOtp(rawEmail, providedOtp) {
        if (!rawEmail || !providedOtp) {
            throw new AppError("Email and OTP are required.", 400);
        }

        const email = rawEmail.toLowerCase().trim();
        const otpRecord = await Otp.findOne({ email, type: "REGISTRATION" });

        if (!otpRecord) {
            throw new AppError("No active OTP found for this email. Please request a new OTP.", 400);
        }

        // Check expiration
        if (otpRecord.expiresAt < new Date()) {
            await Otp.deleteOne({ _id: otpRecord._id });
            throw new AppError("OTP has expired. Please request a new OTP.", 400);
        }

        // Check maximum attempt threshold
        if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
            await Otp.deleteOne({ _id: otpRecord._id });
            throw new AppError("Maximum verification attempts exceeded. Please request a new OTP.", 400);
        }

        const providedHash = this.hashOtp(String(providedOtp).trim(), email);

        const isMatch =
            providedHash.length === otpRecord.otpHash.length &&
            crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(otpRecord.otpHash));

        if (!isMatch) {
            const nextAttempts = otpRecord.attempts + 1;
            const remaining = MAX_VERIFY_ATTEMPTS - nextAttempts;

            if (remaining <= 0) {
                await Otp.deleteOne({ _id: otpRecord._id });
                throw new AppError("Invalid OTP. Maximum attempts reached. Please request a new OTP.", 400);
            }

            await Otp.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
            throw new AppError(`Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`, 400);
        }

        // OTP verified successfully -> clean up OTP record
        await Otp.deleteOne({ _id: otpRecord._id });

        return true;
    }

    /**
     * Sends a login verification OTP to the user's email
     */
    async sendLoginOtp(rawEmail) {
        if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.includes("@")) {
            throw new AppError("A valid email address is required.", 400);
        }

        const email = rawEmail.toLowerCase().trim();

        // 1. Verify user exists and is active
        const user = await authRepo.findByEmail(email);
        if (!user) {
            throw new AppError("No account found with this email address.", 404);
        }

        if (user.isActive === false) {
            throw new AppError("Your account has been deactivated. Please contact support.", 403);
        }

        if (user.lockUntil && user.lockUntil > Date.now()) {
            throw new AppError("Account locked. Try again later.", 403);
        }

        // 2. Check for existing active OTP and enforce 60s cooldown
        const existingOtp = await Otp.findOne({ email, type: "LOGIN" });
        const now = new Date();

        if (existingOtp && existingOtp.resendAfter && existingOtp.resendAfter > now) {
            const waitSeconds = Math.ceil((existingOtp.resendAfter.getTime() - now.getTime()) / 1000);
            throw new AppError(`Please wait ${waitSeconds} seconds before requesting a new OTP.`, 429);
        }

        // 3. Generate 6-digit OTP
        const otp = this.generateOtp();
        const otpHash = this.hashOtp(otp, email);

        const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
        const resendAfter = new Date(now.getTime() + RESEND_COOLDOWN_SECONDS * 1000);

        // 4. Upsert OTP record in database
        await Otp.findOneAndUpdate(
            { email, type: "LOGIN" },
            {
                $set: {
                    otpHash,
                    attempts: 0,
                    resendAfter,
                    expiresAt
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        // 5. Send Email with OTP
        await this._dispatchEmail(email, otp, "LOGIN", user.name);

        return {
            email,
            expiresInMinutes: OTP_EXPIRY_MINUTES,
            resendCooldownSeconds: RESEND_COOLDOWN_SECONDS
        };
    }

    /**
     * Verifies the email OTP for login
     */
    async verifyLoginOtp(rawEmail, providedOtp) {
        if (!rawEmail || !providedOtp) {
            throw new AppError("Email and OTP are required.", 400);
        }

        const email = rawEmail.toLowerCase().trim();
        const otpRecord = await Otp.findOne({ email, type: "LOGIN" });

        if (!otpRecord) {
            throw new AppError("No active OTP found for this email. Please request a new OTP.", 400);
        }

        // Check expiration
        if (otpRecord.expiresAt < new Date()) {
            await Otp.deleteOne({ _id: otpRecord._id });
            throw new AppError("OTP has expired. Please request a new OTP.", 400);
        }

        // Check maximum attempt threshold
        if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
            await Otp.deleteOne({ _id: otpRecord._id });
            throw new AppError("Maximum verification attempts exceeded. Please request a new OTP.", 400);
        }

        const providedHash = this.hashOtp(String(providedOtp).trim(), email);

        const isMatch =
            providedHash.length === otpRecord.otpHash.length &&
            crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(otpRecord.otpHash));

        if (!isMatch) {
            const nextAttempts = otpRecord.attempts + 1;
            const remaining = MAX_VERIFY_ATTEMPTS - nextAttempts;

            if (remaining <= 0) {
                await Otp.deleteOne({ _id: otpRecord._id });
                throw new AppError("Invalid OTP. Maximum attempts reached. Please request a new OTP.", 400);
            }

            await Otp.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
            throw new AppError(`Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`, 400);
        }

        // OTP verified successfully -> clean up OTP record
        await Otp.deleteOne({ _id: otpRecord._id });

        return true;
    }

    /**
     * Internal helper to send email or log in dev/test fallback
     */
    async _dispatchEmail(email, otp, type = "REGISTRATION", displayName = null) {
        const username = displayName || email.split("@")[0];
        const isLogin = type === "LOGIN";
        const templateSlug = isLogin ? "login-otp" : "email-verification";
        const emailTitle = isLogin ? "Login Verification Code" : "Verify Your Email Address";
        const emailSubject = isLogin ? "PayVit - Your Login Verification Code" : "PayVit - Email Verification OTP";
        const emailIntro = isLogin
            ? "We received a login request for your PayVit account. Use the verification code below to complete your login:"
            : "Thank you for starting your registration with PayVit. Use the verification code below to verify your email address:";

        try {
            // Try sending with pre-configured template if available
            await emailTemplateService.sendEmailWithTemplate(templateSlug, email, {
                username,
                otp,
                email
            });
        } catch (templateError) {
            // Fallback to direct HTML email via emailService
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800;">PayVit</h1>
                        <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Secure Financial Ecosystem</p>
                    </div>
                    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 16px;">${emailTitle}</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                        Hi <strong>${username}</strong>,
                    </p>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                        ${emailIntro}
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <div style="display: inline-block; padding: 14px 32px; background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px;">
                            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #047857;">${otp}</span>
                        </div>
                    </div>
                    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                        This code is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. If you did not initiate this request, please change your password immediately or contact support.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                        &copy; ${new Date().getFullYear()} PayVit. All rights reserved.
                    </p>
                </div>
            `;

            try {
                await emailService.sendEmail({
                    to: email,
                    subject: emailSubject,
                    html: htmlContent,
                    text: `Your PayVit ${isLogin ? "login" : "verification"} code is: ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`
                });
            } catch (sendError) {
                // If SMTP is unconfigured in development/test, log to console so testing can proceed seamlessly
                console.log(`[AUTH OTP DEV FALLBACK] ${type} OTP for ${email}: ${otp} (Error: ${sendError.message})`);
            }
        }
    }
}

module.exports = new OtpService();
