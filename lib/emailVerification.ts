import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";

import { pool } from "@/lib/db";

const TOKEN_LIFETIME_MINUTES = 30;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function baseUrl() {
  const raw = (process.env.APP_URL || "http://localhost:3000").trim();
  const parsed = new URL(raw);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("APP_URL must use http or https");
  }
  return parsed.origin;
}

function verificationMessage(name: string, url: string) {
  const safeName = name.replace(/[<>&"']/g, "");
  return {
    subject: "Verifica tu correo · Óptica OLM",
    text: `Hola ${safeName},\n\nVerifica tu correo para vincular tus datos de paciente y usar recetas aprobadas:\n${url}\n\nEl enlace vence en ${TOKEN_LIFETIME_MINUTES} minutos.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px"><h1>Verifica tu correo</h1><p>Hola ${safeName},</p><p>Confirma tu correo antes de vincular datos de paciente o usar recetas guardadas.</p><p><a href="${url}" style="display:inline-block;background:#4a2d23;color:white;padding:12px 20px;text-decoration:none;border-radius:999px">Verificar correo</a></p><p>El enlace vence en ${TOKEN_LIFETIME_MINUTES} minutos.</p></div>`,
  };
}

export async function createVerificationRequest(
  userId: string,
  email: string,
  name: string
) {
  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  const url = `${baseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const message = verificationMessage(name || "cliente OLM", url);
  const client = await pool.connect();
  let outboxId = "";

  try {
    await client.query("BEGIN");
    const user = await client.query(
      `SELECT "emailVerified" FROM users WHERE id=$1 AND LOWER(email)=LOWER($2) FOR UPDATE`,
      [userId, email]
    );
    if (!user.rows[0]) throw new Error("Verification user not found");
    if (user.rows[0].emailVerified) {
      await client.query("COMMIT");
      return { alreadyVerified: true, rateLimited: false, devVerificationUrl: null };
    }
    const recent = await client.query(
      `SELECT COUNT(*)::int AS count FROM customer_email_verification_tokens
       WHERE user_id=$1 AND created_at>NOW()-INTERVAL '1 hour'`,
      [userId]
    );
    if (Number(recent.rows[0].count) >= 5) {
      await client.query("COMMIT");
      return { alreadyVerified: false, rateLimited: true, devVerificationUrl: null };
    }
    await client.query(
      `UPDATE customer_email_verification_tokens
       SET invalidated_at=NOW()
       WHERE user_id=$1 AND consumed_at IS NULL AND invalidated_at IS NULL`,
      [userId]
    );
    const verification = await client.query(
      `INSERT INTO customer_email_verification_tokens
       (user_id,token_hash,expires_at)
       VALUES ($1,$2,NOW()+make_interval(mins=>$3)) RETURNING id`,
      [userId, hash, TOKEN_LIFETIME_MINUTES]
    );
    const outbox = await client.query(
      `INSERT INTO customer_email_verification_outbox
       (verification_id,recipient_email,subject,html_body,text_body)
       VALUES ($1,LOWER($2),$3,$4,$5) RETURNING id`,
      [verification.rows[0].id, email, message.subject, message.html, message.text]
    );
    outboxId = String(outbox.rows[0].id);
    await client.query(
      `INSERT INTO customer_email_verification_events
       (user_id,event_type,provider) VALUES ($1,'verification_requested','password')`,
      [userId]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  await tryDeliverOutbox(outboxId);
  return {
    alreadyVerified: false,
    rateLimited: false,
    devVerificationUrl:
      process.env.EMAIL_VERIFICATION_DEV_LINKS === "true" &&
      process.env.NODE_ENV !== "production"
        ? url
        : null,
  };
}

async function tryDeliverOutbox(outboxId: string) {
  const webhook = (process.env.EMAIL_VERIFICATION_WEBHOOK_URL || "").trim();
  if (!webhook) return;
  const result = await pool.query(
    `SELECT recipient_email,subject,html_body,text_body
     FROM customer_email_verification_outbox WHERE id=$1 AND status='queued'`,
    [outboxId]
  );
  const message = result.rows[0];
  if (!message) return;
  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.EMAIL_VERIFICATION_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.EMAIL_VERIFICATION_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Óptica OLM <no-reply@localhost>",
        to: message.recipient_email,
        subject: message.subject,
        html: message.html_body,
        text: message.text_body,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    await pool.query(
      `UPDATE customer_email_verification_outbox
       SET status=$2,attempt_count=attempt_count+1,sent_at=CASE WHEN $2='sent' THEN NOW() ELSE NULL END,
           last_error=CASE WHEN $2='failed' THEN $3 ELSE NULL END,updated_at=NOW()
       WHERE id=$1`,
      [outboxId, response.ok ? "sent" : "failed", response.ok ? null : `HTTP ${response.status}`]
    );
  } catch {
    await pool.query(
      `UPDATE customer_email_verification_outbox
       SET status='failed',attempt_count=attempt_count+1,last_error='delivery unavailable',updated_at=NOW()
       WHERE id=$1`,
      [outboxId]
    );
  }
}

export async function consumeVerificationToken(token: string) {
  if (!/^[A-Za-z0-9_-]{32,200}$/.test(token)) return false;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT id,user_id FROM customer_email_verification_tokens
       WHERE token_hash=$1 AND consumed_at IS NULL AND invalidated_at IS NULL
         AND expires_at>NOW() FOR UPDATE`,
      [tokenHash(token)]
    );
    const row = result.rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(`UPDATE users SET "emailVerified"=NOW() WHERE id=$1`, [row.user_id]);
    await client.query(
      `UPDATE customer_email_verification_tokens
       SET consumed_at=CASE WHEN id=$2 THEN NOW() ELSE consumed_at END,
           invalidated_at=CASE WHEN id<>$2 AND consumed_at IS NULL THEN NOW() ELSE invalidated_at END
       WHERE user_id=$1`,
      [row.user_id, row.id]
    );
    await client.query(
      `INSERT INTO customer_email_verification_events
       (user_id,event_type,provider) VALUES ($1,'email_verified','password')`,
      [row.user_id]
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function persistGoogleVerification(
  userId: string,
  googleVerified: boolean
) {
  if (!googleVerified) return;
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE users SET "emailVerified"=NOW() WHERE id=$1`, [userId]);
    await client.query(
      `INSERT INTO customer_email_verification_events
       (user_id,event_type,provider) VALUES ($1,'email_verified','google')`,
      [userId]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
