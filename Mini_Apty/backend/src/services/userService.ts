import { execute, query } from "../db";
import bcrypt from "bcryptjs";

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export async function createUser(email: string, password: string): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 10);
  const createdAt = new Date().toISOString();
  const result = await execute(
    `INSERT INTO users (email, passwordHash, createdAt) VALUES (?, ?, ?)`,
    [email, passwordHash, createdAt]
  );
  const id = Number(result.lastID);
  return { id, email, passwordHash, createdAt };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const row = await query<User>(`SELECT * FROM users WHERE email = ?`, [email]);
  return row || null;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}
