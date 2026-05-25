const Joi = require("joi");

module.exports = Joi.object({

    name: Joi.string(),

    email: Joi.string().email(),

    password: Joi.string().min(8),

    phone: Joi.string()
        .min(10)
        .max(10),

    isActive: Joi.boolean(),

});

