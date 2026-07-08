const Lead = require("../../lead/model/lead.model");

class AdminRepository {

    async countLeads() {

        return Lead.countDocuments();

    }

    async countConverted() {

        return Lead.countDocuments({ status: "converted" });

    }

    async countByStatus() {
        return Lead.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
    }

    async getLeadsTrend(days = 7) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return Lead.aggregate([
            {
                $match: {
                    createdAt: { $gte: date }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
    }

    async getEmployeePerformance() {
        return Lead.aggregate([
            {
                $group: {
                    _id: "$assignedEmployee",
                    totalLeads: { $sum: 1 },
                    converted: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "converted"] }, 1, 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "userId",
                    as: "employee"
                }
            },
            { $unwind: "$employee" },
            {
                $project: {
                    name: "$employee.name",
                    totalLeads: 1,
                    converted: 1,
                    conversionRate: {
                        $multiply: [
                            { $divide: ["$converted", "$totalLeads"] },
                            100
                        ]
                    }
                }
            }
        ]);
    }

    async countByLoanType() {
        return Lead.aggregate([
            { $match: { status: "converted" } },
            { $group: { _id: "$loanType", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
    }
}

module.exports = new AdminRepository();
