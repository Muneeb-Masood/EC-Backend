const express = require("express");
const { login, verify2FA, adminLogin } = require("../controllers/authControllers");

const router = express.Router();

router.post("/login", login);
router.post("/verify-2fa", verify2FA);

router.post("/adminLogin", adminLogin)

module.exports = router;
