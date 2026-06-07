#!/usr/bin/env node
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const explicitPath = process.argv[2] || process.env.DB_PATH;
const defaultPath = path.resolve(__dirname, "../data/database.sqlite");
const dbPath = explicitPath ? path.resolve(explicitPath) : defaultPath;

if (!fs.existsSync(dbPath)) {
  console.error("Database file not found:", dbPath);
  console.error("Run the backend once to create the database, or pass the path as the first argument.");
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Open DB error:", err.message);
    process.exit(1);
  }
  console.log("Opened DB:", dbPath);
});

function listTables() {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(r => r.name));
    });
  });
}

function dumpTable(table) {
  return new Promise((resolve) => {
    db.all(`SELECT * FROM ${table} LIMIT 100`, [], (err, rows) => {
      if (err) {
        console.warn(`Could not read ${table}:`, err.message);
        return resolve();
      }
      console.log(`\n=== ${table} (${rows.length} rows) ===`);
      console.dir(rows, { depth: 2, maxArrayLength: 200 });
      resolve();
    });
  });
}

(async function main(){
  try {
    const tables = await listTables();
    console.log("Tables:", tables.join(", "));
    const toInspect = ["users", "walkthroughs", "progress"];
    for (const t of toInspect) {
      if (tables.includes(t)) await dumpTable(t);
    }
  } catch (e) {
    console.error("Error inspecting DB:", e);
  } finally {
    db.close();
  }
})();
