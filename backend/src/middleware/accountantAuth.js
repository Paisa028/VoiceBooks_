const jwt = require("jsonwebtoken");
const { config } = require("../config");

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            config.jwtSecret,
            {
                algorithms: ["HS256"]
            }
        );

        // Login stores the user ID inside JWT "sub".
        // Accountant controllers expect req.user.id.
        req.user = {
            ...decoded,
            id: Number(decoded.sub)
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
}

function requireAccountant(req, res, next) {
    const role = String(
        req.user?.role || ""
    ).toLowerCase();

    if (role !== "accountant") {
        return res.status(403).json({
            success: false,
            message: "Accountant access required"
        });
    }

    next();
}

module.exports = {
    authenticateToken,
    requireAccountant
};