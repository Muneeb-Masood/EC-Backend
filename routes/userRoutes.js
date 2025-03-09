const express = require("express");
const router = express.Router();
// const { login } = require("../controllers/userController");
const { signup } = require("../controllers/userController");


router.post("/signUp", signup);
module.exports = router;