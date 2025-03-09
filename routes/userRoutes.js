const express = require("express");
const router = express.Router();
const { signup } = require("../controllers/userController");


router.post("/signUp", signup);
module.exports = router;