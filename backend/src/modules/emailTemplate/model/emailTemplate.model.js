const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true
    },
    tokens: [{
        type: String,
        enum: ['username', 'phone', 'email', 'loanAmount', 'cardName', 'rechargeAmount', 'otp', 'link'],
        default: ['username', 'email']
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);

