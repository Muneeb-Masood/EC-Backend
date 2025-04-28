const express = require("express");
const router = express.Router();

const  {verifyJWT}  = require( "../middleware/authMiddleware");


const { createCryptoWallet, depositCoinsToWallet, withdrawCoinsFromWallet, sendETH, conversionRate, history, walletBalance, USDAmount, transactionRequest} = require("../controllers/transactionController");

router.post("/createCryptoWallet", verifyJWT, createCryptoWallet);

router.post("/depositCoinsToWallet", verifyJWT, depositCoinsToWallet);
router.post("/withdrawCoinsFromWallet", verifyJWT, withdrawCoinsFromWallet);
router.post("/sendETH", verifyJWT, sendETH);
router.get("/conversionRate", conversionRate);
router.get("/USDAmount",verifyJWT, USDAmount);
router.get("/history", verifyJWT, history)
router.get("/walletBalance", verifyJWT, walletBalance)


module.exports = router;