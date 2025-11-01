import "server-only";

import { Pool } from "pg";

let pool; // Lazy init to avoid throwing during module import in dev

function getPool() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Defer failure until DB is actually used (e.g., API route), not when home page loads
    const err = new Error(
      "DATABASE_URL is not set. Add it to your .env.local (at repo root)."
    );
    err.code = "DB_MISSING_URL";
    throw err;
  }
  const isProduction = process.env.NODE_ENV === "production";
  pool = new Pool({
    connectionString,
    ssl: isProduction
      ? {
          rejectUnauthorized: false,
        }
      : false,
    max: parseInt(process.env.PG_POOL_MAX || "10", 10),
    idleTimeoutMillis: 30_000,
  });
  return pool;
}

export async function withClient(callback) {
  const client = await getPool().connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

export async function query(text, params) {
  const start = Date.now();
  const res = await getPool().query(text, params);
  if (process.env.NODE_ENV !== "production") {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn("Slow query", { text, duration });
    }
  }
  return res;
}
