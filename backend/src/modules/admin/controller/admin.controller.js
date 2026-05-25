const adminService = require("../service/admin.service");
const employeeService = require("../service/employee.service");

class AdminController {

    async dashboard(req, res) {
        const data = await adminService.dashboard();
        res.json({ success: true, data });
    }

    async analytics(req, res) {
        const days = req.query.days ? parseInt(req.query.days) : 7;
        const data = await adminService.analytics(days);
        res.json({ success: true, data });
    }

    async createEmployee(req, res) {

        const employee = await employeeService.createEmployee(req.body);

        res.json({
            success: true,
            message: "Employee created",
            data: employee
        });

    }

    async getEmployees(req, res) {

        const employees = await employeeService.getEmployees(req.query);

        res.json({
            success: true,
            data: employees
        });

    }

    async getEmployeeById(req, res) {

        const employee = await employeeService.getEmployeeById(req.params.id);

        res.json({
            success: true,
            data: employee
        });

    }

    async updateEmployee(req, res) {

        const employee = await employeeService.updateEmployee(req.params.id, req.body);

        res.json({
            success: true,
            message: "Employee updated",
            data: employee
        });
    }

    async resetEmployeePassword(req, res) {
        
        await employeeService.resetPassword(req.params.id, req.body.password);

        res.json({
            success: true,
            message: "Password reset successful"
        });

    }

}

module.exports = new AdminController();
