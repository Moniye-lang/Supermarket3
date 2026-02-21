import jwt from "jsonwebtoken";
import { isBlacklisted } from "../tokenBlacklist.js";

// ✅ Base authentication middleware (shared by all)
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.token;
    if (!authHeader) return res.status(401).json({ error: "You are not authenticated!" });

    const token = authHeader.split(" ")[1];

    if (isBlacklisted(token)) {
      return res.status(401).json({ error: "Session expired, please log in again." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
      if (err) return res.status(403).json({ error: "Token is not valid!" });
      req.user = decodedUser;
      next();
    });
  } catch (err) {
    console.error("authMiddleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Allow access if user owns resource or is admin
const verifyTokenAndAuthorization = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.id === req.params.userId || req.user.role === "admin") next();
    else res.status(403).json({ error: "You are not allowed to do that!" });
  });
};

// ✅ Admin-only route protection
const verifyTokenAndAdmin = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role === "admin") next();
    else res.status(403).json({ error: "Admin access required!" });
  });
};

// ✅ Rider-only (worker) route protection
const verifyTokenAndWorker = (req, res, next) => {
  authMiddleware(req, res, () => {
    // Allow riders (workers) and admins
    if (req.user.role === "rider" || req.user.role === "admin"  || req.user.role === "pickupworker") next();
    else res.status(403).json({ error: "Worker access required!" });
  });
};

export default authMiddleware;
export { verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndWorker };
