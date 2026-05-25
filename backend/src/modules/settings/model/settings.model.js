const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'app_settings'
    },
    ui: {
        categories: [
            {
                id: String,
                name: String,
                theme: String,
                icon: String, // Material symbol name
                imageUrl: String,
                quote: String,
                color: String
            }
        ],
        hero: {
            title: String,
            subtitle: String
        }
    },
    communication: {
        supportEmail: String,
        supportPhone: String,
        address: String
    },
    notification: {
        enableEmail: { type: Boolean, default: true },
        newLeadAlert: { type: Boolean, default: true },
        adminEmails: [String]
    },
    general: {
        platformName: { type: String, default: 'PayVit' },
        autoLeadAssignment: { type: Boolean, default: true },
        defaultCommissionRate: { type: Number, default: 2.0 },
        minPayoutThreshold: { type: Number, default: 1000 }
    },
    emailConfig: {
        provider: { 
            type: String, 
            enum: ['nodemailer', 'resend'], 
            default: 'nodemailer' 
        },
        smtpHost: String,
        smtpPort: Number,
        smtpUser: String,
        smtpPass: String,
        resendApiKey: String,
        fromEmail: String,
        fromName: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);

