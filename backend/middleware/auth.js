const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config/jwt");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  let auth;
  try {
    auth = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Session expired" });
  }

  try {
    const user = await User.findById(auth.id).select("role status").lean();
    if (!user || user.role !== auth.role) {
      return res.status(401).json({ success: false, message: "Account is no longer available" });
    }
    if (user.status === "disabled") {
      return res.status(403).json({ success: false, message: "Your account has been disabled" });
    }

    req.auth = auth;
    return next();
  } catch (error) {
    console.error("AUTH_ACCOUNT_CHECK_ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to verify account access" });
  }
}

function requireAdmin(req, res, next) {
  if (req.auth?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
