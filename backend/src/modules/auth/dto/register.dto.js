const Joi = require("joi");

module.exports = Joi.object({

    name: Joi.string().min(3).required().messages({
        "string.empty": "Name is required",
        "string.min": "Name must be at least 3 characters long",
        "any.required": "Name is required"
    }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            "string.empty": "Email is required",
            "string.email": "Invalid email address",
            "any.required": "Email is required"
        }),

    password: Joi.string()
        .min(8)
        .required()
        .messages({
            "string.empty": "Password is required",
            "string.min": "Password must be at least 8 characters long",
            "any.required": "Password is required"
        }),

    phone: Joi.string()
        .regex(/^[0-9]{10}$/)
        .required()
        .messages({
            "string.empty": "Phone number is required",
            "string.pattern.base": "Phone number must be exactly 10 digits",
            "any.required": "Phone number is required"
        }),

    otp: Joi.string()
        .trim()
        .length(6)
        .regex(/^[0-9]{6}$/)
        .required()
        .messages({
            "string.empty": "Email OTP is required",
            "string.length": "Email OTP must be exactly 6 digits",
            "string.pattern.base": "Email OTP must contain 6 numeric digits",
            "any.required": "Email OTP is required for verification"
        }),

    deviceId: Joi.string()
        .optional()
        .allow("", null)
        .messages({
            "string.base": "Device ID must be a valid string"
        })

});
