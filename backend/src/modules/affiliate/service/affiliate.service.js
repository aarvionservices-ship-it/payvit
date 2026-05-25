const affiliateRepo = require("../repository/affiliate.repository");
const snowflake = require("../../../core/utils/distributedId");

class AffiliateService {

    async createAffiliate(data) {

        return affiliateRepo.createAffiliate({
            affiliateId: snowflake.nextId(),
            name: data.name,
            partner: data.partner,
            loanType: data.loanType,
            redirectUrl: data.redirectUrl
        });

    }

    async getAffiliates() {

        return affiliateRepo.findAll();

    }

}

module.exports = new AffiliateService();
