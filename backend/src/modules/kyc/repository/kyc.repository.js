const Kyc = require("../model/kyc.model");

class KycRepository {
    async findByUserId(userId) {
        return await Kyc.findOne({ userId });
    }

    async create(data) {
        return await Kyc.create(data);
    }

    async update(userId, data) {
        return await Kyc.findOneAndUpdate(
            { userId },
            { $set: data },
            { returnDocument: 'after', upsert: true }
        );
    }

    async updateStatus(userId, status, additionalData = {}) {
        return await Kyc.findOneAndUpdate(
            { userId },
            { $set: { status, ...additionalData } },
            { returnDocument: 'after' }
        );
    }
}

module.exports = new KycRepository();
