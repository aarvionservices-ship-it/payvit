const Joi = require('joi');

module.exports = Joi.object({
    loanName: Joi.string().required().trim(),
    provider: Joi.string().required().trim(),
    bankName: Joi.string().required().trim(),
    loanType: Joi.string().required().trim(),
    category: Joi.string().required().trim(),
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
    imageUrl: Joi.string().allow('').optional(),
    gradient: Joi.string().allow('').optional(),
    lastUpdated: Joi.string()
});

