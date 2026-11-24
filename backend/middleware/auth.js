const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config/jwt");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Session expired" });
  }
}

function requireAdmin(req, res, next) {
  if (req.auth?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
