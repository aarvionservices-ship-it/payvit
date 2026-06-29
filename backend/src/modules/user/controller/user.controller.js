const userService = require("../service/user.service");

class UserController {

    async profile(req, res) {

        const user = await userService.getProfile(
            req.user.userId
        );

        res.json({
            success: true,
            data: user
        });

    }

    async updateProfile(req, res) {

        const result = await userService.updateProfile(
            req.user.userId,
            req.body
        );

        res.json({
            success: true,
            message: result.message
        });

    }

    async getUsers(req, res) {

        const users = await userService.getUsers(req.query);

        res.json({
            success: true,
            data: users
        });

    }

    async createCustomer(req, res) {

        const customer = await userService.createCustomer(
            req.body
        );

        res.json({
            success: true,
            message: "Customer created",
            data: customer
        });

    }

    async deleteUser(req, res) {

        await userService.deleteUser(
            req.params.id
        );

        res.json({
            success: true,
            message: "User deleted"
        });

    }

    async getUser(req, res) {

        const user = await userService.getProfile(
            req.params.id
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            data: user
        });

    }

}

module.exports = new UserController();
