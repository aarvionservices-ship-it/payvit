const User = require("../../auth/model/auth.model");

class UserRepository {

    async createUser(data) {
        return User.create(data);
    }

    async findById(userId) {
        return User.findOne({ userId });
    }

    async findAll(filter, options) {

        return User.find(filter)
            .sort(options.sort)
            .skip(options.skip)
            .limit(options.limit)
            .lean();

    }

    async updateUser(userId, data) {

        return User.updateOne(
            { userId },
            data
        );

    }

    async softDelete(userId) {

        return User.updateOne(
            { userId },
            { deletedAt: new Date() }
        );

    }

    async countUsers(filter) {

        return User.countDocuments(filter);

    }

}

module.exports = new UserRepository();
