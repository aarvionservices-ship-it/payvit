const affiliateService = require("../service/affiliate.service");
const redirectService = require("../service/redirect.service");

class AffiliateController {

    async createAffiliate(req, res) {

        const affiliate = await affiliateService.createAffiliate(req.body);

        res.json({
            success: true,
            data: affiliate
        });

    }

    async getAffiliates(req, res) {

        const affiliates = await affiliateService.getAffiliates();

        res.json({
            success: true,
            data: affiliates
        });

    }

    async redirect(req, res) {

        const url = await redirectService.handleRedirect(
            req.params.id,
            req
        );

        res.redirect(url);

    }

}

module.exports = new AffiliateController();
