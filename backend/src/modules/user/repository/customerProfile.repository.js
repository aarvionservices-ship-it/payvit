const CustomerProfile = require("../model/customerProfile.model");

class CustomerProfileRepository {

    async findByUserId(userId) {
        return await CustomerProfile.findOne({ userId });
    }

    async create(data) {
        return await CustomerProfile.create(data);
    }

    async update(userId, data, options = {}) {
        return await CustomerProfile.findOneAndUpdate(
            { userId },
            { $set: data },
            { returnDocument: 'after', upsert: true, ...options }
        );
    }

}

module.exports = new CustomerProfileRepository();

