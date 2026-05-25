const Affiliate = require("../model/affiliate.model");

class AffiliateRepository {

    async createAffiliate(data) {
        return Affiliate.create(data);
    }

    async findById(id) {
        return Affiliate.findOne({ affiliateId: id });
    }

    async findAll() {
        return Affiliate.find();
    }

    async incrementClicks(id) {

        return Affiliate.updateOne(
            { affiliateId: id },
            { $inc: { clicks: 1 } }
        );

    }

}

module.exports = new AffiliateRepository();
