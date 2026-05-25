const RechargeService = require("../model/rechargeService.model");
const RechargeHistory = require("../model/rechargeHistory.model");

class RechargeRepository {
    async createService(serviceData) {
        return await RechargeService.create(serviceData);
    }

    async getServices(filter = {}) {
        return await RechargeService.find(filter).lean();
    }

    async getServiceById(id) {
        return await RechargeService.findById(id).lean();
    }

    async updateService(id, updateData) {
        return await RechargeService.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }

    async deleteService(id) {
        return await RechargeService.findByIdAndDelete(id);
    }

    async createPaymentRecord(paymentData) {
        return await RechargeHistory.create(paymentData);
    }

    async getPaymentHistory(filter = {}, options = {}) {
        return await RechargeHistory.find(filter)
            .populate("serviceId", "name category providerName")
            .sort(options.sort || { createdAt: -1 })
            .skip(options.skip || 0)
            .limit(options.limit || 20)
            .lean();
    }

    async countPaymentRecords(filter = {}) {
        return await RechargeHistory.countDocuments(filter);
    }

    async getPaymentById(id) {
        return await RechargeHistory.findById(id).populate("serviceId").lean();
    }

    async updatePaymentStatus(id, status, paymentDetails = {}) {
        return await RechargeHistory.findByIdAndUpdate(id, { 
            status, 
            paymentDetails 
        }, { new: true }).lean();
    }
}

module.exports = new RechargeRepository();

