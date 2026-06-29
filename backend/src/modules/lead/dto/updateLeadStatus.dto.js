const Joi = require("joi");

module.exports = Joi.object({

    status: Joi.string().required(),

    followUpDate: Joi.date(),
    
    note: Joi.string().allow("").optional(),

    customerId: Joi.string().optional()

});
