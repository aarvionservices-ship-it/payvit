const eventBus = require("../../../core/eventBus");
const emailService = require("../../../core/utils/email");
const emailTemplateService = require("../../emailTemplate/service/emailTemplate.service");

/**
 * Sends a rich, branded welcome email to any newly registered user
 * @param {Object} user 
 */
async function sendWelcomeEmail(user) {
    if (!user || !user.email) {
        console.warn("[AUTH EVENTS] Cannot send welcome email: user or email missing.");
        return;
    }

    const email = user.email.toLowerCase().trim();
    const name = user.name || user.username || email.split("@")[0];
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const loginUrl = `${frontendUrl}/login`;
    const year = new Date().getFullYear();

    console.log(`[AUTH EVENTS] Dispatching welcome email to registered user: ${email} (${name})`);

    try {
        // Check if there is a customized template in DB with slug 'welcome-email'
        try {
            await emailTemplateService.sendEmailWithTemplate("welcome-email", email, {
                username: name,
                email: email,
                userId: user.userId || "",
                loginUrl
            });
            console.log(`[AUTH EVENTS] Welcome email successfully sent via template to: ${email}`);
            return;
        } catch (tmplErr) {
            // Template not found in DB or inactive - proceed to direct HTML delivery
        }

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to PayVit</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                <!-- Header Banner -->
                <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 36px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 30px; font-weight: 800; letter-spacing: -0.5px;">PayVit</h1>
                    <p style="margin: 6px 0 0; color: #a7f3d0; font-size: 14px; font-weight: 500;">Next-Gen Secure Financial Platform</p>
                </div>

                <!-- Main Content -->
                <div style="padding: 32px 30px; color: #334155;">
                    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 22px; font-weight: 700;">
                        Welcome to PayVit, ${name}! 🎉
                    </h2>
                    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
                        We are thrilled to have you on board. Your PayVit account has been successfully created and verified. You're now ready to experience fast, secure, and seamless financial services.
                    </p>

                    <!-- Account Details Card -->
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 12px; color: #166534; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Account Summary</h3>
                        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 4px 0; color: #4b5563; font-weight: 600;">Registered Email:</td>
                                <td style="padding: 4px 0; color: #111827; text-align: right; font-weight: 500;">${email}</td>
                            </tr>
                            ${user.userId ? `
                            <tr>
                                <td style="padding: 4px 0; color: #4b5563; font-weight: 600;">Customer ID:</td>
                                <td style="padding: 4px 0; color: #111827; text-align: right; font-family: monospace; font-size: 13px;">${user.userId}</td>
                            </tr>` : ""}
                            <tr>
                                <td style="padding: 4px 0; color: #4b5563; font-weight: 600;">Account Status:</td>
                                <td style="padding: 4px 0; color: #059669; text-align: right; font-weight: 700;">Active & Verified ✓</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Highlights -->
                    <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1e293b;">Here is what you can do right away:</p>
                    <ul style="margin: 0 0 24px; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.7;">
                        <li><strong>Instant Bill Payments & Recharges:</strong> Pay electricity, water, mobile, and DTH in seconds.</li>
                        <li><strong>Virtual Cards & Loans:</strong> Apply for premium cards and pre-approved personal loans.</li>
                        <li><strong>Smart Wallet:</strong> Manage funds and track your transactions in real-time.</li>
                        <li><strong>Top-tier Security:</strong> Multi-factor authentication & 256-bit encryption.</li>
                    </ul>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${loginUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; font-size: 15px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
                            Log In to Your Account &rarr;
                        </a>
                    </div>

                    <!-- Security Notice -->
                    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #991b1b; font-size: 12px; line-height: 1.5;">
                            <strong>Security Tip:</strong> PayVit will never ask for your password, PIN, or OTP over email or phone. If you did not create this account, please contact us immediately.
                        </p>
                    </div>

                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748b;">
                        Need assistance? Our support team is here for you 24/7. Just reach out to <a href="mailto:varshini@payvit.in" style="color: #059669; text-decoration: underline;">varshini@payvit.in</a>.
                    </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 6px; color: #64748b; font-size: 12px; font-weight: 500;">
                        &copy; ${year} PayVit Inc. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                        This email was sent to ${email} because an account was registered with PayVit.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;

        await emailService.sendEmail({
            to: email,
            subject: `Welcome to PayVit, ${name}! 🎉`,
            html: htmlContent,
            text: `Hi ${name},\n\nWelcome to PayVit! Your account (${email}) has been successfully created and verified.\n\nLog in now at: ${loginUrl}\n\nThank you for choosing PayVit.`
        });

        console.log(`[AUTH EVENTS] Welcome email successfully sent via Nodemailer to: ${email}`);
    } catch (error) {
        console.error(`[AUTH EVENTS] Failed to send welcome email to ${email}:`, error.message);
    }
}

eventBus.on("user.registered", async (user) => {
    console.log("User registered event received for:", user?.email);
    await sendWelcomeEmail(user);
});

eventBus.on("user.login", (user) => {
    console.log("User login event:", user?.email);
});

module.exports = {
    sendWelcomeEmail
};
