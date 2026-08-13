import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const tables = ["customer_email_verification_tokens", "customer_email_verification_outbox", "customer_email_verification_events"];
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  const presentResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1)", [tables]);
  const present = new Set(presentResult.rows.map((row) => row.table_name));
  if (present.size > 0 && present.size !== tables.length) throw new Error("Partial Phase 1G-E email-verification schema found; refusing to modify it");
  if (present.size === 0) {
    const sql = readFileSync(resolve(import.meta.dirname, "../database/migrations/20260812_add_phase1ge_email_verification.sql"), "utf8");
    await client.query(sql);
  }
  const verify = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1)", [tables]);
  if (verify.rowCount !== tables.length) throw new Error("Phase 1G-E email-verification schema verification failed");
  await client.query("COMMIT");
  console.log("PHASE 1G-E EMAIL VERIFICATION MIGRATION: COMMITTED");
} catch (error) {
  await client.query("ROLLBACK"); throw error;
} finally { await client.end(); }
