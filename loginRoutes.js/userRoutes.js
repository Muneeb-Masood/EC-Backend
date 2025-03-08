const express = require("express");
const router = express.Router();
// const { login } = require("../controllers/userController");
const { signup } = require("../controllers/userController");


router.post("/signUp", signup)
// router.post("/logIn", login);
// router.post("/enable2FA")
// router.post("/verify2FA")
// router.delete("/disable2FA")
// router.post("/sendPwdOtp");
// router.post("/resetPwd")

// router.post("/logOut")
// router.put("/changePwd")
// router.delete("/deleteAcct")

module.exports = router;