const express = require("express");
const router = express.Router();

const  {verifyJWT}  = require( "../middleware/authMiddleware");
const  {verifyAdminToken}  = require( "../middleware/adminAuthMiddleware");

const {getBlockedTransactions} = require('../controllers/adminController');
// const adminController = require('../controllers/adminController');

const { createCryptoWallet, depositCoinsToWallet, withdrawCoinsFromWallet, sendETH, conversionRate, history, walletBalance, USDAmount, transactionRequest, approveTransaction, getWalletAddress} = require("../controllers/transactionController");

router.post("/createCryptoWallet", verifyJWT, createCryptoWallet);

router.post("/depositCoinsToWallet", verifyJWT, depositCoinsToWallet);
router.post("/withdrawCoinsFromWallet", verifyJWT, withdrawCoinsFromWallet);
router.post("/sendETH", verifyJWT, sendETH);
router.get("/conversionRate", conversionRate);
router.get("/USDAmount",verifyJWT, USDAmount);
router.get("/history", verifyJWT, history)
router.get("/walletBalance", verifyJWT, walletBalance)
router.get("/WalletAddress", verifyJWT, getWalletAddress);


router.get("/blockedTransactions", verifyAdminToken, getBlockedTransactions)
router.post("/approveTransaction", verifyAdminToken, approveTransaction);
// router.get('/blockedTransactions', verifyAdminToken);

module.exports = router;