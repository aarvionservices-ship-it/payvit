const loanRepository = require('../repository/loan.repository');
const pagination = require("../../../core/utils/pagination");
const filtering = require("../../../core/utils/filtering");
const sorting = require("../../../core/utils/sorting");

class LoanService {
    async createLoan(loanData) {
        return await loanRepository.create(loanData);
    }

    async getLoans(query) {
        const { skip, limit, page } = pagination(query);
        const filter = filtering(query);
        
        // Handle Search
        if (query.search) {
            filter.$or = [
                { loanName: { $regex: query.search, $options: "i" } },
                { bankName: { $regex: query.search, $options: "i" } },
                { provider: { $regex: query.search, $options: "i" } },
                { category: { $regex: query.search, $options: "i" } }
            ];
            delete filter.search;
        }

        // Handle Case-insensitive / Partial matches for key filters
        if (filter.category) {
            filter.category = { $regex: `^${filter.category}$`, $options: "i" };
        }
        if (filter.bankName) {
            filter.bankName = { $regex: filter.bankName, $options: "i" };
        }
        if (filter.loanType) {
            filter.loanType = { $regex: `^${filter.loanType}$`, $options: "i" };
        }

        const sort = sorting(query);

        const [data, total] = await Promise.all([
            loanRepository.findAll(filter, { skip, limit, sort }),
            loanRepository.countLoans(filter)
        ]);

        return {
            data,
            total,
            page,
            limit
        };
    }

    async getLoanById(id) {
        return await loanRepository.findById(id);
    }

    async updateLoan(id, updateData) {
        return await loanRepository.update(id, updateData);
    }

    async deleteLoan(id) {
        return await loanRepository.delete(id);
    }

    async getLoansByProvider(provider) {
        return await loanRepository.findByProvider(provider);
    }

    async getLoansByLoanType(loanType) {
        return await loanRepository.findByLoanType(loanType);
    }
}

module.exports = new LoanService();

