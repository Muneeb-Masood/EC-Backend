const db = require("../db/db");






exports.getAllTransactions = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Transactions ORDER BY initiationTimestamp DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBlockedTransactions = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT t.transactionID, t.type, t.amount, t.currency, t.sourceLoginId, t.destinationLoginId, t.sourceWalletAddress, t.destinationWalletAddress, t.status, t.initiationTimestamp, t.completionTimestamp, t.severity, t.fraudType, uw.walletAddress AS userWalletAddress, u.userID AS senderID, u.email FROM transactions t JOIN loginhistory lh ON t.sourceLoginId = lh.loginID JOIN users u ON lh.userID = u.userID JOIN wallets uw ON u.userID = uw.userID WHERE t.status = 'failed'");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTransactionById = async (req, res) => {
  const { transactionID } = req.params;
  try {
    const [rows] = await db.execute("SELECT * FROM Transactions WHERE transactionID = ?", [transactionID]);
    if (rows.length === 0) return res.status(404).json({ message: "Transaction not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


