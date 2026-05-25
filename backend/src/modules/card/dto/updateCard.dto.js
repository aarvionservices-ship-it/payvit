const Joi = require('joi');

module.exports = Joi.object({
    cardName: Joi.string().trim(),
    bank: Joi.string().trim(),
    type: Joi.string().valid('credit', 'debit', 'prepaid'),
    category: Joi.array().items(Joi.string()),
    network: Joi.array().items(Joi.string()),
    fees: Joi.object({
        joiningFee: Joi.alternatives().try(Joi.number(), Joi.string()),
        annualFee: Joi.alternatives().try(Joi.number(), Joi.string()),
        reloadFee: Joi.string(),
        joiningFeeNote: Joi.string()
    }),
    eligibility: Joi.object({
        age: Joi.string(),
        minIncomeMonthly: Joi.number(),
        creditScore: Joi.number().allow(null),
        note: Joi.string(),
        businessType: Joi.string(),
        companyType: Joi.string(),
        minBusinessTurnoverYearly: Joi.number(),
        documentsRequired: Joi.array().items(Joi.string()),
        fdRequired: Joi.boolean(),
        minFD: Joi.number()
    }),
    features: Joi.object().unknown(true),
    tags: Joi.array().items(Joi.string()),
    score: Joi.object({
        travel: Joi.number(),
        shopping: Joi.number(),
        fuel: Joi.number(),
        lifestyle: Joi.number(),
        dining: Joi.number(),
        premium: Joi.number(),
        forex: Joi.number(),
        business: Joi.number(),
        beginner: Joi.number(),
        secured: Joi.number()
    }),
    bestFor: Joi.array().items(Joi.string()),
    description: Joi.string().trim()
});

