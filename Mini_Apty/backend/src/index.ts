import app from "./app";
import fs from "fs";
import path from "path";

/**
 * Load environment variables from a root .env file when present.
 */
function loadDotEnv() {
  const envPath = path.resolve(__dirname, "../..", ".env");
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!key) continue;
    const value = rest.join("=").trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const PORT = process.env.PORT || 4000;
if (!process.env.JWT_SECRET) {
  console.warn("Warning: JWT_SECRET not set — using default dev-secret. Set JWT_SECRET in .env for secure deployments.");
}

app.listen(PORT, () => {
  console.log(`Mini Apty backend listening on ${PORT}`);
});
