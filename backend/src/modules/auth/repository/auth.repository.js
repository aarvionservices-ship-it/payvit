const User = require("../model/auth.model");

class AuthRepository {

    async createUser(data) {
        return User.create(data);
    }

    async findByEmail(email) {
        return User.findOne({ email });
    }

    async findById(id) {
        return User.findOne({ userId: id });
    }

    async updateRefreshToken(userId, refreshToken) {
        return User.updateOne(
            { userId },
            { refreshToken }
        );
    }
    async incrementLoginAttempts(userId) {

        return User.updateOne(
            { userId },
            { $inc: { loginAttempts: 1 } }
        );

    }

    async lockAccount(userId, lockUntil) {

        return User.updateOne(
            { userId },
            { lockUntil }
        );

    }

    async resetLoginAttempts(userId) {

        return User.updateOne(
            { userId },
            { loginAttempts: 0, lockUntil: null }
        );
    }

    async update(userId, data) {
        return User.findOneAndUpdate(
            { userId },
            { $set: data },
            { new: true }
        );
    }


}

module.exports = new AuthRepository();
