const CustomerProfile = require("../model/customerProfile.model");

class CustomerProfileRepository {

    async findByUserId(userId) {
        return await CustomerProfile.findOne({ userId });
    }

    async create(data) {
        return await CustomerProfile.create(data);
    }

    async update(userId, data) {
        return await CustomerProfile.findOneAndUpdate(
            { userId },
            { $set: data },
            { new: true, upsert: true }
        );
    }

}

module.exports = new CustomerProfileRepository();

