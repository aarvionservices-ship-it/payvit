const Joi = require("joi");

module.exports = Joi.object({

    name: Joi.string().required(),

    partner: Joi.string().required(),

    loanType: Joi.string().valid(
        "personal",
        "business",
        "home"
    ),

    redirectUrl: Joi.string().uri().required()

});
