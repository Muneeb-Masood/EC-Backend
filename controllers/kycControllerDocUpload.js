const express = require('express');
const router =  express.Router();
const upload = require('../constants/awsConfig');
const genericErrorMessage = require('../constants/constants.js')
const db = require("../db/db");

exports.kycDocUpload = async (req, res) => {

    const userID = req.User.userID;
    console.log(userID)

    console.log("KYC Document Upload Request Received");
    const uploadFields = upload.fields([
        { name: 'cnicFront', maxCount: 1 },
        { name: 'cnicBack', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
        { name: 'utilityBill', maxCount: 1 }
    ]);

    uploadFields(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: "Error: " + err.message });
        }

        const { name, phoneNumber, documentType, currentAddress, city , longitude , latitude } = req.body;

        const cnicFront = req.files['cnicFront']?.[0];
        const cnicBack = req.files['cnicBack']?.[0];
        const selfie = req.files['selfie']?.[0];
        const utilityBill = req.files['utilityBill']?.[0];

        if (!cnicFront || !cnicBack || !selfie || !utilityBill || !currentAddress || !city) {
            return res.status(400).json({ message: "All fields (documents, address, city) are required." });
        }

        try {
            await db.query(
                    `INSERT INTO KYC (
                    userID, name, phoneNumber, documentType,
                    cnicFrontReference, cnicBackReference, selfieReference, utilityBillReference,
                    currentAddress, city, latitude, longitude,
                    verificationStatus, rejectionReason, submissionDate, completedDate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NOW(), NULL)`,
                [
                    userID, name, phoneNumber, documentType,
                    cnicFront.location, cnicBack.location, selfie.location, utilityBill.location,
                    currentAddress, city, latitude, longitude
                ]
            );

            res.status(200).json({
                message: "KYC documents uploaded successfully",
                documents: {
                    cnicFront: cnicFront.location,
                    cnicBack: cnicBack.location,
                    selfie: selfie.location,
                    utilityBill: utilityBill.location
                }
            });
        } catch (dbErr) {
            console.error(dbErr);
            res.status(500).json({ message: genericErrorMessage });
        }
    });
};