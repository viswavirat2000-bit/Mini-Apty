import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string };
}

/**
 * Express middleware to require a valid bearer token and attach the user to the request.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "authorization required" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (!payload || typeof payload.sub !== "number") return res.status(401).json({ error: "invalid token" });
    req.user = { id: Number(payload.sub), email: String(payload.email || "") };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
}
