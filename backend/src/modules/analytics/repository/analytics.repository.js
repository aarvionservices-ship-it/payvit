const Lead = require("../../lead/model/lead.model");
const Affiliate = require("../../affiliate/model/affiliate.model");
const Click = require("../../affiliate/model/affiliateClick.model");

class AnalyticsRepository {

    async leadConversionRate() {

        const total = await Lead.countDocuments();
        const converted = await Lead.countDocuments({ status: "converted" });

        return {
            total,
            converted,
            rate: total ? (converted / total) * 100 : 0
        };

    }

    async leadsByStatus() {

        return Lead.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

    }

    async leadsByLoanType() {

        return Lead.aggregate([
            {
                $group: {
                    _id: "$loanType",
                    count: { $sum: 1 }
                }
            }
        ]);

    }

    async leadsByEmployee() {

        return Lead.aggregate([
            {
                $match: { assignedEmployee: { $ne: null } }
            },
            {
                $group: {
                    _id: "$assignedEmployee",
                    count: { $sum: 1 }
                }
            }
        ]);

    }

    async dailyLeadTrend() {

        return Lead.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

    }

    async affiliateCTR() {

        const affiliates = await Affiliate.find();

        const result = [];

        for (const a of affiliates) {

            const clicks = await Click.countDocuments({ affiliateId: a.affiliateId });

            result.push({
                affiliateId: a.affiliateId,
                name: a.name,
                clicks,
                conversions: a.conversions,
                ctr: clicks ? (a.conversions / clicks) * 100 : 0
            });

        }

        return result;

    }

}

module.exports = new AnalyticsRepository();
