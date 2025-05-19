const express = require("express");
const router = express.Router();
const upload = require("../constants/awsConfig");
const genericErrorMessage = require("../constants/constants.js");
const db = require("../db/db");

exports.kycDocUpload = async (req, res) => {
    const userID = req.User.userID;
    console.log(userID);

    console.log("KYC Document Upload Request Received");
    const uploadFields = upload.fields([
        { name: "cnicFront", maxCount: 1 },
        { name: "cnicBack", maxCount: 1 },
        { name: "selfie", maxCount: 1 },
        { name: "utilityBill", maxCount: 1 },
    ]);

    uploadFields(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: "Error: " + err.message });
        }

        const {
            name,
            phoneNumber,
            documentType,
            currentAddress,
            city,
            longitude,
            latitude,
        } = req.body;

        const cnicFront = req.files["cnicFront"]?.[0];
        const cnicBack = req.files["cnicBack"]?.[0];
        const selfie = req.files["selfie"]?.[0];
        const utilityBill = req.files["utilityBill"]?.[0];

        if (
            !cnicFront ||
            !cnicBack ||
            !selfie ||
            !utilityBill ||
            !currentAddress ||
            !city
        ) {
            return res.status(400).json({
                message: "All fields (documents, address, city) are required.",
            });
        }

        try {
            const [existingKycRows] = await db.query(
                `SELECT kycID FROM kyc WHERE userID = ? LIMIT 1`,
                [userID]
            );
            const existingKycRecord = existingKycRows[0];

            if (existingKycRecord) {
                const kycID = existingKycRecord.kycID;
                console.log(
                    `Updating existing KYC (kycID: ${kycID}) for userID: ${userID}`
                );
                await db.query(
                    `UPDATE kyc SET
                        name = ?, phoneNumber = ?, documentType = ?,
                        cnicFrontReference = ?, cnicBackReference = ?, selfieReference = ?, utilityBillReference = ?,
                        currentAddress = ?, city = ?, latitude = ?, longitude = ?,
                        verificationStatus = 'pending', 
                        rejectionReason = NULL, 
                        submissionDate = NOW(), 
                        completedDate = NULL
                    WHERE kycID = ?`,
                    [
                        name,
                        phoneNumber || null,
                        documentType,
                        cnicFront.location,
                        cnicBack.location,
                        selfie.location,
                        utilityBill.location,
                        currentAddress,
                        city,
                        latitude || null,
                        longitude || null,
                        kycID,
                    ]
                );

                res.status(200).json({
                    message:
                        "KYC documents updated successfully and re-submitted for verification.",
                    kycID: kycID,
                    documents: {
                        cnicFront: cnicFront.location,
                        cnicBack: cnicBack.location,
                        selfie: selfie.location,
                        utilityBill: utilityBill.location,
                    },
                });
            } else {
                console.log(`Inserting new KYC for userID: ${userID}`);
                const [insertResult] = await db.query(
                    `INSERT INTO kyc (
                        userID, name, phoneNumber, documentType,
                        cnicFrontReference, cnicBackReference, selfieReference, utilityBillReference,
                        currentAddress, city, latitude, longitude,
                        verificationStatus, rejectionReason, submissionDate, completedDate
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NOW(), NULL)`,
                    [
                        userID,
                        name,
                        phoneNumber || null,
                        documentType,
                        cnicFront.location,
                        cnicBack.location,
                        selfie.location,
                        utilityBill.location,
                        currentAddress,
                        city,
                        latitude || null,
                        longitude || null,
                    ]
                );

                res.status(201).json({
                    message:
                        "KYC documents uploaded successfully and submitted for verification.",
                    kycID: insertResult.insertId,
                    documents: {
                        cnicFront: cnicFront.location,
                        cnicBack: cnicBack.location,
                        selfie: selfie.location,
                        utilityBill: utilityBill.location,
                    },
                });
            }
        } catch (dbErr) {
            console.error("Database Error during KYC processing:", dbErr);

            res.status(500).json({
                message:
                    genericErrorMessage && genericErrorMessage.message
                        ? genericErrorMessage.message
                        : "An internal server error occurred.",
            });
        }

        // try {
        //     await db.query(
        //             `INSERT INTO KYC (
        //             userID, name, phoneNumber, documentType,
        //             cnicFrontReference, cnicBackReference, selfieReference, utilityBillReference,
        //             currentAddress, city, latitude, longitude,
        //             verificationStatus, rejectionReason, submissionDate, completedDate
        //         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NOW(), NULL)`,
        //         [
        //             userID, name, phoneNumber, documentType,
        //             cnicFront.location, cnicBack.location, selfie.location, utilityBill.location,
        //             currentAddress, city, latitude, longitude
        //         ]
        //     );

        //     res.status(200).json({
        //         message: "KYC documents uploaded successfully",
        //         documents: {
        //             cnicFront: cnicFront.location,
        //             cnicBack: cnicBack.location,
        //             selfie: selfie.location,
        //             utilityBill: utilityBill.location
        //         }
        //     });
        // } catch (dbErr) {
        //     console.error(dbErr);
        //     res.status(500).json({ message: genericErrorMessage });
        // }
    });
};
