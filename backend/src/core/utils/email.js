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
            try {
                const mongoose = require('mongoose');
                if (mongoose.connection && mongoose.connection.readyState === 1) {
                    this.settings = await Settings.findOne({ key: 'app_settings' }).lean().maxTimeMS(2000);
                }
            } catch (err) {
                this.settings = null;
            }
        }
        return this.settings;
    }

    /**
     * Send an email
     * @param {Object} options - { to, subject, html, text, from }
     */
    async sendEmail(options) {
        if (process.env.NODE_ENV === 'test') {
            return { messageId: 'mock-test-id' };
        }

        const settings = await this.#getSettings();
        const config = settings?.emailConfig || {};
        
        const provider = process.env.EMAIL_PROVIDER || config.provider || 'nodemailer';
        
        if (provider === 'resend') {
            return this.#sendWithResend(options, config);
        } else {
            return this.#sendWithNodemailer(options, config);
        }
    }

    async #sendWithResend(options, config) {
        const apiKey = process.env.RESEND_API_KEY || config.resendApiKey;
        if (!apiKey) {
            throw new Error('Resend API Key is missing');
        }

        const resend = new Resend(apiKey);
        const fromName = process.env.FROM_NAME || config.fromName || 'PayVit';
        const fromEmail = process.env.FROM_EMAIL || config.fromEmail || 'onboarding@resend.dev';
        const from = options.from || `${fromName} <${fromEmail}>`;

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
        const service = config.smtpService || process.env.SMTP_SERVICE;
        const host = config.smtpHost || process.env.SMTP_HOST;
        const port = Number(config.smtpPort || process.env.SMTP_PORT || 587);
        const user = config.smtpUser || process.env.SMTP_USER;
        const pass = config.smtpPass || process.env.SMTP_PASS;

        if ((!service && !host) || !user || !pass) {
            throw new Error('SMTP configuration is incomplete. Please configure SMTP_USER, SMTP_PASS, and SMTP_HOST (or SMTP_SERVICE) in .env');
        }

        const transportConfig = service
            ? { service, auth: { user, pass } }
            : {
                  host,
                  port,
                  secure: port === 465,
                  auth: { user, pass }
              };

        const transporter = nodemailer.createTransport(transportConfig);

        const fromEmail = config.fromEmail || process.env.FROM_EMAIL || user;
        const fromName = config.fromName || process.env.FROM_NAME || 'PayVit';
        const from = options.from || `${fromName} <${fromEmail}>`;

        try {
            const info = await transporter.sendMail({
                from,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html
            });
            console.log('Email sent successfully via Nodemailer:', info.messageId);
            return info;
        } catch (error) {
            console.error('Nodemailer Error:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();

