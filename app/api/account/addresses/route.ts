import { NextResponse } from "next/server";

import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type AddressInput = {
  label?: string;
  recipientName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function validateAddress(body: AddressInput) {
  const address = {
    label: clean(body.label) || "Casa",
    recipientName: clean(body.recipientName),
    phone: clean(body.phone),
    addressLine1: clean(body.addressLine1),
    addressLine2: clean(body.addressLine2) || null,
    city: clean(body.city),
    state: clean(body.state),
    postalCode: clean(body.postalCode),
    country: clean(body.country) || "México",
    isDefault: body.isDefault === true,
  };

  if (
    !address.recipientName ||
    !address.phone ||
    !address.addressLine1 ||
    !address.city ||
    !address.state ||
    !address.postalCode
  ) {
    return { error: "Completa todos los campos obligatorios." } as const;
  }

  if (
    address.label.length > 40 ||
    address.recipientName.length > 120 ||
    address.phone.length > 40 ||
    address.addressLine1.length > 200 ||
    (address.addressLine2?.length || 0) > 200 ||
    address.city.length > 100 ||
    address.state.length > 100 ||
    address.postalCode.length > 20
  ) {
    return { error: "Uno de los campos es demasiado largo." } as const;
  }

  return { address } as const;
}

export async function POST(request: Request) {
  const customer = await getOptionalAuthenticatedCustomer();

  if (!customer) {
    return NextResponse.json(
      { error: "Inicia sesión para guardar una dirección." },
      { status: 401 }
    );
  }

  const validation = validateAddress((await request.json()) as AddressInput);

  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `SELECT id FROM customers WHERE id = $1 FOR UPDATE`,
      [customer.customerId]
    );

    const existingResult = await client.query(
      `
        SELECT EXISTS(
          SELECT 1
          FROM customer_addresses
          WHERE customer_id = $1 AND is_default = TRUE
        ) AS has_default
      `,
      [customer.customerId]
    );

    const isDefault =
      validation.address.isDefault || !existingResult.rows[0].has_default;

    if (isDefault) {
      await client.query(
        `
          UPDATE customer_addresses
          SET is_default = FALSE
          WHERE customer_id = $1
        `,
        [customer.customerId]
      );
    }

    const result = await client.query(
      `
        INSERT INTO customer_addresses (
          customer_id,
          label,
          recipient_name,
          phone,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `,
      [
        customer.customerId,
        validation.address.label,
        validation.address.recipientName,
        validation.address.phone,
        validation.address.addressLine1,
        validation.address.addressLine2,
        validation.address.city,
        validation.address.state,
        validation.address.postalCode,
        validation.address.country,
        isDefault,
      ]
    );

    if (isDefault) {
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
          validation.address.phone,
          validation.address.addressLine1,
          validation.address.city,
          validation.address.state,
          validation.address.postalCode,
          validation.address.country,
        ]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json(
      { addressId: result.rows[0].id },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      "Address creation error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos guardar la dirección." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
