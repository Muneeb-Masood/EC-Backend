const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
require('dotenv').config();

const IMAGE_FILE_SIZE_LIMIT = 1024 * 1024 * 1;
const DOCUMENT_FILE_SIZE_LIMIT = 1024 * 1024 * 5;

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

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

const fileFilter = (req, file, cb) => {
    const fileSize = parseInt(req.headers["content-length"]); 

    if (file.fieldname === "cnic") {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files (JPG, PNG) are allowed for CNIC"), false);
        }
        if (fileSize > IMAGE_FILE_SIZE_LIMIT) {
            return cb(new Error("CNIC image must be less than 1MB!"), false);
        }
    } 
    else if (file.fieldname === "document") {
        if (file.mimetype !== "application/pdf") {
            return cb(new Error("Only .pdf files are allowed for documents!"), false);
        }
        if (fileSize > DOCUMENT_FILE_SIZE_LIMIT) {
            return cb(new Error("Document must be less than 5MB!"), false);
        }
    } 

    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

module.exports = upload;
