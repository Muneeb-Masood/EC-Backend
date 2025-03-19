const db = require("../config/db");
const {VERIFICATION_STATUS}  = require("../constants/status_enums.js");

exports.approveKyc = async (req, res) => {
    const { kycID } = req.body;

    try {
        await db.query(
            "UPDATE kyc SET verificationStatus = ?, completedDate = NOW() WHERE kycID = ?",
            [VERIFICATION_STATUS.VERIFIED, kycID]
        );

        res.status(200).json({ message: "KYC Approved Successfully" });
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
    let {status} = req.query;
    if (status && !Object.values(VERIFICATION_STATUS).includes(status)) {
        return res.status(400).json({ message: "Invalid status provided" });
    }

    let query = "SELECT * FROM kyc";
    let values = [];

    if (status && Object.values(VERIFICATION_STATUS).map((e) => e.toLocaleLowerCase()).includes(status))  {
        query += " WHERE verificationStatus = ?";
        values.push(status);
    }

    try {
        const [results] = await db.query(query, values);
        res.status(200).json({ kycRequests: results });
    } catch (error) {
        console.error("Error fetching KYC requests:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  
};

