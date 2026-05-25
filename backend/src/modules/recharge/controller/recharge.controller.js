const rechargeService = require("../service/recharge.service");

class RechargeController {
    async createService(req, res) {
        try {
            const service = await rechargeService.createService(req.body);
            res.status(201).json({ success: true, data: service });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getServices(req, res) {
        try {
            const services = await rechargeService.getServices(req.query);
            res.status(200).json({ success: true, data: services });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getServiceById(req, res) {
        try {
            const service = await rechargeService.getServiceById(req.params.id);
            if (!service) {
                return res.status(404).json({ success: false, message: 'Recharge service not found' });
            }
            res.status(200).json({ success: true, data: service });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateService(req, res) {
        try {
            const service = await rechargeService.updateService(req.params.id, req.body);
            if (!service) {
                return res.status(404).json({ success: false, message: 'Recharge service not found' });
            }
            res.status(200).json({ success: true, data: service });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async initiateRecharge(req, res) {
        try {
            const userId = req.user.id;
            const payment = await rechargeService.initiateRecharge(userId, req.body);
            res.status(201).json({ success: true, data: payment });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getPaymentHistory(req, res) {
        try {
            const userId = req.user.id;
            const data = await rechargeService.getPaymentHistory(userId, req.query);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getPaymentById(req, res) {
        try {
            const payment = await rechargeService.getPaymentById(req.params.id);
            if (!payment) {
                return res.status(404).json({ success: false, message: 'Payment record not found' });
            }
            res.status(200).json({ success: true, data: payment });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updatePaymentStatus(req, res) {
        try {
            const { status, paymentDetails } = req.body;
            const payment = await rechargeService.updatePaymentStatus(req.params.id, status, paymentDetails);
            if (!payment) {
                return res.status(404).json({ success: false, message: 'Payment record not found' });
            }
            res.status(200).json({ success: true, data: payment });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new RechargeController();

