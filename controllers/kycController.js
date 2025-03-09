const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'); 
const multerS3 = require('multer-s3');
require('dotenv').config();

// AWS S3 Client (SDK v3)
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Define Storage using multerS3
const storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
        cb(null, `uploads/${Date.now()}-${file.originalname}`);
    }
});

// File Filter Function (Allow only PDFs)
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only .pdf files are allowed!'), false);
    }
};

// Multer Middleware
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

// File Upload Route
exports.kycFileUpload = (req, res) => {
    upload.single('document')(req, res, function (err) {
        if (err) {
            return res.status(400).json({ message: "Error: " + err.message });
        }
        return res.status(200).json({ message: "File Uploaded Successfully", fileUrl: req.file.location });
    });
};
