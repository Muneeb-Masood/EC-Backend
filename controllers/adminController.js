const db = require("../db/db");

exports.getAllTransactions = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Transactions ORDER BY timestamp DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBlockedTransactions = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM Transactions WHERE status = 'blocked' ORDER BY timestamp DESC");
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

exports.approveTransaction = async (req, res) => {
  const { transactionID } = req.params;
  try {
    const [result] = await db.execute(
      "UPDATE Transactions SET status = 'approved' WHERE transactionID = ? AND status = 'blocked'",
      [transactionID]
    );
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Transaction not found or not in blocked state" });
    }
    res.json({ message: "Transaction approved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
