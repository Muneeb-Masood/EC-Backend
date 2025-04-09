const db = require("../db/db");
const axios = require('axios');

exports.createTransaction = async (req, res) => {
  try {
    const transaction = req.body;

    const mlResponse = await axios.post('http://localhost:5000/predict', transaction); // Update ML API URL
    const severity = mlResponse.data.severity;
    const fraudType = severity >= 20 ? mlResponse.data.fraudType : null;
    const status = severity >= 90 ? 'blocked' : 'pending';

    const [result] = await db.execute(
      `INSERT INTO Transactions (
        walletID, type, amount, currency, sourceAddress, destinationAddress, address,
        sourceLoginId, destinationLoginId, loginId, network, status, timestamp, severity, \`Fraud type\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.walletID,
        transaction.type,
        transaction.amount,
        transaction.currency,
        transaction.sourceAddress,
        transaction.destinationAddress,
        transaction.address,
        transaction.sourceLoginId,
        transaction.destinationLoginId,
        transaction.loginId,
        transaction.network,
        status,
        new Date(),
        severity,
        fraudType
      ]
    );

    res.json({ success: true, transactionID: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
