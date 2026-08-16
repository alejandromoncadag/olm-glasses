import "server-only";

import { pool } from "@/lib/db";

export type EmailDeliveryResult =
  | { status: "sent"; provider: string }
  | { status: "failed"; error: string; provider: string };

function providerName() {
  return (process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
}

function failureMessage(value: string) {
  return value.replace(/authorization|bearer|api[-_ ]?key|token/gi, "credential").slice(0, 240);
}

async function markOutbox(
  outboxId: string,
  result: { status: "sent" | "failed"; error?: string }
) {
  await pool.query(
    `UPDATE customer_email_verification_outbox
     SET status=$2, attempt_count=attempt_count+1,
         sent_at=CASE WHEN $2='sent' THEN NOW() ELSE NULL END,
         last_error=CASE WHEN $2='failed' THEN $3 ELSE NULL END,
         updated_at=NOW()
     WHERE id=$1`,
    [outboxId, result.status, result.error || null]
  );
}

export async function deliverVerificationEmail(outboxId: string): Promise<EmailDeliveryResult> {
  const provider = providerName();
  const messageResult = await pool.query(
    `SELECT o.recipient_email, o.subject, o.html_body, o.text_body, t.user_id
     FROM customer_email_verification_outbox o
     JOIN customer_email_verification_tokens t ON t.id=o.verification_id
     WHERE o.id=$1 AND o.status='queued'`,
    [outboxId]
  );
  const message = messageResult.rows[0];
  if (!message) return { status: "failed", provider: provider || "none", error: "outbox message unavailable" };

  async function recordDeliveryEvent(eventType: string, metadata: Record<string, string>) {
    await pool.query(
      `INSERT INTO customer_email_verification_events (user_id,event_type,provider,metadata)
       VALUES ($1,$2,$3,$4::jsonb)`,
      [message.user_id, eventType, provider || null, JSON.stringify(metadata)]
    );
  }

  if (provider !== "resend") {
    const error = provider ? `unsupported email provider: ${provider}` : "email provider is not configured";
    await markOutbox(outboxId, { status: "failed", error });
    return { status: "failed", provider: provider || "none", error };
  }

  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const from = (process.env.EMAIL_FROM || "").trim();
  if (!apiKey || !from) {
    const error = "Resend delivery is not configured";
    await markOutbox(outboxId, { status: "failed", error });
    return { status: "failed", provider: "resend", error };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [message.recipient_email],
        subject: message.subject,
        html: message.html_body,
        text: message.text_body,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const error = `Resend rejected email (HTTP ${response.status})`;
      await markOutbox(outboxId, { status: "failed", error });
      await recordDeliveryEvent("verification_delivery_failed", { reason: error });
      return { status: "failed", provider: "resend", error };
    }
    const responseBody = (await response.json().catch(() => null)) as { id?: unknown } | null;
    await markOutbox(outboxId, { status: "sent" });
    await recordDeliveryEvent("verification_delivery_sent", {
      ...(typeof responseBody?.id === "string" ? { provider_message_id: responseBody.id } : {}),
    });
    return { status: "sent", provider: "resend" };
  } catch (error) {
    const detail = error instanceof Error ? failureMessage(error.message) : "delivery unavailable";
    const safeError = `Resend delivery failed: ${detail}`;
    await markOutbox(outboxId, { status: "failed", error: safeError });
    await recordDeliveryEvent("verification_delivery_failed", { reason: safeError });
    return { status: "failed", provider: "resend", error: safeError };
  }
}
