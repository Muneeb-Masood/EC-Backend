const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');



router.get('/all', adminController.getAllTransactions);
// router.get('/blocked', adminController.getBlockedTransactions);
router.get('/:transactionID', adminController.getTransactionById);
// router.put('/approve/:transactionID', adminController.approveTransaction);

module.exports = router;
