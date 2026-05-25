const Loan = require('../model/loan.model');

class LoanRepository {
    async create(loanData) {
        return await Loan.create(loanData);
    }

    async findAll(filter = {}, options = {}) {
        return await Loan.find(filter)
            .sort(options.sort)
            .skip(options.skip)
            .limit(options.limit)
            .lean();
    }

    async countLoans(filter = {}) {
        return await Loan.countDocuments(filter);
    }

    async findById(id) {
        return await Loan.findById(id).lean();
    }

    async findOne(query) {
        return await Loan.findOne(query);
    }

    async update(id, updateData) {
        return await Loan.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id) {
        return await Loan.findByIdAndDelete(id);
    }

    async findByProvider(provider) {
        return await Loan.find({ provider: provider });
    }

    async findByLoanType(loanType) {
        return await Loan.find({ loanType: loanType });
    }
}

module.exports = new LoanRepository();

