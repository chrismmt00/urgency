#!/usr/bin/env node
/* Simple migration runner for Postgres
 * - Reads .sql files from ./migrations in name order
 * - Tracks applied files in schema_migrations table
 * - Uses DATABASE_URL from env; loads .env.local or .env if present
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

// Load env (.env.local preferred)
try {
  const dotenv = require("dotenv");
  const root = path.resolve(__dirname, "..");
  const envLocal = path.join(root, ".env.local");
  const env = path.join(root, ".env");
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
  else if (fs.existsSync(env)) dotenv.config({ path: env });
} catch (_) {}

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL;
if (!DATABASE_URL) {
  console.error(
    "Error: DATABASE_URL is not set. Add it to .env.local or your environment."
  );
  process.exit(1);
}

const MIGRATIONS_DIR = path.resolve(__dirname, "migrations");

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Get applied set
    const appliedRes = await client.query(
      "SELECT version FROM schema_migrations"
    );
    const applied = new Set(appliedRes.rows.map((r) => r.version));

    // Read migration files
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log("No migrations directory found. Nothing to do.");
      process.exit(0);
    }
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    let ran = 0;
    for (const file of files) {
      const version = path.basename(file);
      if (applied.has(version)) {
        console.log(`Skipping already applied: ${version}`);
        continue;
      }
      const full = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(full, "utf8");
      console.log(`Applying migration: ${version}`);

      // Do not wrap in our own transaction, allow file to manage BEGIN/COMMIT if present
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(version) VALUES ($1)", [
        version,
      ]);
      ran++;
    }

    console.log(ran ? `Applied ${ran} migration(s).` : "Up to date.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
