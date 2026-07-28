const BankAccount = require("../model/bankAccount.model");

class BankAccountRepository {

    async create(data) {
        const { encrypted, masked } = BankAccount.encryptAccountNumber(data.accountNumber);

        const account = new BankAccount({
            userId: data.userId,
            accountHolderName: data.accountHolderName,
            accountNumberEncrypted: encrypted,
            accountNumberMasked: masked,
            ifscCode: data.ifscCode,
            bankName: data.bankName,
            bankBranch: data.bankBranch || "",
            accountType: data.accountType || "savings"
        });

        return await account.save();
    }

    async findByUser(userId) {
        const accounts = await BankAccount.find({ userId, isActive: true }).lean();
        // Strip encrypted field from results
        return accounts.map(({ accountNumberEncrypted, ...safe }) => safe);
    }

    async findById(id) {
        return await BankAccount.findById(id);
    }

    async findByIdAndUser(id, userId) {
        return await BankAccount.findOne({ _id: id, userId, isActive: true });
    }

    async softDelete(id, userId) {
        return await BankAccount.findOneAndUpdate(
            { _id: id, userId },
            { $set: { isActive: false, isPrimary: false } },
            { returnDocument: 'after' }
        );
    }

    async setPrimary(id, userId) {
        // Unset all primary for this user first
        await BankAccount.updateMany(
            { userId },
            { $set: { isPrimary: false } }
        );
        return await BankAccount.findOneAndUpdate(
            { _id: id, userId },
            { $set: { isPrimary: true } },
            { returnDocument: 'after' }
        );
    }

    async countByUser(userId) {
        return await BankAccount.countDocuments({ userId, isActive: true });
    }

    async setVerified(id) {
        return await BankAccount.findByIdAndUpdate(
            id,
            { $set: { isVerified: true } },
            { returnDocument: 'after' }
        );
    }

}

module.exports = new BankAccountRepository();
