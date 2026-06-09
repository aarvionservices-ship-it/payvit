const Joi = require("joi");

module.exports = Joi.object({

    customerName: Joi.string().required(),

    phone: Joi.string().required(),

    email: Joi.string().email(),

    loanType: Joi.string().valid(
        "personal",
        "business",
        "home",
        "credit_card"
    ),

    source: Joi.string().valid(
        "affiliate",
        "direct",
        "ad",
        "employee_referral",
        "csv_upload"
    ),

    leadType: Joi.string().valid(
        "customer_applied",
        "cold_calling"
    ).optional(),

    customerId: Joi.string().optional(),
    assignedEmployee: Joi.string().optional(),

    productId: Joi.string().optional(),
    productType: Joi.string().valid('loan', 'card', 'credit_card').optional(),

    note: Joi.string().optional(),

    documents: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
        documentType: Joi.string().valid('aadhaar', 'pan', 'bank_statement')
    }))

});
