const cardService = require('../service/card.service');

class CardController {
    async createCard(req, res) {
        try {
            const card = await cardService.createCard(req.body);
            res.status(201).json({ success: true, data: card });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getCards(req, res) {
        try {
            const data = await cardService.getCards(req.query);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getCardById(req, res) {
        try {
            const card = await cardService.getCardById(req.params.id);
            if (!card) {
                return res.status(404).json({ success: false, message: 'Card not found' });
            }
            res.status(200).json({ success: true, data: card });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateCard(req, res) {
        try {
            const card = await cardService.updateCard(req.params.id, req.body);
            if (!card) {
                return res.status(404).json({ success: false, message: 'Card not found' });
            }
            res.status(200).json({ success: true, data: card });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteCard(req, res) {
        try {
            const card = await cardService.deleteCard(req.params.id);
            if (!card) {
                return res.status(404).json({ success: false, message: 'Card not found' });
            }
            res.status(200).json({ success: true, data: {} });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new CardController();

