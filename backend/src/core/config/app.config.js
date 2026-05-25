module.exports = {

    apiPrefix: "/api/v1",

    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100
    },

    pagination: {
        defaultLimit: 20,
        maxLimit: 100
    },

    security: {
        requestSizeLimit: "10kb"
    }

};