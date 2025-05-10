const express = require('express');
const router =  express.Router();
const upload = require('../constants/awsConfig');
const genericErrorMessage = require('../constants/constants.js')
const db = require("../db/db");

exports.kycDocUpload = async (req, res) => {
    req
    console.log()

    upload.single("document")(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: "Error: " + err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const documentReference = req.file.location;
        const userId = req.body.userId; 

        try {
            await db.query("INSERT INTO KYC (userID, documentReference) VALUES (?, ?)", [userId, documentReference]);
            res.status(200).json({ message: "KYC data Uploaded Successfully" });
        } catch (dbErr) {
            res.status(500).json({ message: genericErrorMessage });
        }
    });
};