const express = require('express');
const router = express.Router(); // Fix typo (Router should be capitalized)
const { kycDocUpload } = require('../controllers/kycControllerDocUpload');
const {selfieUpload} = require('../controllers/kycControllerSelfieUpload');
// const {idCardUpload} = require('D:\EC-6th-Semster\EC-Backend\controllers\kycControllerIdCardUpload.js');

router.post('/uploadDocs', kycDocUpload);
// router.post('/uploadIDCard',idCardUpload);
router.post('/uploadSelfie',selfieUpload);

module.exports = router;
