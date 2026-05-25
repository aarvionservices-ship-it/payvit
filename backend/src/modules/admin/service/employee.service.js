const argon2 = require("argon2");
const employeeRepo = require("../repository/employee.repository");
const snowflake = require("../../../core/utils/distributedId");
const pagination = require("../../../core/utils/pagination");
const filtering = require("../../../core/utils/filtering");
const sorting = require("../../../core/utils/sorting");

class EmployeeService {

    async createEmployee(data) {

        const hashedPassword = await argon2.hash(data.password);

        return employeeRepo.createEmployee({

            userId: snowflake.nextId(),

            name: data.name,
            phone: data.phone,
            email: data.email,
            password: hashedPassword,
            role: "employee"

        });

    }

    async getEmployees(query) {
        const { skip, limit, page } = pagination(query);
        const filter = filtering(query);

        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: "i" } },
                { email: { $regex: query.search, $options: "i" } },
                { phone: { $regex: query.search, $options: "i" } }
            ];
            delete filter.search;
        }

        let dbFilter = { role: query.role || "employee" };
        if (query.isActive === 'true') dbFilter.isActive = true;
        else if (query.isActive === 'false') dbFilter.isActive = false;

        if (filter.$or) dbFilter.$or = filter.$or;

        const sort = sorting(query);

        let data = await employeeRepo.getEmployeesWithStats(dbFilter, { skip, limit, sort });
        const total = await employeeRepo.countEmployees(dbFilter);

        // Apply programmatic filtering for leads status if needed
        if (query.hasLeads === 'none') {
            data = data.filter(emp => emp.leadsCount === 0);
        } else if (query.hasLeads === 'active') {
            data = data.filter(emp => emp.leadsCount > 0);
        }

        const processedData = data.map(userObj => {
            if (userObj.profileImage && userObj.profileImage.data) {
                userObj.profileImage = `data:${userObj.profileImage.contentType};base64,${Buffer.from(userObj.profileImage.data.buffer || userObj.profileImage.data).toString("base64")}`;
            } else {
                userObj.profileImage = null;
            }
            delete userObj.password;
            return userObj;
        });

        return {
            data: processedData,
            total,
            page,
            limit
        };
    }

    async getEmployeeById(userId) {
        let emp = await employeeRepo.findById(userId);
        if (emp) {
            emp = emp.toJSON ? emp.toJSON() : emp;
            if (emp.profileImage && emp.profileImage.data) {
                emp.profileImage = `data:${emp.profileImage.contentType};base64,${Buffer.from(emp.profileImage.data).toString("base64")}`;
            } else {
                emp.profileImage = null;
            }
            delete emp.password;
        }
        return emp;
    }

    async updateEmployee(userId, data) {
        if (data.profileImage) {
            const matches = data.profileImage.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                data.profileImage = {
                    contentType: matches[1],
                    data: Buffer.from(matches[2], "base64")
                };
            } else {
                delete data.profileImage;
            }
        } else if (data.profileImage === "" || data.profileImage === null) {
            data.profileImage = null;
        }

        if (data.password) {
            data.password = await argon2.hash(data.password);
        }

        const emp = await employeeRepo.updateEmployee(userId, data);
        let userObj = emp.toJSON ? emp.toJSON() : emp;
        if (userObj.profileImage && userObj.profileImage.data) {
            userObj.profileImage = `data:${userObj.profileImage.contentType};base64,${Buffer.from(userObj.profileImage.data).toString("base64")}`;
        } else {
            userObj.profileImage = null;
        }
        delete userObj.password;
        return userObj;
    }
    async resetPassword(userId, newPassword) {
        const hashedPassword = await argon2.hash(newPassword);
        return employeeRepo.updateEmployee(userId, { password: hashedPassword });
    }

}

module.exports = new EmployeeService();
