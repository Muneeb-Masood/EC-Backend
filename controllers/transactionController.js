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

        let status = "pending";

        //-------------------------------------
        let sourceLoginId = await db.query("SELECT loginID FROM LoginHistory WHERE userID = ? ORDER BY loginTime DESC", [senderID]);
        sourceLoginId = sourceLoginId[0][0].loginID;

        let recieverID = await db.query('SELECT userID FROM Wallets WHERE walletAddress = ?', [recieverWalletAddress]);
        recieverID = recieverID[0][0].userID
        let destinationLoginId = await db.query("SELECT loginID FROM LoginHistory WHERE userID = ? ORDER BY loginTime DESC", [recieverID]);
        if (destinationLoginId.length === 0) {
            destinationLoginId = null;
        } else {
            destinationLoginId = destinationLoginId[0][0].loginID;
        }

        // STORING TRANSACTION DATA IN THE DATABASE AND RETRIEVING OTHER DATA FOR ML SERVER

        query = 'INSERT INTO Transactions (type, amount, currency, sourceLoginId, destinationLoginId, sourceWalletAddress, destinationWalletAddress, status, initiationTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        values = ['transfer', amountInETH, 'ETH', sourceLoginId, destinationLoginId, senderWalletAddress, recieverWalletAddress, status , initiationTimestamp];
        let storingTransactionResult = await db.query(query, values);


       // CALCULATING DATA FOR ML SERVER
        let Avg_min_between_sent_tnx =  await db.query ('SELECT IFNULL(AVG((initiationTimestamp - prevTimestamp) / 60), 0) AS avg_time_difference_in_minutes FROM (SELECT initiationTimestamp, LAG(initiationTimestamp) OVER (ORDER BY initiationTimestamp) AS prevTimestamp FROM transactions WHERE type = ? AND sourceWalletAddress = ? AND status = ?) AS ordered_transfers WHERE prevTimestamp IS NOT NULL', ['transfer', senderWalletAddress, 'completed']);
        let Avg_min_between_received_tnx = await db.query('SELECT IFNULL(AVG((initiationTimestamp - prevTimestamp) / 60), 0) AS avg_time_difference_in_minutes FROM (SELECT initiationTimestamp, LAG(initiationTimestamp) OVER (ORDER BY initiationTimestamp) AS prevTimestamp FROM transactions WHERE type = ? AND destinationWalletAddress = ? AND status = ?) AS ordered_transfers WHERE prevTimestamp IS NOT NULL', ['transfer' ,senderWalletAddress, 'completed']);
        let Time_Diff_between_first_and_last_Mins = await db.query('SELECT (MAX(initiationTimestamp) - MIN(initiationTimestamp)) / 60 AS Time_Diff_between_first_and_last_Mins FROM transactions WHERE (sourceWalletAddress = ? OR destinationWalletAddress = ?) AND status = ? AND type = ?', [senderWalletAddress, senderWalletAddress, 'completed', 'transfer']);
        let Unique_Received_From_Addresses = await db.query('SELECT COUNT(DISTINCT sourceWalletAddress) AS Unique_Senders FROM transactions WHERE type = ? AND destinationWalletAddress = ? AND status = ?', ['transfer', senderWalletAddress, 'completed'])

        let min_value_received = await db.query('SELECT MIN(amount) AS Min_Amount_Received FROM transactions WHERE type = ? AND destinationWalletAddress = ? AND status = ?', ['transfer', senderWalletAddress, 'completed'])
        let max_value_received = await db.query('SELECT MAX(amount) AS Max_Amount_Received FROM transactions WHERE type = ? AND destinationWalletAddress = ? AND status = ?', ['transfer', senderWalletAddress, 'completed']);
        let avg_val_received = await db.query('SELECT AVG(amount) AS Avg_Amount_Received FROM transactions WHERE type = ? AND destinationWalletAddress = ? AND status = ?',['transfer', senderWalletAddress, 'completed']);
        let min_val_sent = await db.query('SELECT MIN(amount) AS Min_Amount_Sent FROM transactions WHERE type = ? AND sourceWalletAddress = ? AND status = ?', ['transfer' ,senderWalletAddress ,'completed']);
        let avg_val_sent = await db.query('SELECT AVG(amount) AS Avg_Amount_Sent FROM transactions WHERE type = ? AND sourceWalletAddress = ? AND status = ?', ['transfer' ,senderWalletAddress ,'completed']);
        let total_transactions = await db.query('SELECT COUNT(*) AS Total_Transactions FROM transactions WHERE (sourceWalletAddress = ? OR destinationWalletAddress = ?) AND type IN (?, ?) AND status = ?', [senderWalletAddress, senderWalletAddress, 'transfer', 'withdrawal', 'completed'])
        let total_ether_received = await db.query('SELECT SUM(amount) AS Total_Ether_Received FROM transactions WHERE type = ? AND destinationWalletAddress = ? AND status = ? AND currency = ?', ['transfer', senderWalletAddress, 'completed', 'ETH']);
        
        // CALCULATING THE WALLET BALANCE
        let balanceWei = await web3.eth.getBalance(senderWalletAddress); 
        let balanceEth = web3.utils.fromWei(balanceWei, "ether"); 
        let total_ether_balance = balanceEth;

        let loginData = await db.query('SELECT loginID, deviceID, latitude, longitude, loginTime FROM loginhistory WHERE userID = ? ORDER BY loginTime DESC LIMIT 1', [senderID])
        let device_history_last_3_days = await db.query('SELECT loginID, userID, deviceID, latitude, longitude, loginTime FROM loginhistory WHERE deviceID = ? AND loginTime >= DATE_SUB(CURDATE(), INTERVAL 3 DAY) ORDER BY loginTime DESC', [loginData[0][0].deviceID])
        let last_user_login = await db.query('SELECT userID, loginID, deviceID, latitude, longitude, loginTime FROM loginhistory WHERE loginTime < (SELECT loginTime FROM loginhistory WHERE userID = ? ORDER BY loginTime DESC LIMIT 1) ORDER BY loginTime DESC LIMIT 1', [senderID])     
        let avg_withdrawal_frequency_14d = await db.query('SELECT COUNT(*) / 14 AS avg_withdrawal_frequency_14d FROM transactions WHERE type = ? AND status = ? AND sourceWalletAddress = ? AND initiationTimestamp >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 14 DAY))', ['withdrawal', 'completed', senderWalletAddress])        
        let withdrawals_24h = await db.query('SELECT COUNT(*) AS withdrawals_24h FROM transactions WHERE type = ? AND status = ? AND sourceWalletAddress = ? AND initiationTimestamp >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 DAY))', ['withdrawal', 'completed', senderWalletAddress])
        let failed_withdrawals_24h = await db.query('SELECT COUNT(*) AS failed_withdrawals_24h FROM transactions WHERE type = ? AND status = ? AND sourceWalletAddress = ? AND initiationTimestamp >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 DAY))', ['withdrawal', 'failed', senderWalletAddress])
        
        // ML SERVER DATA
        const serverData = {
            "transaction_id": storingTransactionResult[0].insertId,
            "user_id": senderID,
            "transaction_type": "transfer",  

            "transaction_data": {  
                "Avg min between sent tnx": Avg_min_between_sent_tnx[0][0].avg_time_difference_in_minutes,  
                "Avg min between received tnx": Avg_min_between_received_tnx[0][0].avg_time_difference_in_minutes,  
                "Time Diff between first and last (Mins)": Time_Diff_between_first_and_last_Mins[0][0].Time_Diff_between_first_and_last_Mins,  
                "Unique Received From Addresses": Unique_Received_From_Addresses[0][0].Unique_Senders,  
                "min value received": min_value_received[0][0].Min_Amount_Received,  
                "max value received": max_value_received[0][0].Max_Amount_Received,  
                "avg val received": avg_val_received[0][0].Avg_Amount_Received,  
                "min val sent": min_val_sent[0][0].Min_Amount_Sent,  
                "avg val sent": avg_val_sent[0][0].Avg_Amount_Sent,  
                "total transactions (including tnx to create contract)": total_transactions[0][0].Total_Transactions,  
                "total ether received": total_ether_received[0][0].Total_Ether_Received,  
                "total ether balance": total_ether_balance  
              },  

              "login_data": {  
                "session": {  
                  "userId": senderID,  
                  "deviceId": loginData[0][0].deviceID,  
                  "timestamp": loginData[0][0].loginTime,
                  "latitude": loginData[0][0].latitude,
                  "longitude": loginData[0][0].longitude  
                },  
                "device_history_last_3_days": device_history_last_3_days[0],  
                "last_user_login": {  
                  "userId": last_user_login[0][0].userID,  
                  "timestamp": last_user_login[0][0].loginTime,
                  "latitude": last_user_login[0][0].latitude,
                  "longitude": last_user_login[0][0].longitude   
                }  
              },  

              "withdrawal_data": {  
                "current_wallet_balance": total_ether_balance,  
                "withdrawal_amount": "0",  
                "conversion_rate": "2000",  
                "avg_withdrawal_frequency_14d": avg_withdrawal_frequency_14d[0][0].avg_withdrawal_frequency_14d,  
                "withdrawals_24h": withdrawals_24h[0][0].withdrawals_24h,  
                "failed_withdrawals_24h": failed_withdrawals_24h[0][0].failed_withdrawals_24h  
              }
            
              
        }

        //Call the ML Server here
            let severity = 5; // Assuming the ML server returns a severity score
            let fruadType = 'ABC' // Assuming the ML server return a fraud type
            status = 'failed' // Assuming the ML server return a status (failed/pending)
        //


        if (severity >= 90) {
            query = 'UPDATE Transactions SET status = ?, severity = ?, fraudType = ? WHERE transactionID = ?';
            values = [status, severity, fruadType, storingTransactionResult[0].insertId];
            result = await db.query(query, values);

            return res.json({
                message: "Transaction unsuccessful"
            });
        }


        query = 'UPDATE Transactions SET status = ?, completionTimestamp = ?, severity = ? WHERE transactionID = ?';
        values = ['completed', Math.floor(Date.now() / 1000), severity, storingTransactionResult[0].insertId];



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
                TxHash: receipt.transactionHash,
                data: serverData
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
        values = ['deposit', usdAmount, 'USD', sourceLoginId, destinationLoginId, process.env.BLOCKCHAIN_CONTRACT_ADDRESS, recieverWalletAddress, 'completed', initiationTimestamp, Math.floor(Date.now() / 1000), severity ];



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

        console.log(receipt.transactionHash)
        return res.json({
                message: "Transaction Successfull",
                TxHash: receipt.transactionHash
        });
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



exports.withdrawCoinsFromWallet = async (req, res, next) => {
    try {
        const senderID = req.User.userID;
        const { usdAmount, initiationTimestamp } = req.body;

        let query = 'SELECT * FROM Wallets WHERE userID = ? ';
        let values = [senderID];
        let result = await db.query(query, values);

        const senderWalletAddress = result[0][0].walletAddress;
        const senderPrivateKey = result[0][0].privateKey;

        //Call the ML Server here
            let severity = 50; 
            let fruadType = 'ABC' 
            let status = 'failed' 
        //

        let sourceLoginId = await db.query("SELECT loginID FROM LoginHistory WHERE userID = ? ORDER BY loginTime DESC", [senderID]);
        sourceLoginId = sourceLoginId[0][0].loginID;

        let destinationLoginId = null;

        if (severity >= 90) {
            query = 'INSERT INTO Transactions (type, amount, currency, sourceLoginId, destinationLoginId, sourceWalletAddress, destinationWalletAddress, status, initiationTimestamp, severity, fraudType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            values = ['withdraw', usdAmount, 'USD', sourceLoginId, destinationLoginId, senderWalletAddress, process.env.BLOCKCHAIN_CONTRACT_ADDRESS, status, initiationTimestamp, severity, fruadType];
            result = await db.query(query, values);

            return res.json({
                message: "Transaction unsuccessful"
            });
        }

        query = 'INSERT INTO Transactions (type, amount, currency, sourceLoginId, destinationLoginId, sourceWalletAddress, destinationWalletAddress, status, initiationTimestamp, completionTimestamp, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        values = ['withdrawal', usdAmount, 'USD', sourceLoginId, destinationLoginId, senderWalletAddress, process.env.BLOCKCHAIN_CONTRACT_ADDRESS, 'completed', initiationTimestamp, Math.floor(Date.now() / 1000), severity ];



        const contract = new web3.eth.Contract(contractABI, process.env.BLOCKCHAIN_CONTRACT_ADDRESS);


        const USD_TO_ETH_RATE = 2000;
        const requiredETH = (usdAmount * 1) / USD_TO_ETH_RATE; 
        console.log(requiredETH)
        const requiredETHInWei = web3.utils.toWei(requiredETH.toString(), "ether");

        const gasPrice = await web3.eth.getGasPrice();  
        const estimatedGas = await contract.methods.withdrawUSD(usdAmount).estimateGas({
            from: senderWalletAddress,
            value: requiredETHInWei
        });


        const tx = {
            from: senderWalletAddress,
            to:  process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
            gas: estimatedGas, 
            gasPrice: gasPrice,
            value: requiredETHInWei,
            data: contract.methods.withdrawUSD(usdAmount).encodeABI()
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, senderPrivateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);


        result = await db.query(query, values);

        return res.json({
                message: "Transaction Successfull. Amount withdrawn from you wallet",
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