const Joi = require("joi");

module.exports = Joi.object({

    name: Joi.string().required(),

    email: Joi.string().email().required(),

    password: Joi.string().min(8).required(),

    phone: Joi.string()
        .min(10)
        .max(10)
        .required(),

    isActive: Joi.boolean().optional(),

});
