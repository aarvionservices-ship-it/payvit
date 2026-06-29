const User = require("../../auth/model/auth.model");

class EmployeeRepository {

    async createEmployee(data) {
        return User.create(data);
    }

    async getEmployeesWithStats(filter = {}, options = {}) {
        const skip = options.skip || 0;
        const limit = options.limit || 10;
        const sort = options.sort || { createdAt: -1 };

        return User.aggregate([
            { $match: { ...filter, role: "employee" } },
            {
                $lookup: {
                    from: "leads",
                    localField: "userId",
                    foreignField: "assignedEmployee",
                    as: "leads"
                }
            },
            {
                $addFields: {
                    leadsCount: { $size: "$leads" },
                    convertedCount: {
                        $size: {
                            $filter: {
                                input: "$leads",
                                as: "lead",
                                cond: { $eq: ["$$lead.status", "converted"] }
                            }
                        }
                    },
                    rejectedCount: {
                        $size: {
                            $filter: {
                                input: "$leads",
                                as: "lead",
                                cond: { $eq: ["$$lead.status", "rejected"] }
                            }
                        }
                    }
                }
            },
            { $project: { leads: 0 } },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit }
        ]);
    }

    async getEmployees(filter = {}, options = {}) {
        return User.find({ ...filter, role: "employee" })
            .sort(options.sort)
            .skip(options.skip)
            .limit(options.limit)
            .lean();
    }

    async countEmployees(filter = {}) {

        return User.countDocuments({ ...filter, role: "employee" });

    }

    async findById(userId) {

        return User.findOne({ userId });

    }

    async updateEmployee(userId, data) {
        return User.findOneAndUpdate({ userId }, { $set: data }, { new: true });
    }

}

module.exports = new EmployeeRepository();
