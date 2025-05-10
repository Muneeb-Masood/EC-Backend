const express = require("express");
const router = express.Router();

const  {verifyAdminToken}  = require( "../middleware/adminAuthMiddleware");

const { clusterInfo} = require("../controllers/clusterController");


router.get("/clusterInfo", verifyAdminToken, clusterInfo);

module.exports = router;