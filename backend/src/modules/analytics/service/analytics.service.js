const analyticsRepo = require("../repository/analytics.repository");

class AnalyticsService {

    async dashboard() {

        const conversion = await analyticsRepo.leadConversionRate();

        const leadStatus = await analyticsRepo.leadsByStatus();

        const loanTypes = await analyticsRepo.leadsByLoanType();

        const employeePerformance =
            await analyticsRepo.leadsByEmployee();

        return {
            conversion,
            leadStatus,
            loanTypes,
            employeePerformance
        };

    }

    async trends() {

        return analyticsRepo.dailyLeadTrend();

    }

    async affiliateStats() {

        return analyticsRepo.affiliateCTR();

    }

}

module.exports = new AnalyticsService();
