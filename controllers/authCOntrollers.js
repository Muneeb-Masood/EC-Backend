const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/db");
const otpGenerator = require("otp-generator");
const sendOTPEmail = require("../utils/OTPFor2FA")

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
    try {
        const { email, password, fingerprint, latitude, longitude } = req.body;
        console.log(req.body)
        const [users] = await db.query("SELECT * FROM Users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(404).json({ error: "User not found!" });

        const user = users[0];

        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid email address or password!" });
        }

        if (!user.emailVerified) {
            return res.status(401).json({ message: "Email address is not verified." });
        }

        const [kycDetails] = await db.query("SELECT verificationStatus FROM KYC WHERE userID = ?", [user.userID]);
        let kycVerificaionStatus = null;
        if (kycDetails.length !== 0) {
            kycVerificaionStatus = kycDetails[0].verificationStatus
        }

        if (user.emailVerified && user.twoFAEnabled) {
            const otp = otpGenerator.generate(4, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
            console.log("Generated OTP:", otp);

            const hashedOTP = await bcrypt.hash(otp, 10);
            const otpExpiry = Date.now() + 5 * 60 * 1000; 

            await db.query("UPDATE Users SET OTPHash = ?, OTPExpiry = ? WHERE userID = ?", [hashedOTP, otpExpiry, user.userID]);

            await sendOTPEmail(user.email, otp);

            const otpToken = jwt.sign({ userID: user.userID, otpExpiry }, JWT_SECRET, { expiresIn: "5m" });

            return res.status(200).json({ message: "OTP sent. Please verify to complete login.", otpToken });
        }

        if ( kycVerificaionStatus === 'verified' ) {
            const [DeviceTableResult] = await db.query("SELECT * FROM DeviceFingerprints WHERE fingerprint = ?", [fingerprint]);
            if (DeviceTableResult.length === 0) {
                const [result] = await db.query("INSERT INTO DeviceFingerprints (fingerprint) VALUES (?)", [fingerprint]);
                console.log(result);
                const LoginHistoryResult = await db.query("INSERT INTO LoginHistory (userID, deviceID, latitude, longitude) VALUES (?, ?, ?, ?);", [user.userID, result.insertId, latitude, longitude]);
            } else {
                console.log('Device fingerprint already exist!!!')
                const LoginHistoryResult = await db.query("INSERT INTO LoginHistory (userID, deviceID, latitude, longitude) VALUES (?, ?, ?, ?);", [user.userID, DeviceTableResult[0].deviceID, latitude, longitude]);
    
            }
        }



        const token = jwt.sign({ userID: user.userID }, JWT_SECRET, { expiresIn: "1h" });



        res.status(200).json({ message: "Login successful!", token , kycVerificaionStatus});

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};




exports.verify2FA = async (req, res) => {
    try {
        const { otp, otpToken, fingerprint, latitude, longitude } = req.body;

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

        const [kycDetails] = await db.query("SELECT verificationStatus FROM KYC WHERE userID = ?", [user.userID]);
        let kycVerificaionStatus = null;
        if (kycDetails.length !== 0) {
            kycVerificaionStatus = kycDetails[0].verificationStatus
        }
        console.log(kycVerificaionStatus)

        if ( kycVerificaionStatus === 'verified' ) {
            const [DeviceTableResult] = await db.query("SELECT * FROM DeviceFingerprints WHERE fingerprint = ?", [fingerprint]);
            if (DeviceTableResult.length === 0) {
                const [result] = await db.query("INSERT INTO DeviceFingerprints (fingerprint) VALUES (?)", [fingerprint]);
                const LoginHistoryResult = await db.query("INSERT INTO LoginHistory (userID, deviceID, latitude, longitude) VALUES (?, ?, ?, ?);", [user.userID, result.insertId, latitude, longitude]);
            } else {
                console.log('Device fingerprint already exist!!!')
                const LoginHistoryResult = await db.query("INSERT INTO LoginHistory (userID, deviceID, latitude, longitude) VALUES (?, ?, ?, ?);", [user.userID, DeviceTableResult[0].deviceID, latitude, longitude]);

            }
        }
        
        const token = jwt.sign({ userID: user.userID }, JWT_SECRET, { expiresIn: "1h" });
        await db.query("UPDATE Users SET OTPHash = NULL, OTPExpiry = NULL WHERE userID = ?", [user.userID]);

        res.status(200).json({ message: "2FA verified successfully!", token, kycVerificaionStatus });
    } catch (error) {
        console.error("2FA Verification Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};




exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.query('Select * from Admin where username = ?', [username])

    if (user[0].length === 0) {
        return res.status(404).json({ message: "Admin not found. Please check your username." });
    }

    const isMatch = await bcrypt.compare(password, user[0][0].password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
        {
          userID: user[0][0].ID,         
          username: user[0][0].username,
          role: 'admin'
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

    res.status(200).json({ token });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};