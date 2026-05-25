const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "PayVit API",
            version: "1.0.0",
        },
    },
    apis: ["./src/modules/**/*.routes.js"],
};

module.exports = swaggerJsdoc(options);
