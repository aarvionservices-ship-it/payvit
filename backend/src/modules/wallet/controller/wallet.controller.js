const walletService = require("../service/wallet.service");

class WalletController {
    async getWallet(req, res, next) {
        try {
            const userId = req.user.userId;
            const data = await walletService.getWalletDetails(userId, req.query);
            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    async addMoney(req, res, next) {
        try {
            const userId = req.user.userId;
            const amount = parseFloat(req.body.amount);
            const wallet = await walletService.addMoney(userId, amount);
            res.status(200).json({
                success: true,
                message: `Successfully loaded ₹${amount} (equivalent to ${amount} tokens) to your wallet.`,
                data: {
                    balance: wallet.balance
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async transferTokens(req, res, next) {
        try {
            const senderUserId = req.user.userId;
            const { recipient, amount, description } = req.body;
            const transferAmount = parseFloat(amount);

            const result = await walletService.transferTokens(
                senderUserId,
                recipient,
                transferAmount,
                description
            );

            res.status(200).json({
                success: true,
                message: `Successfully transferred ${transferAmount} tokens to ${result.transferredTo}.`,
                data: {
                    balance: result.balance
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async searchUser(req, res, next) {
        try {
            const query = req.query.query || req.query.q;
            const users = await walletService.searchUser(query);
            res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new WalletController();
