import { execute, query } from "../db";
import bcrypt from "bcryptjs";

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  createdAt: string;
}

/**
 * Create a new user with a hashed password.
 * @param email User email address.
 * @param password Plaintext password.
 * @returns Created user record.
 */
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

/**
 * Find a user by their email address.
 * @param email Email to search for.
 * @returns User record or null if not found.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const row = await query<User>(`SELECT * FROM users WHERE email = ?`, [email]);
  return row || null;
}

/**
 * Verify a plaintext password against the stored hash.
 * @param user User record.
 * @param password Plaintext password to verify.
 * @returns True when the password matches.
 */
export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}
