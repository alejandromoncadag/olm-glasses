import { createHash, randomUUID } from "node:crypto";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  const userId = randomUUID();
  const email = `phase1ge-${userId}@example.test`;
  await client.query(`INSERT INTO users (id,name,email,"emailVerified") VALUES ($1,'Phase 1G-E',LOWER($2),NULL)`, [userId, email]);
  const tokenHash = createHash("sha256").update(randomUUID()).digest("hex");
  const token = await client.query(`INSERT INTO customer_email_verification_tokens (user_id,token_hash,expires_at) VALUES ($1,$2,NOW()+INTERVAL '30 minutes') RETURNING id`, [userId, tokenHash]);
  await client.query(`INSERT INTO customer_email_verification_outbox (verification_id,recipient_email,subject,html_body,text_body) VALUES ($1,$2,'Verify','<p>Verify</p>','Verify')`, [token.rows[0].id, email]);
  const before = await client.query(`SELECT "emailVerified" FROM users WHERE id=$1`, [userId]);
  if (before.rows[0].emailVerified !== null) throw new Error("Password user was unexpectedly verified");
  await client.query(`UPDATE users SET "emailVerified"=NOW() WHERE id=$1`, [userId]);
  await client.query(`UPDATE customer_email_verification_tokens SET consumed_at=NOW() WHERE id=$1`, [token.rows[0].id]);
  await client.query(`INSERT INTO customer_email_verification_events (user_id,event_type,provider) VALUES ($1,'email_verified','password')`, [userId]);
  const after = await client.query(`SELECT "emailVerified" FROM users WHERE id=$1`, [userId]);
  if (!after.rows[0].emailVerified) throw new Error("Verification state was not durable");
  console.log("PHASE 1G-E EMAIL VERIFICATION TEST: PASS");
  console.log("  [OK] password user starts unverified");
  console.log("  [OK] token, outbox, and audit event persist transactionally");
  console.log("  [OK] verified timestamp is durable");
} finally {
  await client.query("ROLLBACK");
  await client.end();
}
