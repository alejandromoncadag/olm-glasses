import { NextResponse } from "next/server";

import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

function validId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const customer = await getOptionalAuthenticatedCustomer();
  const { addressId } = await params;

  if (!customer) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!validId(addressId)) {
    return NextResponse.json(
      { error: "La dirección no es válida." },
      { status: 400 }
    );
  }

  const body = await request.json();

  if (body.isDefault !== true) {
    return NextResponse.json(
      { error: "Solo se permite establecer la dirección predeterminada." },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const addressResult = await client.query(
      `
        SELECT *
        FROM customer_addresses
        WHERE id = $1 AND customer_id = $2
        LIMIT 1
        FOR UPDATE
      `,
      [addressId, customer.customerId]
    );

    const address = addressResult.rows[0];

    if (!address) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "No encontramos la dirección." },
        { status: 404 }
      );
    }

    await client.query(
      `
        UPDATE customer_addresses
        SET is_default = (id = $2)
        WHERE customer_id = $1
      `,
      [customer.customerId, addressId]
    );

    await client.query(
      `
        UPDATE customers
        SET
          phone = $2,
          address = $3,
          city = $4,
          state = $5,
          zip_code = $6,
          country = $7
        WHERE id = $1
      `,
      [
        customer.customerId,
        address.phone,
        address.address_line_1,
        address.city,
        address.state,
        address.postal_code,
        address.country,
      ]
    );

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      "Default address error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos actualizar la dirección." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const customer = await getOptionalAuthenticatedCustomer();
  const { addressId } = await params;

  if (!customer) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!validId(addressId)) {
    return NextResponse.json(
      { error: "La dirección no es válida." },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const deletedResult = await client.query(
      `
        DELETE FROM customer_addresses
        WHERE id = $1 AND customer_id = $2
        RETURNING is_default
      `,
      [addressId, customer.customerId]
    );

    if (deletedResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "No encontramos la dirección." },
        { status: 404 }
      );
    }

    if (deletedResult.rows[0].is_default) {
      const replacementResult = await client.query(
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
          RETURNING *
        `,
        [customer.customerId]
      );

      const replacement = replacementResult.rows[0];

      if (replacement) {
        await client.query(
          `
            UPDATE customers
            SET
              phone = $2,
              address = $3,
              city = $4,
              state = $5,
              zip_code = $6,
              country = $7
            WHERE id = $1
          `,
          [
            customer.customerId,
            replacement.phone,
            replacement.address_line_1,
            replacement.city,
            replacement.state,
            replacement.postal_code,
            replacement.country,
          ]
        );
      } else {
        await client.query(
          `
            UPDATE customers
            SET address = '', city = '', state = '', zip_code = ''
            WHERE id = $1
          `,
          [customer.customerId]
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      "Address deletion error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos eliminar la dirección." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
