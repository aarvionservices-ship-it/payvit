const adminRepo = require("../repository/admin.repository");
const employeeRepo = require("../repository/employee.repository");

class AdminService {

    async dashboard() {
        const totalLeads = await adminRepo.countLeads();
        const converted = await adminRepo.countConverted();
        const statusBreakdown = await adminRepo.countByStatus();
        const totalEmployees = await employeeRepo.countEmployees();
        const loanTypeBreakdown = await adminRepo.countByLoanType();

        return {
            totalLeads,
            converted,
            statusBreakdown,
            totalEmployees,
            loanTypeBreakdown
        };
    }

    async analytics(days = 7) {
        const leadsTrend = await adminRepo.getLeadsTrend(days);
        const employeePerformance = await adminRepo.getEmployeePerformance();
        const statusBreakdown = await adminRepo.countByStatus();
        const totalLeads = await adminRepo.countLeads();
        const convertedCount = await adminRepo.countConverted();

        return {
            leadsTrend,
            employeePerformance,
            statusBreakdown,
            stats: {
                totalLeads,
                convertedCount,
                conversionRate: totalLeads > 0 ? (convertedCount / totalLeads) * 100 : 0
            }
        };
    }
}

module.exports = new AdminService();
