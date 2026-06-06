import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/**
 * Handle user signup requests and return a JWT for the created account.
 */
export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const existing = await userService.findUserByEmail(email);
    if (existing) return res.status(409).json({ error: "email already in use" });
    const user = await userService.createUser(email, password);
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
}

/**
 * Handle user login requests and return a JWT for valid credentials.
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const user = await userService.findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "invalid credentials" });
    const ok = await userService.verifyPassword(user, password);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
}
