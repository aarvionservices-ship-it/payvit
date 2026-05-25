const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        // Just proceed without user if token is invalid for optional endpoints
        next();
    }

};

