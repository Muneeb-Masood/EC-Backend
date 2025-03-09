const express = require('express');
const router =  express.Router();
const upload = require('../constants/awsConfig');

exports.kycDocUpload = async (req, res) => {
    req
    upload.single("document")(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: "Error: " + err.message });
        }

        const fileUrl = req.file.location;
        const userId = req.body.userId; 

        try {
            await db.query("INSERT INTO Users (userID, fileUrl) VALUES (?, ?)", [userId, fileUrl]);
            res.status(200).json({ message: "File Uploaded Successfully", fileUrl: fileUrl });
        } catch (dbErr) {
            console.error("Database error:", dbErr);
            res.status(500).json({ message: "Database error" });
        }
    });
};