const express = require('express');
const router = express.Router();
const cardController = require('../controller/card.controller');
const validate = require('../../../middlewares/validateRequest');
const createDTO = require('../dto/createCard.dto');
const updateDTO = require('../dto/updateCard.dto');

router.post('/', validate(createDTO), cardController.createCard);
router.get('/', cardController.getCards);
router.get('/:id', cardController.getCardById);
router.put('/:id', validate(updateDTO), cardController.updateCard);
router.delete('/:id', cardController.deleteCard);

module.exports = router;

