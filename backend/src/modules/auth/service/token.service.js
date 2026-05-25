const jwt = require("jsonwebtoken");
const env = require("../../../core/config/env.config");

class TokenService {

    generateAccessToken(payload) {

        return jwt.sign(payload, env.jwt.accessSecret, {
            expiresIn: env.jwt.accessExpiry,
        });

    }

    generateRefreshToken(payload) {

        return jwt.sign(payload, env.jwt.refreshSecret, {
            expiresIn: env.jwt.refreshExpiry,
        });

    }

    verifyRefreshToken(token) {

        return jwt.verify(token, env.jwt.refreshSecret);

    }

}

module.exports = new TokenService();
