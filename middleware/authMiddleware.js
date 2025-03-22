const jwt = require("jsonwebtoken");
require("dotenv").config();



exports.verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "").trim();

        if (!token) {
            return res.status(401).json({ message: "Access token required. Login First" });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, User) => {
            if (err) return res.status(403).json({ message: "Invalid token" });

            req.User = User;
            next();
        });

        next();
    } catch (error) {
        return res.status(500).json({ message: error });
    }
}