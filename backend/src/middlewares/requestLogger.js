const winston = require("winston");

const logger = winston.createLogger({
    level: "info",
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logs/app.log" })
    ]
});

module.exports = (req, res, next) => {

    logger.info({
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
        timestamp: new Date()
    });

    next();
};
