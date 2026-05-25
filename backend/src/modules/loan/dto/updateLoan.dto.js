const Joi = require('joi');

module.exports = Joi.object({
    loanName: Joi.string().trim(),
    provider: Joi.string().trim(),
    bankName: Joi.string().trim(),
    loanType: Joi.string().trim(),
    category: Joi.string().trim(),
    interestRate: Joi.object().unknown(true),
    loanAmount: Joi.object().unknown(true),
    tenure: Joi.object().unknown(true),
    feesAndCharges: Joi.object().unknown(true),
    eligibility: Joi.object().unknown(true),
    documentsRequired: Joi.object().unknown(true),
    features: Joi.array().items(Joi.string()),
    repayment: Joi.object().unknown(true),
    disbursal: Joi.object().unknown(true),
    specialOffers: Joi.array().items(Joi.string()),
    pros: Joi.array().items(Joi.string()),
    cons: Joi.array().items(Joi.string()),
    contact: Joi.object().unknown(true),
    gradient: Joi.string().allow('').optional(),
    imageUrl: Joi.string().allow('').optional(),
    lastUpdated: Joi.string()
});

