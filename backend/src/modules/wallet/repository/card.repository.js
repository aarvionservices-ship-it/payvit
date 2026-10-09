const Card = require("../model/card.model");
const snowflake = require("../../../core/utils/distributedId");

class CardRepository {

    async create(data) {
        const cardNumber = data.cardNumber || "4000000000000000";
        const { encrypted, masked } = Card.encryptCardNumber(cardNumber);
        const cardId = data.cardId || snowflake.nextId();

        const card = new Card({
            cardId,
            userId: data.userId,
            walletId: data.walletId || null,
            provider: data.provider || "Visa",
            holderName: data.holderName || data.accountName || "Card Holder",
            cardNumberEncrypted: encrypted,
            maskedCardNumber: data.maskedCardNumber || data.maskedNumber || masked,
            expiry: data.expiry || "12/28",
            status: data.status || "VERIFIED",
            isPrimary: data.isPrimary || false
        });

        return await card.save();
    }

    async findByUser(userId) {
        return await Card.find({ userId, isActive: true })
            .sort({ createdAt: -1 })
            .lean();
    }

    async findByIdAndUser(cardId, userId) {
        return await Card.findOne({
            $or: [{ cardId }, { _id: cardId }],
            userId,
            isActive: true
        });
    }

    async softDelete(cardId, userId) {
        return await Card.findOneAndUpdate(
            {
                $or: [{ cardId }, { _id: cardId }],
                userId,
                isActive: true
            },
            { $set: { isActive: false } },
            { returnDocument: "after" }
        );
    }

    async setPrimary(cardId, userId) {
        await Card.updateMany({ userId }, { $set: { isPrimary: false } });
        return await Card.findOneAndUpdate(
            {
                $or: [{ cardId }, { _id: cardId }],
                userId,
                isActive: true
            },
            { $set: { isPrimary: true } },
            { returnDocument: "after" }
        );
    }

    async countByUser(userId) {
        return await Card.countDocuments({ userId, isActive: true });
    }
}

module.exports = new CardRepository();
