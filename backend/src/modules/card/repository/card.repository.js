const Card = require('../model/card.model');

class CardRepository {
    async create(cardData) {
        return await Card.create(cardData);
    }

    async findAll(filter = {}, options = {}) {
        return await Card.find(filter)
            .sort(options.sort)
            .skip(options.skip)
            .limit(options.limit)
            .lean();
    }

    async countCards(filter = {}) {
        return await Card.countDocuments(filter);
    }

    async findById(id) {
        return await Card.findById(id).lean();
    }

    async findOne(query) {
        return await Card.findOne(query);
    }

    async update(id, updateData) {
        return await Card.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id) {
        return await Card.findByIdAndDelete(id);
    }

    async findByCategory(category) {
        return await Card.find({ category: category });
    }
}

module.exports = new CardRepository();

