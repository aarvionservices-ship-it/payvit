const affiliateRepo = require("../repository/affiliate.repository");
const clickRepo = require("../repository/click.repository");

const leadService = require("../../lead/service/lead.service");

class RedirectService {

    async handleRedirect(affiliateId, req) {

        const affiliate = await affiliateRepo.findById(affiliateId);

        if (!affiliate) throw new Error("Affiliate not found");

        await affiliateRepo.incrementClicks(affiliateId);

        const lead = await leadService.createLead({

            customerName: req.query.name,
            phone: req.query.phone,
            email: req.query.email,
            loanType: affiliate.loanType,
            source: "affiliate",
            affiliateId: affiliateId

        });

        await clickRepo.createClick({

            affiliateId,
            leadId: lead.leadId,
            ip: req.ip,
            userAgent: req.headers["user-agent"]

        });

        return affiliate.redirectUrl;

    }

}

module.exports = new RedirectService();
