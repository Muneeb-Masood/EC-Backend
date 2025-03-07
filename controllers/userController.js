const db = require("../db/db");
const sendVerificationEmail = require("../utils/emailService");
const sendOTPEmail = require("../utils/OTPEmailService");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
// const crypto = require("crypto");

exports.signup = async (req, res, next) => {
    try {
        const { email, password, phone } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email and password are required" });
        }

        // const verificationToken = crypto.randomBytes(32).toString("hex");

        const hashedPassword = await bcrypt.hash(password, 10);

        const query =
            "INSERT INTO Users (email, password, phone, emailVerified) VALUES (?, ?, ?, ?)";
        const values = [email, hashedPassword, phone, false];

        const result = await db.query(query, values);
        const userID = result.insertId;

        const verificationToken = jwt.sign(
            { userID, email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;

        await sendVerificationEmail(email, verificationLink);

        res.status(201).json({
            message: "User registered. Check your email for verification.",
            userID,
        });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: "Invalid verification link" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            decoded = jwt.decode(token);
            if (decoded && decoded.email) {
                await db.query("DELETE FROM Users WHERE email = ?", [
                    decoded.email,
                ]);
                return res.status(400).json({
                    error: "Verification token expired. User has been removed.",
                });
            }
            return res.status(400).json({ error: "Invalid token" });
        }

        await db.query("UPDATE Users SET emailVerified = ? WHERE email = ?", [
            true,
            decoded.email,
        ]);

        res.json({
            message: "Email verified successfully! You can now log in.",
        });
    } catch (error) {
        console.error("Email Verification Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.enable2FA = async (req, res, next) => {
    try {
        const userID = req.User.userID;

        const query = "UPDATE Users SET emailVerified = ? WHERE userID = ?";
        const values = [true, userID];

        await db.query(query, values);

        res.status(200).json({
            message:
                "Two-factor authentication (2FA) has been enabled successfully. You will need to enter an OTP the next time you log in.",
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.disable2FA = async (req, res, next) => {
    try {
        const userID = req.User.userID;

        const query = "UPDATE Users SET emailVerified = ? WHERE userID = ?";
        const values = [false, userID];

        await db.query(query, values);

        res.status(200).json({
            message:
                "Two-factor authentication (2FA) has been disabled successfully. You will no longer need to enter an OTP when logging in.",
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.sendPwdOtp = async (req, res, next) => {
    try {
        const { email } = req.body;

        const [result] = await db.query(
            "Select * from Users where email = ?",
            email
        );
        if (result.length === 0) {
            res.status(404).json({
                error: "User not found. Please check the email and try again.",
            });
        }

        const userID = result[0].userID;

        const otp = otpGenerator.generate(6, {
            digits: true,
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false,
        });
        console.log("Your OTP is:", otp);

        const hashedOTP = await bcrypt.hash(otp, 10);

        const query =
            "UPDATE Users SET OTPHash = ?, OTPExpiry = ? WHERE userID = ?";

        const values = [hashedOTP, Date.now() + 1 * 60 * 1000, userID];

        await db.query(query, values);

        await sendOTPEmail(email, otp);

        res.status(200).json({ message: "OTP send via your Email" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.resetPwd = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        const [result] = await db.query(
            "Select * from Users where email = ?",
            email
        );

        if (result.length === 0) {
            return res.status(404).json({
                error: "User not found. Please check the email and try again.",
            });
        }

        const userID = result[0].userID;
        const OTPHash = result[0].OTPHash;
        const OTPExpiry = result[0].OTPExpiry;

        const isMatch = await bcrypt.compare(otp, OTPHash);
        if (!isMatch) {
            return res
                .status(400)
                .json({ error: "Invalid OTP. Please try again." });
        }

        if (Date.now() > OTPExpiry) {
            return res
                .status(400)
                .json({
                    error: "OTP has expired. Please request a new one and try again.",
                });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const query = "UPDATE Users SET password = ? WHERE userID = ?";

        const values = [hashedPassword, userID];

        await db.query(query, values);

        res.status(200).json({
            message:
                "Password reset successfully. You can now log in with your new password.",
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        const { email } = req.body;
        await db.query(
            "UPDATE Users SET OTPHash = NULL, OTPExpiry = NULL WHERE email = ?",
            [email]
        );
    }
};
