const express = require('express');
const router = express.Router();
const { kycDocUpload } = require('../controllers/kycControllerDocUpload');

router.post('/uploadDocs', kycDocUpload);
module.exports = router;
