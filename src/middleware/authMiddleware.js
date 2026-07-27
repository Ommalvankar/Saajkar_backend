const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect Routes
const protect = async (req, res, next) => {
    try {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {

            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select("-password");

            return next();
        }

        return res.status(401).json({
            success: false,
            message: "Not authorized. No token provided."
        });

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });

    }
};


// Admin Middleware
const admin = (req, res, next) => {

    if (req.user && req.user.role === "admin") {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
    });

};

module.exports = {
    protect,
    admin
};