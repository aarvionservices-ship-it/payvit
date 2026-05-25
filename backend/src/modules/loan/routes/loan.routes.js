const express = require('express');
const router = express.Router();
const loanController = require('../controller/loan.controller');
const validate = require('../../../middlewares/validateRequest');
const createDTO = require('../dto/createLoan.dto');
const updateDTO = require('../dto/updateLoan.dto');

router.post('/', validate(createDTO), loanController.createLoan);
router.get('/', loanController.getLoans);
router.get('/:id', loanController.getLoanById);
router.put('/:id', validate(updateDTO), loanController.updateLoan);
router.delete('/:id', loanController.deleteLoan);

module.exports = router;

