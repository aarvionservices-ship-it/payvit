const Joi = require("joi");

module.exports = Joi.object({

    name: Joi.string().min(3),
    phone: Joi.string().allow(""),
    profileImage: Joi.string().allow(null, ""),

    dob: Joi.date().allow(null, ""),
    gender: Joi.string().valid("male", "female", "other").allow(null, ""),
    occupation: Joi.string().allow(null, ""),
    annualIncome: Joi.number().allow(null),
    panNumber: Joi.string().allow(null, ""),
    aadhaarNumber: Joi.string().allow(null, ""),
    addresses: Joi.array().items(Joi.object({
        street: Joi.string().allow(null, ""),
        city: Joi.string().allow(null, ""),
        state: Joi.string().allow(null, ""),
        pincode: Joi.string().allow(null, ""),
        type: Joi.string().valid("current", "permanent", "office")
    })).allow(null),

    currentPassword: Joi.string().min(8),
    newPassword: Joi.string().min(8),
    confirmPassword: Joi.any().valid(Joi.ref('newPassword')),
    favoriteOffers: Joi.array().items(Joi.string())

});
