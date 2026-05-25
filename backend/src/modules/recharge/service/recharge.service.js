const rechargeRepository = require("../repository/recharge.repository");

class RechargeService {
    async createService(serviceData) {
        return await rechargeRepository.createService(serviceData);
    }

    async getServices(query = {}) {
        const filter = {};
        if (query.category) filter.category = query.category;
        if (query.isActive !== undefined) filter.isActive = query.isActive;
        if (query.serviceType) filter.serviceType = query.serviceType;
        
        return await rechargeRepository.getServices(filter);
    }

    async getServiceById(id) {
        return await rechargeRepository.getServiceById(id);
    }

    async updateService(id, updateData) {
        return await rechargeRepository.updateService(id, updateData);
    }

    async initiateRecharge(userId, paymentData) {
        // Logic to communicate with 3rd party API could go here
        // For now, just recording the intent
        const paymentRecord = {
            userId,
            serviceId: paymentData.serviceId,
            amount: paymentData.amount,
            paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            status: "Pending",
            customerDetails: paymentData.customerDetails || {}
        };

        return await rechargeRepository.createPaymentRecord(paymentRecord);
    }

    async getPaymentHistory(userId, query = {}) {
        const filter = { userId };
        if (query.status) filter.status = query.status;
        if (query.serviceId) filter.serviceId = query.serviceId;

        const options = {
            limit: parseInt(query.limit) || 20,
            skip: parseInt(query.skip) || 0,
            sort: { createdAt: -1 }
        };

        const total = await rechargeRepository.countPaymentRecords(filter);
        const data = await rechargeRepository.getPaymentHistory(filter, options);

        return {
            total,
            data,
            page: Math.floor(options.skip / options.limit) + 1,
            limit: options.limit
        };
    }

    async getPaymentById(id) {
        return await rechargeRepository.getPaymentById(id);
    }

    async updatePaymentStatus(id, status, paymentDetails) {
        return await rechargeRepository.updatePaymentStatus(id, status, paymentDetails);
    }
}

module.exports = new RechargeService();

