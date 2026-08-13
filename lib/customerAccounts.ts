import "server-only";

import type { Session } from "next-auth";
import type { PoolClient } from "pg";

import { auth } from "@/auth";
import { isCustomerAuthConfigured } from "@/lib/customerAuthConfig";
import { pool } from "@/lib/db";

export type CustomerIdentity = {
  authUserId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  emailVerified: string | null;
};

export type AuthenticatedCustomer = CustomerIdentity & {
  customerId: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function identityFromAuthSession(session: Session | null) {
  if (!session?.user?.id || !session.user.email) return null;

  return {
    authUserId: session.user.id,
    email: session.user.email.trim().toLowerCase(),
    fullName: cleanText(session.user.name) || "Cliente OLM",
    avatarUrl: cleanText(session.user.image) || null,
    emailVerified: session.user.emailVerified
      ? new Date(session.user.emailVerified).toISOString()
      : null,
  } satisfies CustomerIdentity;
}

async function mergeCustomerRecords(
  client: PoolClient,
  targetCustomerId: string,
  sourceCustomerId: string
) {
  if (targetCustomerId === sourceCustomerId) return;

  const customerRecordsResult = await client.query(
    `
      SELECT id, stripe_customer_id
      FROM customers
      WHERE id = ANY($1::uuid[])
      FOR UPDATE
    `,
    [[targetCustomerId, sourceCustomerId]]
  );

  const targetCustomer = customerRecordsResult.rows.find(
    (customer) => String(customer.id) === targetCustomerId
  );
  const sourceCustomer = customerRecordsResult.rows.find(
    (customer) => String(customer.id) === sourceCustomerId
  );

  if (!targetCustomer || !sourceCustomer) {
    throw new Error("No se pudieron combinar los registros del cliente.");
  }

  if (!targetCustomer.stripe_customer_id && sourceCustomer.stripe_customer_id) {
    await client.query(
      `UPDATE customers SET stripe_customer_id = NULL WHERE id = $1`,
      [sourceCustomerId]
    );
    await client.query(
      `UPDATE customers SET stripe_customer_id = $2 WHERE id = $1`,
      [targetCustomerId, sourceCustomer.stripe_customer_id]
    );
  }

  await client.query(
    `UPDATE orders SET customer_id = $1 WHERE customer_id = $2`,
    [targetCustomerId, sourceCustomerId]
  );

  await client.query(
    `
      UPDATE eye_exam_bookings
      SET customer_id = $1
      WHERE customer_id = $2
    `,
    [targetCustomerId, sourceCustomerId]
  );

  await client.query(
    `
      INSERT INTO customer_favorites (customer_id, product_id, created_at)
      SELECT $1, product_id, created_at
      FROM customer_favorites
      WHERE customer_id = $2
      ON CONFLICT (customer_id, product_id) DO NOTHING
    `,
    [targetCustomerId, sourceCustomerId]
  );

  await client.query(
    `DELETE FROM customer_favorites WHERE customer_id = $1`,
    [sourceCustomerId]
  );

  await client.query(
    `
      INSERT INTO customer_style_quiz_results (
        customer_id,
        answers,
        recommendation_slugs,
        completed_at,
        created_at,
        updated_at
      )
      SELECT
        $1,
        answers,
        recommendation_slugs,
        completed_at,
        created_at,
        updated_at
      FROM customer_style_quiz_results
      WHERE customer_id = $2
      ON CONFLICT (customer_id) DO UPDATE
      SET
        answers = CASE
          WHEN EXCLUDED.completed_at > customer_style_quiz_results.completed_at
            THEN EXCLUDED.answers
          ELSE customer_style_quiz_results.answers
        END,
        recommendation_slugs = CASE
          WHEN EXCLUDED.completed_at > customer_style_quiz_results.completed_at
            THEN EXCLUDED.recommendation_slugs
          ELSE customer_style_quiz_results.recommendation_slugs
        END,
        completed_at = GREATEST(
          customer_style_quiz_results.completed_at,
          EXCLUDED.completed_at
        )
    `,
    [targetCustomerId, sourceCustomerId]
  );

  await client.query(
    `DELETE FROM customer_style_quiz_results WHERE customer_id = $1`,
    [sourceCustomerId]
  );

  await client.query(
    `
      UPDATE customer_addresses
      SET customer_id = $1, is_default = FALSE
      WHERE customer_id = $2
    `,
    [targetCustomerId, sourceCustomerId]
  );

  await client.query(
    `
      UPDATE customer_addresses
      SET is_default = TRUE
      WHERE id = (
        SELECT id
        FROM customer_addresses
        WHERE customer_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      )
        AND NOT EXISTS (
          SELECT 1
          FROM customer_addresses
          WHERE customer_id = $1 AND is_default = TRUE
        )
    `,
    [targetCustomerId]
  );

  await client.query(
    `
      UPDATE customers AS target
      SET
        phone = CASE WHEN target.phone = '' THEN source.phone ELSE target.phone END,
        address = CASE WHEN target.address = '' THEN source.address ELSE target.address END,
        city = CASE WHEN target.city = '' THEN source.city ELSE target.city END,
        state = CASE WHEN target.state = '' THEN source.state ELSE target.state END,
        zip_code = CASE WHEN target.zip_code = '' THEN source.zip_code ELSE target.zip_code END,
        country = CASE WHEN target.country = '' THEN source.country ELSE target.country END
      FROM customers AS source
      WHERE target.id = $1 AND source.id = $2
    `,
    [targetCustomerId, sourceCustomerId]
  );

  await client.query(`DELETE FROM customers WHERE id = $1`, [sourceCustomerId]);
}

export async function upsertCustomerIdentity(identity: CustomerIdentity) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const byAuthResult = await client.query(
      `
        SELECT *
        FROM customers
        WHERE authjs_user_id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [identity.authUserId]
    );

    const byEmailResult = await client.query(
      `
        SELECT *
        FROM customers
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        FOR UPDATE
      `,
      [identity.email]
    );

    let customer = byAuthResult.rows[0] || null;
    const emailCustomer = byEmailResult.rows[0] || null;

    if (customer && emailCustomer && customer.id !== emailCustomer.id) {
      await mergeCustomerRecords(client, customer.id, emailCustomer.id);
    } else if (!customer && emailCustomer) {
      customer = emailCustomer;
    }

    if (customer) {
      const updatedResult = await client.query(
        `
          UPDATE customers
          SET
            authjs_user_id = $2,
            full_name = $3,
            email = LOWER($4),
            avatar_url = $5
          WHERE id = $1
          RETURNING *
        `,
        [
          customer.id,
          identity.authUserId,
          identity.fullName,
          identity.email,
          identity.avatarUrl,
        ]
      );

      customer = updatedResult.rows[0];
    } else {
      const insertedResult = await client.query(
        `
          INSERT INTO customers (
            full_name,
            email,
            phone,
            address,
            city,
            state,
            zip_code,
            country,
            authjs_user_id,
            avatar_url
          )
          VALUES ($1, LOWER($2), '', '', '', '', '', 'México', $3, $4)
          RETURNING *
        `,
        [
          identity.fullName,
          identity.email,
          identity.authUserId,
          identity.avatarUrl,
        ]
      );

      customer = insertedResult.rows[0];
    }

    await client.query(
      `
        UPDATE eye_exam_bookings
        SET customer_id = $1
        WHERE customer_id IS NULL
          AND LOWER(customer_email) = LOWER($2)
      `,
      [customer.id, identity.email]
    );

    await client.query("COMMIT");

    return {
      customerId: String(customer.id),
      authUserId: identity.authUserId,
      email: identity.email,
      fullName: identity.fullName,
      avatarUrl: identity.avatarUrl,
      emailVerified: identity.emailVerified,
      phone: cleanText(customer.phone),
      address: cleanText(customer.address),
      city: cleanText(customer.city),
      state: cleanText(customer.state),
      zipCode: cleanText(customer.zip_code),
      country: cleanText(customer.country) || "México",
    } satisfies AuthenticatedCustomer;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getOptionalAuthenticatedCustomer() {
  if (!isCustomerAuthConfigured()) return null;

  const identity = identityFromAuthSession(await auth());
  return identity ? upsertCustomerIdentity(identity) : null;
}
