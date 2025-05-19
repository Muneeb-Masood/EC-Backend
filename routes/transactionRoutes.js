const express = require("express");
const router = express.Router();

const  {verifyJWT}  = require( "../middleware/authMiddleware");
const  {verifyAdminToken}  = require( "../middleware/adminAuthMiddleware");

const {getBlockedTransactions} = require('../controllers/adminController');
// const adminController = require('../controllers/adminController');

const { createCryptoWallet, depositCoinsToWallet, withdrawCoinsFromWallet, sendETH, conversionRate, history, walletBalance, USDAmount, transactionRequest, approveTransaction, getWalletAddress, getLog} = require("../controllers/transactionController");

const {transferConfirmation} = require("../controllers/confirmationController");
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
router.post("/getLog", verifyAdminToken, getLog);

router.post('/sendConfirmation', transferConfirmation);
;
// router.get('/blockedTransactions', verifyAdminToken);



module.exports = router;