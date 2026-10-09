require("dotenv").config();
const mongoose = require("mongoose");
const EmailTemplate = require("../src/modules/emailTemplate/model/emailTemplate.model");

const defaultTemplates = [
    {
        name: "Video KYC OTP Verification",
        slug: "pan-otp",
        subject: "PayVit - Video KYC Verification Code: {{otp}}",
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800;">PayVit</h1>
                    <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Secure Financial Ecosystem</p>
                </div>
                <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Video KYC Verification Code</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    Hi <strong>{{username}}</strong>,
                </p>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    You have successfully answered your identity security questions. Please enter the 6-digit verification code below to complete your Video KYC:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <div style="display: inline-block; padding: 14px 32px; background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #047857;">{{otp}}</span>
                    </div>
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                    This code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                    &copy; PayVit. All rights reserved.
                </p>
            </div>
        `,
        tokens: ["username", "email", "otp", "panLast4"],
        isActive: true
    },
    {
        name: "KYC Approved",
        slug: "kyc-approved",
        subject: "PayVit - Identity Verification Approved!",
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800;">PayVit</h1>
                    <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Secure Financial Ecosystem</p>
                </div>
                <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 16px;">KYC Verification Successful</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    Hi <strong>{{username}}</strong>,
                </p>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    Congratulations! Your identity and KYC verification has been successfully verified. Your account limits and full wallet services are now activated.
                </p>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                    Thank you for choosing PayVit.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                    &copy; PayVit. All rights reserved.
                </p>
            </div>
        `,
        tokens: ["username", "email"],
        isActive: true
    },
    {
        name: "Login OTP",
        slug: "login-otp",
        subject: "PayVit - Your Login Verification Code: {{otp}}",
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800;">PayVit</h1>
                    <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Secure Financial Ecosystem</p>
                </div>
                <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Login Verification Code</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    Hi <strong>{{username}}</strong>,
                </p>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    We received a login request for your PayVit account. Use the verification code below to log in:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <div style="display: inline-block; padding: 14px 32px; background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #047857;">{{otp}}</span>
                    </div>
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                    This code is valid for <strong>10 minutes</strong>. If you did not initiate this login request, please contact support immediately.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                    &copy; PayVit. All rights reserved.
                </p>
            </div>
        `,
        tokens: ["username", "email", "otp"],
        isActive: true
    },
    {
        name: "Registration Email Verification",
        slug: "email-verification",
        subject: "PayVit - Email Verification Code: {{otp}}",
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800;">PayVit</h1>
                    <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Secure Financial Ecosystem</p>
                </div>
                <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Verify Your Email Address</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    Hi <strong>{{username}}</strong>,
                </p>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    Thank you for starting your registration with PayVit. Use the verification code below to verify your email address:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <div style="display: inline-block; padding: 14px 32px; background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #047857;">{{otp}}</span>
                    </div>
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                    This code is valid for <strong>10 minutes</strong>.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                    &copy; PayVit. All rights reserved.
                </p>
            </div>
        `,
        tokens: ["username", "email", "otp"],
        isActive: true
    },
    {
        name: "Password Reset",
        slug: "password-reset",
        subject: "PayVit - Password Reset Request",
        body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800;">PayVit</h1>
                    <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Secure Financial Ecosystem</p>
                </div>
                <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Password Reset</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    Hi <strong>{{username}}</strong>,
                </p>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    We received a request to reset your password. Use the following link or token to proceed with resetting your password:
                </p>
                <p style="text-align: center; margin: 24px 0;">
                    <a href="{{link}}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                </p>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                    If you did not request this, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                    &copy; PayVit. All rights reserved.
                </p>
            </div>
        `,
        tokens: ["username", "email", "link"],
        isActive: true
    }
];

async function seedEmailTemplates() {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("Connected to MongoDB for seeding templates");
        }

        for (const tpl of defaultTemplates) {
            const existing = await EmailTemplate.findOne({ slug: tpl.slug });
            if (!existing) {
                await EmailTemplate.create(tpl);
                console.log(`Created template: ${tpl.slug}`);
            } else {
                await EmailTemplate.updateOne({ slug: tpl.slug }, { $set: tpl });
                console.log(`Updated template: ${tpl.slug}`);
            }
        }
        console.log("Email templates seeded successfully.");
    } catch (err) {
        console.error("Error seeding email templates:", err);
    }
}

if (require.main === module) {
    seedEmailTemplates().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedEmailTemplates;
