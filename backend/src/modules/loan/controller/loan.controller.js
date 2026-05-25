const loanService = require('../service/loan.service');

class LoanController {
    async createLoan(req, res) {
        try {
            const loan = await loanService.createLoan(req.body);
            res.status(201).json({ success: true, data: loan });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getLoans(req, res) {
        try {
            const data = await loanService.getLoans(req.query);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getLoanById(req, res) {
        try {
            const loan = await loanService.getLoanById(req.params.id);
            if (!loan) {
                return res.status(404).json({ success: false, message: 'Loan not found' });
            }
            res.status(200).json({ success: true, data: loan });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateLoan(req, res) {
        try {
            const loan = await loanService.updateLoan(req.params.id, req.body);
            if (!loan) {
                return res.status(404).json({ success: false, message: 'Loan not found' });
            }
            res.status(200).json({ success: true, data: loan });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteLoan(req, res) {
        try {
            const loan = await loanService.deleteLoan(req.params.id);
            if (!loan) {
                return res.status(404).json({ success: false, message: 'Loan not found' });
            }
            res.status(200).json({ success: true, data: {} });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new LoanController();

