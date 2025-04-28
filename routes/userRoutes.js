const express = require("express");
const router = express.Router();

const  {verifyJWT}  = require( "../middleware/authMiddleware");


const { signup, verifyEmail, Status2FA,enable2FA, disable2FA, sendPwdOtp, resetPwd} = require("../controllers/userController");


router.post("/signUp", signup)
router.get("/verify-email", verifyEmail)
// router.post("/logIn", login);

router.get("/2FAStatus", verifyJWT, Status2FA)
router.post("/enable2FA", verifyJWT, enable2FA);
// router.post("/verify2FA");
router.delete("/disable2FA", verifyJWT, disable2FA)
router.post("/sendPwdOtp",sendPwdOtp);
router.post("/resetPwd", resetPwd);

router.post("/logOut");
// router.put("/changePwd")
// router.delete("/deleteAcct")




module.exports = router;