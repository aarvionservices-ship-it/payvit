const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const Settings = require('../../modules/settings/model/settings.model');

/**
 * Email Service to send emails using Nodemailer (SMTP) or Resend
 */
class EmailService {
    constructor() {
        this.settings = null;
    }

    async #getSettings() {
        if (!this.settings) {
            this.settings = await Settings.findOne({ key: 'app_settings' });
        }
        return this.settings;
    }

    /**
     * Send an email
     * @param {Object} options - { to, subject, html, text, from }
     */
    async sendEmail(options) {
        const settings = await this.#getSettings();
        const config = settings?.emailConfig || {};
        
        const provider = config.provider || process.env.EMAIL_PROVIDER || 'nodemailer';
        
        if (provider === 'resend') {
            return this.#sendWithResend(options, config);
        } else {
            return this.#sendWithNodemailer(options, config);
        }
    }

    async #sendWithResend(options, config) {
        const apiKey = config.resendApiKey || process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('Resend API Key is missing');
        }

        const resend = new Resend(apiKey);
        const from = options.from || `${config.fromName || process.env.FROM_NAME || 'PayVit'} <${config.fromEmail || process.env.FROM_EMAIL || 'noreply@resend.dev'}>`;

        try {
            const data = await resend.emails.send({
                from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            });
            console.log('Email sent via Resend:', data);
            return data;
        } catch (error) {
            console.error('Resend Error:', error);
            throw error;
        }
    }

    async #sendWithNodemailer(options, config) {
        const host = config.smtpHost || process.env.SMTP_HOST;
        const port = config.smtpPort || process.env.SMTP_PORT || 587;
        const user = config.smtpUser || process.env.SMTP_USER;
        const pass = config.smtpPass || process.env.SMTP_PASS;

        if (!host || !user || !pass) {
            throw new Error('SMTP configuration is incomplete');
        }

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port == 465, // true for 465, false for other ports
            auth: {
                user,
                pass
            }
        });

        const from = options.from || `${config.fromName || process.env.FROM_NAME || 'PayVit'} <${config.fromEmail || process.env.FROM_EMAIL}>`;

        try {
            const info = await transporter.sendMail({
                from,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html
            });
            console.log('Email sent via Nodemailer:', info.messageId);
            return info;
        } catch (error) {
            console.error('Nodemailer Error:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();

