const jwt = require("jsonwebtoken");
const db = require("../config/db");

// ⚠️  JWT_SECRET must come from the environment — never hard-code a secret.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ JWT_SECRET environment variable is not set. Aborting.");
    process.exit(1);
  } else {
    console.warn(
      "⚠️  WARNING: JWT_SECRET is not set. Using an insecure default for development only. " +
        "Set JWT_SECRET in your .env file."
    );
  }
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || "dev_only_insecure_jwt_secret_do_not_use_in_prod";


// Authenticate JWT Token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token required. Please sign in." });
  }

  try {
    const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET);
    const user = await db.getUserWithRoles(decoded.id || decoded.email);

    if (!user) {
      return res.status(401).json({ success: false, message: "User account no longer exists." });
    }

    if (user.status === "suspended" || user.status === "deactivated") {
      return res.status(403).json({ success: false, message: "Account has been suspended or deactivated." });
    }

    delete user.password_hash;
    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res.status(403).json({ success: false, message: "Invalid or expired session token. Please sign in again." });
  }
}

// Check if user has required role
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const userRoles = req.user.roles || [req.user.role];
    const hasRole = allowedRoles.some((r) => userRoles.includes(r) || userRoles.includes("admin"));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. This action requires one of the following roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET: EFFECTIVE_JWT_SECRET, // exported for use in authController token signing
};
