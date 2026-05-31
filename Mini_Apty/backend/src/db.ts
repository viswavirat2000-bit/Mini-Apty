import sqlite3 from "sqlite3";
import path from "path";
import { open } from "fs/promises";

const DATABASE_URL = process.env.DATABASE_URL || `sqlite:${path.resolve(__dirname, "../../data/database.sqlite")}`;

let dbInstance: sqlite3.Database | null = null;

function getDbPath(): string {
  if (DATABASE_URL.startsWith("sqlite:")) return DATABASE_URL.replace("sqlite:", "");
  return DATABASE_URL;
}

export function getDb(): Promise<sqlite3.Database> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const filename = getDbPath();
    const dir = path.dirname(filename);
    open(dir, "r").catch(() => {
      return import("fs").then(({ mkdirSync }) => mkdirSync(dir, { recursive: true }));
    }).finally(() => {
      const db = new sqlite3.Database(filename, (err) => {
        if (err) reject(err);
        else {
          dbInstance = db;
          resolve(db);
        }
      });
    });
  });
}

function run(db: sqlite3.Database, sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => db.run(sql, params, function (err) {
    if (err) reject(err);
    else resolve(this);
  }));
}

function get<T = any>(db: sqlite3.Database, sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row as T | undefined);
  }));
}

function all<T = any>(db: sqlite3.Database, sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows as T[]);
  }));
}

export async function migrate() {
  const db = await getDb();
  await run(db, `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
  await run(db, `
    CREATE TABLE IF NOT EXISTS walkthroughs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ownerId INTEGER NOT NULL,
      title TEXT NOT NULL,
      origin TEXT NOT NULL,
      pathPattern TEXT NOT NULL,
      stepsJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(ownerId) REFERENCES users(id)
    );
  `);
  await run(db, `
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      walkthroughId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      stepIndex INTEGER NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(walkthroughId, userId),
      FOREIGN KEY(walkthroughId) REFERENCES walkthroughs(id),
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const db = await getDb();
  return get<T>(db, sql, params);
}

export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  return all<T>(db, sql, params);
}

export async function execute(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
  const db = await getDb();
  return run(db, sql, params);
}
