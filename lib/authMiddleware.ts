import jwt from "jsonwebtoken";
import { isBlacklisted } from "./tokenBlacklist";

export interface DecodedUser {
  id: string;
  role: "customer" | "worker" | "rider" | "admin";
}

const getJwtSecret = () => {
  return process.env.JWT_SECRET || "14875bded9a025da665549e07f131b2e5ee0a06eda3efaafa813f9dd56ea1681970edeccdd10fc53b9b9ee8fe0e18d4a50eec";
};

// Base auth verification
export async function verifyAuth(req: Request): Promise<DecodedUser | null> {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("token");
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    const blacklisted = await isBlacklisted(token);
    if (blacklisted) return null;

    const decoded = jwt.verify(token, getJwtSecret()) as DecodedUser;
    return decoded;
  } catch (err) {
    return null;
  }
}

// Admin role check
export async function verifyAdmin(req: Request): Promise<DecodedUser | null> {
  const user = await verifyAuth(req);
  if (user && user.role === "admin") {
    return user;
  }
  return null;
}

// User-specific or Admin authorization check
export async function verifyAuthorization(req: Request, targetUserId: string): Promise<DecodedUser | null> {
  const user = await verifyAuth(req);
  if (user && (user.id === targetUserId || user.role === "admin")) {
    return user;
  }
  return null;
}

// Worker/Rider/Admin authorization check
export async function verifyWorker(req: Request): Promise<DecodedUser | null> {
  const user = await verifyAuth(req);
  if (user && (user.role === "rider" || user.role === "worker" || user.role === "admin")) {
    return user;
  }
  return null;
}
