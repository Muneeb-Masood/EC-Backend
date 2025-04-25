const db = require("../db/db");
const web3 = require("../utils/web3");
const bcrypt = require("bcrypt");
const fs = require("fs");
const contractABI = require("../constants/abi.json");
require("dotenv").config();


exports.createCryptoWallet = async (req, res, next) => {
    try {

        const newAccount = web3.eth.accounts.create();

        const userID = req.User.userID;

        const query = 'INSERT INTO Wallets (userID, walletAddress, hashedPrivateKey) VALUES (?, ?, ?)';
        const values = [userID, newAccount.address, newAccount.privateKey]

        const result = await db.query(query, values);
        
        return res.json({
            message: "Wallet created successfully!",
            address: newAccount.address,
            privateKey: newAccount.privateKey
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



exports.walletBalance = async (req, res, next) => {
    try {
        const userID = req.User.userID;

        const query = 'SELECT walletAddress FROM Wallets WHERE userID = ?';
        const values = [userID]
        const result = await db.query(query, values);
        
        const walletAddress = result[0][0].walletAddress;

        
        let balanceWei = await web3.eth.getBalance(walletAddress); 
        console.log(balanceWei)
        let balanceEth = web3.utils.fromWei(balanceWei, "ether"); 



        return res.json({
                message: "Successfully fetched the coins for the wallet",
                balance: balanceEth
        });
        

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



exports.sendETH = async (req, res, next) => {
    try {
        const senderID = req.User.userID;
        const { recieverWalletAddress, amountInETH, initiationTimestamp } = req.body;

        let query = 'SELECT * FROM Wallets WHERE userID = ? ';
        let values = [senderID];
        let result = await db.query(query, values);

        const senderWalletAddress = result[0][0].walletAddress;
        const senderPrivateKey = result[0][0].privateKey;


        //Call the ML Server here
            let severity = 95; // Assuming the ML server returns a severity score
            let fruadType = 'ABC' // Assuming the ML server return a fraud type
            let status = 'failed' // Assuming the ML server return a status (failed/pending)
        //


        let sourceLoginId = await db.query("SELECT loginID FROM LoginHistory WHERE userID = ? ORDER BY loginTime DESC", [senderID]);
        sourceLoginId = sourceLoginId[0][0].loginID;
        console.log(sourceLoginId)


        let recieverID = await db.query('SELECT userID FROM Wallets WHERE walletAddress = ?', [recieverWalletAddress]);
        recieverID = recieverID[0][0].userID
        let destinationLoginId = await db.query("SELECT loginID FROM LoginHistory WHERE userID = ? ORDER BY loginTime DESC", [recieverID]);
        if (destinationLoginId.length === 0) {
            destinationLoginId = null;
        } else {
            destinationLoginId = destinationLoginId[0].loginID;
        }


        if (severity >= 90) {
            query = 'INSERT INTO Transactions (type, amount, currency, sourceLoginId, destinationLoginId, sourceWalletAddress, destinationWalletAddress, status, initiationTimestamp, severity, fraudType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            values = ['transfer', amountInETH, 'ETH', sourceLoginId, destinationLoginId, senderWalletAddress, recieverWalletAddress, status, initiationTimestamp, severity, fruadType];
            result = await db.query(query, values);

            return res.json({
                message: "Transaction unsuccessful"
            });
        }


        query = 'INSERT INTO Transactions (type, amount, currency, sourceLoginId, destinationLoginId, sourceWalletAddress, destinationWalletAddress, status, initiationTimestamp, completionTimestamp, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        values = ['transfer', amountInETH, 'ETH', sourceLoginId, destinationLoginId, senderWalletAddress, recieverWalletAddress, 'completed', initiationTimestamp, Date.now(), severity ];


        const contract = new web3.eth.Contract(contractABI, process.env.BLOCKCHAIN_CONTRACT_ADDRESS);

        const amountInWei = web3.utils.toWei(amountInETH, "ether");
        const gasPrice = await web3.eth.getGasPrice();  
        const estimatedGas = await contract.methods.transferETH(recieverWalletAddress).estimateGas({
            from: senderWalletAddress,
            value: amountInWei
        });

        const tx = {
            from: senderWalletAddress,
            to: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
            gas: estimatedGas, 
            gasPrice: gasPrice,
            value: amountInWei,
            data: contract.methods.transferETH(recieverWalletAddress).encodeABI()
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, senderPrivateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log("Transaction successful! Hash:", receipt.transactionHash);


        result = await db.query(query, values);

        return res.json({
                message: "Transaction Successfull",
                TxHash: receipt.transactionHash
        });
        

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



exports.conversionRate = async (req, res, next) => {
    try {
        const contract = new web3.eth.Contract(contractABI, process.env.BLOCKCHAIN_CONTRACT_ADDRESS);
        const rate = await contract.methods.USD_TO_ETH_RATE().call();

        console.log(rate)

        return res.json({
                message: "Transaction Successfull",
                rate: rate.toString()
        });
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



exports.depositCoinsToWallet = async (req, res, next) => {
    try {
        const recieverID = req.User.userID;
        const { usdAmount, initiationTimestamp } = req.body;

        let query = 'SELECT * FROM Wallets WHERE userID = ? ';
        let values = [recieverID];
        let result = await db.query(query, values);

        const recieverWalletAddress = result[0][0].walletAddress;
        const recieverPrivateKey = result[0][0].privateKey;

        //Call the ML Server here
            let severity = 50; // Assuming the ML server returns a severity score
            let fruadType = 'ABC' // Assuming the ML server return a fraud type
            let status = 'failed' // Assuming the ML server return a status (failed/pending)
        //

        let destinationLoginId = await db.query("SELECT loginID FROM LoginHistory WHERE userID = ? ORDER BY loginTime DESC", [recieverID]);
        destinationLoginId = destinationLoginId[0][0].loginID;

        let sourceLoginId = null;

        if (severity >= 90) {
            query = 'INSERT INTO Transactions (type, amount, currency, sourceLoginId, destinationLoginId, sourceWalletAddress, destinationWalletAddress, status, initiationTimestamp, severity, fraudType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            values = ['deposit', usdAmount, 'USD', sourceLoginId, destinationLoginId, process.env.BLOCKCHAIN_CONTRACT_ADDRESS, recieverWalletAddress, status, initiationTimestamp, severity, fruadType];
            result = await db.query(query, values);

            return res.json({
                message: "Transaction unsuccessful"
            });
        }

        query = 'INSERT INTO Transactions (type, amount, currency, sourceLoginId, destinationLoginId, sourceWalletAddress, destinationWalletAddress, status, initiationTimestamp, completionTimestamp, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        values = ['deposit', usdAmount, 'USD', sourceLoginId, destinationLoginId, process.env.BLOCKCHAIN_CONTRACT_ADDRESS, recieverWalletAddress, 'completed', initiationTimestamp, Date.now(), severity ];



        const contract = new web3.eth.Contract(contractABI, process.env.BLOCKCHAIN_CONTRACT_ADDRESS);

        const gasPrice = await web3.eth.getGasPrice();  
        const estimatedGas = await contract.methods.DepositETH(usdAmount).estimateGas({
            from: recieverWalletAddress,
        });

        const tx = {
            from: recieverWalletAddress,
            to:  process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
            gas: estimatedGas, 
            gasPrice: gasPrice,
            data: contract.methods.DepositETH(usdAmount).encodeABI()
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, recieverPrivateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);


        result = await db.query(query, values);

        return res.json({
                message: "Transaction Successfull",
                TxHash: receipt.transactionHash
        });
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



exports.USDAmount = async (req, res, next) => {
    try {
        const userID = req.User.userID;
        
        const contract = new web3.eth.Contract(contractABI, process.env.BLOCKCHAIN_CONTRACT_ADDRESS);

        const rate = await contract.methods.USD_TO_ETH_RATE().call();

        const query = 'SELECT walletAddress FROM Wallets WHERE userID = ?';
        const values = [userID]
        const result = await db.query(query, values);
        const walletAddress = result[0][0].walletAddress;
        
        let balanceWei = await web3.eth.getBalance(walletAddress); 
        let balanceEth = web3.utils.fromWei(balanceWei, "ether"); 

        const balanceInUSD = balanceEth * rate.toString();

        return res.json({
                message: "Transaction Successfull",
                USDBalance: balanceInUSD.toString()
        });
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



exports.history = async (req, res, next) => {
    try {
        const userID = req.User.userID;

        let query = 'SELECT * FROM Wallets WHERE userID = ? ';
        let values = [userID];
        let result = await db.query(query, values);

        const userWalletAddress = result[0][0].walletAddress;

        query = 'SELECT * FROM Transactions WHERE sourceWalletAddress = ? OR destinationWalletAddress = ? ';
        values = [userWalletAddress, userWalletAddress];
        result = await db.query(query, values);

        return res.json({
            message: "History fetched successfully",
            data: result[0]
        });
        
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};