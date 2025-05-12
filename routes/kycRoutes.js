const express = require('express');
const router = express.Router();
const { kycDocUpload } = require('../controllers/kycControllerDocUpload');
const  {verifyJWT}  = require( "../middleware/authMiddleware");


router.post('/uploadDocs', verifyJWT, kycDocUpload);

module.exports = router;