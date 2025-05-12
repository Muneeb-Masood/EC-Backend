const db = require("../db/db");
const { VERIFICATION_STATUS } = require("../constants/status_enums.js");
// const axios = require('axios');
const web3 = require("../utils/web3");
require("dotenv").config();

exports.approveKyc = async (req, res) => {
    const { kycID } = req.body;

    if (kycID === undefined || kycID === null || isNaN(Number(kycID))) {
        return res.status(400).json({ message: "Invalid or missing kycID" });
    }

    try {
        let [result] = await db.query(
            "UPDATE kyc SET verificationStatus = ?, completedDate = NOW() WHERE kycID = ?",
            [VERIFICATION_STATUS.VERIFIED, kycID]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "KYC record not found" });
        }

        const userID = await db.query('Select userID from kyc where kycID = ?', [kycID])

        const newAccount = web3.eth.accounts.create();

        const query = 'INSERT INTO Wallets (userID, walletAddress, privateKey) VALUES (?, ?, ?)';
        const values = [userID[0][0].userID, newAccount.address, newAccount.privateKey]
        result = await db.query(query, values);

        await web3.eth.sendTransaction({
            from: process.env.FAUCET_ACCOUNT,
            to: newAccount.address,
            value: web3.utils.toWei('0.1', 'ether'),
            gas: 21000
          });
          
        return res.json({
            message: "KYC Approved. Wallet created successfully!",
            address: newAccount.address,
            privateKey: newAccount.privateKey
        });
    } catch (error) {
        console.error("Error approving KYC:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.rejectKyc = async (req, res) => {
    const { kycID, rejectionReason } = req.body;

    try {
        await db.query(
            "UPDATE kyc SET verificationStatus = ?, rejectionReason = ? WHERE kycID = ?",
            [VERIFICATION_STATUS.REJECTED, rejectionReason, kycID]
        );

        res.status(200).json({ message: "KYC Rejected Successfully" });
    } catch (error) {
        console.error("Error rejecting KYC:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.getKycRecords = async (req, res) => {
    let query = "SELECT * FROM kyc";
    let values = [];

    try {
        const [results] = await db.query(query, values);

        let { status } = req.query;
        if (status) {
            if (
                !Object.values(VERIFICATION_STATUS)
                    .map((e) => e.toLowerCase())
                    .includes(status)
            ) {
                return res
                    .status(400)
                    .json({ message: "Invalid status provided" });
            }
            results = results.filter(
                (record) => record.verificationStatus.toLowerCase() === status
            );
        }
        res.status(200).json({ kycRequests: results });
    } catch (error) {
        console.error("Error fetching KYC requests:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
