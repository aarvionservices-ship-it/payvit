const cardRepository = require('../repository/card.repository');
const pagination = require("../../../core/utils/pagination");
const filtering = require("../../../core/utils/filtering");
const sorting = require("../../../core/utils/sorting");

class CardService {
    async createCard(cardData) {
        return await cardRepository.create(cardData);
    }

    async getCards(query) {
        const { skip, limit, page } = pagination(query);
        const filter = filtering(query);
        
        if (query.search) {
            filter.$or = [
                { cardName: { $regex: query.search, $options: "i" } },
                { bank: { $regex: query.search, $options: "i" } }
            ];
            delete filter.search;
        }

        if (filter.category) {
            const catRegex = { $regex: `^${filter.category}$`, $options: "i" };
            const partialCatRegex = { $regex: filter.category, $options: "i" };
            
            filter.$or = [
                { category: catRegex },
                { bestFor: partialCatRegex },
                { tags: catRegex }
            ];
            delete filter.category;
        }

        const sort = sorting(query);

        const [data, total] = await Promise.all([
            cardRepository.findAll(filter, { skip, limit, sort }),
            cardRepository.countCards(filter)
        ]);

        return {
            data,
            total,
            page,
            limit
        };
    }

    async getCardById(id) {
        return await cardRepository.findById(id);
    }

    async updateCard(id, updateData) {
        return await cardRepository.update(id, updateData);
    }

    async deleteCard(id) {
        return await cardRepository.delete(id);
    }

    async getCardsByCategory(category) {
        return await cardRepository.findByCategory(category);
    }
}

module.exports = new CardService();

