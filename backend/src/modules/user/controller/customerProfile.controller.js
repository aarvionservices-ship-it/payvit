const customerProfileService = require("../service/customerProfile.service");

class CustomerProfileController {

    async getProfile(req, res) {
        try {
            const profile = await customerProfileService.getProfile(req.user.userId);
            res.json({ success: true, data: profile });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateProfile(req, res) {
        try {
            const profile = await customerProfileService.updateProfile(req.user.userId, req.body);
            res.json({ success: true, data: profile });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async saveStep(req, res) {
        try {
            const profile = await customerProfileService.saveStep(req.user.userId, req.body);
            res.json({ success: true, data: profile });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

}

module.exports = new CustomerProfileController();

