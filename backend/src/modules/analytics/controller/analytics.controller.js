const analyticsService = require("../service/analytics.service");

class AnalyticsController {

    async dashboard(req, res) {

        const data = await analyticsService.dashboard();

        res.json({
            success: true,
            data
        });

    }

    async trends(req, res) {

        const data = await analyticsService.trends();

        res.json({
            success: true,
            data
        });

    }

    async affiliates(req, res) {

        const data = await analyticsService.affiliateStats();

        res.json({
            success: true,
            data
        });

    }

}

module.exports = new AnalyticsController();
