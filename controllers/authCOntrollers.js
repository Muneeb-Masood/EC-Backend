const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const otpGenerator = require("otp-generator");

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.query("SELECT * FROM Users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(404).json({ error: "User not found!" });

        const user = users[0];

        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid password!" });
        }

        if (user.emailVerified) {
            const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
            console.log("Generated OTP:", otp);

            const hashedOTP = await bcrypt.hash(otp, 10);
            const otpExpiry = Date.now() + 5 * 60 * 1000; 

            await db.query("UPDATE Users SET OTPHash = ?, OTPExpiry = ? WHERE userID = ?", [hashedOTP, otpExpiry, user.userID]);

            await sendOTPEmail(user.email, otp);

            const otpToken = jwt.sign({ userID: user.userID, otpExpiry }, JWT_SECRET, { expiresIn: "5m" });

            return res.status(200).json({ message: "OTP sent. Please verify to complete login.", otpToken });
        }

        const token = jwt.sign({ userID: user.userID }, JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "Login successful!", token });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.verify2FA = async (req, res) => {
    try {
        const { otp, otpToken } = req.body;

        const decoded = jwt.verify(otpToken, JWT_SECRET);
        if (!decoded) return res.status(400).json({ error: "Invalid or expired OTP token!" });

        if (Date.now() > decoded.otpExpiry) {
            return res.status(400).json({ error: "OTP expired. Please login again." });
        }

        const [users] = await db.query("SELECT * FROM Users WHERE userID = ?", [decoded.userID]);
        if (users.length === 0) return res.status(404).json({ error: "User not found!" });

        const user = users[0];

        if (!(await bcrypt.compare(otp, user.OTPHash))) {
            return res.status(401).json({ error: "Invalid OTP!" });
        }

        const token = jwt.sign({ userID: user.userID }, JWT_SECRET, { expiresIn: "1h" });

        await db.query("UPDATE Users SET OTPHash = NULL, OTPExpiry = NULL WHERE userID = ?", [user.userID]);

        res.status(200).json({ message: "2FA verified successfully!", token });
    } catch (error) {
        console.error("2FA Verification Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
