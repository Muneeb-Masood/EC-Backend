const express = require('express');
const router = express.Router();
const { transactions } = require('../controllers/kycControllerDocUpload');

router.post('/uploadDocs', transactions);
module.exports = router;
