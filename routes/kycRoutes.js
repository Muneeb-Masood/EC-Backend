const express = require('express');
const router = express.Router(); // Fix typo (Router is capitalized)
const { kycDocUpload } = require('../controllers/kycController'); // Use require()

router.post('/doc-upload', kycDocUpload);

module.exports = router; // Use module.exports instead of export default
