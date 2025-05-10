const db = require("../db/db");
const jwt = require("jsonwebtoken");
const axios = require('axios');
require("dotenv").config();

exports.clusterInfo = async (req, res, next) => {
    try {
        // const {} = req.body;

        let geospacial_transaction_data_2d = await db.query('SELECT latitude, longitude FROM LoginHistory WHERE loginTime BETWEEN NOW() - INTERVAL 2 DAY AND NOW()');


        const serverData = {
            "transaction_id": 0,
            "user_id": 0,
            "transaction_type": "transfer",  

            "transaction_data": {  
                "Avg min between sent tnx": 0,  
                "Avg min between received tnx": 0,  
                "Time Diff between first and last (Mins)": 0,  
                "Unique Received From Addresses": 0,  
                "min value received": 0,  
                "max value received": 0,  
                "avg val received": 0,  
                "min val sent": 0,  
                "avg val sent": 0,  
                "total transactions (including tnx to create contract)": 0,  
                "total ether received": 0,  
                "total ether balance": 0 
              },  

              "login_data": {  
                "session": {  
                  "userId": 0,  
                  "deviceId": 0,  
                  "timestamp": "0",
                  "latitude": "0",
                  "longitude": "0"  
                },  
                "device_history_last_3_days": [],  
                "last_user_login": {  
                  "userId": "0",  
                  "timestamp": "0",
                  "latitude": "0",
                  "longitude": "0"   
                }  
              },  

              "withdrawal_data": {  
                "current_wallet_balance": "0",  
                "withdrawal_amount": "0",  
                "conversion_rate": "0",  
                "avg_withdrawal_frequency_14d": "0",  
                "withdrawals_24h": "0",  
                "failed_withdrawals_24h": "0" 
              },

            "geospacial_transaction_data_2d": geospacial_transaction_data_2d[0]
        }

        const mlResponse = await axios.post(
            process.env.MLSERVER_URL,
            serverData,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );



        console.log(mlResponse.data);
        res.status(201).json({
            message: "Cluster Data fetched successfullly!",
        });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
