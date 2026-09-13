const Joi = require("joi");

const sendOtpDTO = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            "string.empty": "Email is required",
            "string.email": "Invalid email address format",
            "any.required": "Email is required"
        })
});

const verifyOtpDTO = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            "string.empty": "Email is required",
            "string.email": "Invalid email address format",
            "any.required": "Email is required"
        }),
    otp: Joi.string()
        .trim()
        .length(6)
        .regex(/^[0-9]{6}$/)
        .required()
        .messages({
            "string.empty": "OTP is required",
            "string.length": "OTP must be exactly 6 digits",
            "string.pattern.base": "OTP must contain 6 numeric digits",
            "any.required": "OTP is required"
        })
});

module.exports = {
    sendOtpDTO,
    verifyOtpDTO
};
