import { NextResponse } from "next/server";

import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";
import { pool } from "@/lib/db";
import {
  cleanText,
  isValidEmail,
  normalizeEmail,
} from "@/lib/invoiceRequests";

export const runtime = "nodejs";

function mapOrder(order: Record<string, unknown>) {
  return {
    id: String(order.id),
    orderNumber: String(order.order_number),
    orderDate: order.created_at,
    total: Number(order.total_cents) / 100,
    totalCents: Number(order.total_cents),
    currency: String(order.currency || "MXN"),
    paymentMethod: String(order.payment_method || ""),
    customer: {
      id: String(order.customer_id),
      fullName: String(order.full_name || ""),
      email: String(order.email || ""),
    },
  };
}

function mapTaxProfile(profile: Record<string, unknown>) {
  return {
    id: String(profile.id),
    rfc: String(profile.rfc),
    taxName: String(profile.tax_name),
    fiscalPostalCode: String(profile.fiscal_postal_code),
    taxRegime: String(profile.tax_regime),
    cfdiUse: String(profile.cfdi_use),
    invoiceEmail: String(profile.invoice_email),
    isDefault: Boolean(profile.is_default),
  };
}

async function getTaxProfiles(customerId: string) {
  const result = await pool.query(
    `
      SELECT
        id,
        rfc,
        tax_name,
        fiscal_postal_code,
        tax_regime,
        cfdi_use,
        invoice_email,
        is_default
      FROM customer_tax_profiles
      WHERE customer_id = $1
      ORDER BY is_default DESC, updated_at DESC
    `,
    [customerId]
  );

  return result.rows.map(mapTaxProfile);
}

export async function GET() {
  try {
    const customer = await getOptionalAuthenticatedCustomer();

    if (!customer) {
      return NextResponse.json(
        { authenticated: false, orders: [], taxProfiles: [] },
        { status: 401 }
      );
    }

    const [ordersResult, taxProfiles] = await Promise.all([
      pool.query(
        `
          SELECT
            orders.id,
            orders.order_number,
            orders.customer_id,
            orders.total_cents,
            orders.currency,
            orders.payment_method,
            orders.created_at,
            customers.full_name,
            customers.email
          FROM orders
          JOIN customers ON customers.id = orders.customer_id
          WHERE orders.customer_id = $1
            AND orders.status <> 'cancelled'
            AND orders.payment_status = 'paid'
          ORDER BY orders.created_at DESC
        `,
        [customer.customerId]
      ),
      getTaxProfiles(customer.customerId),
    ]);

    return NextResponse.json({
      authenticated: true,
      customer: {
        id: customer.customerId,
        fullName: customer.fullName,
        email: customer.email,
      },
      orders: ordersResult.rows.map(mapOrder),
      taxProfiles,
    });
  } catch (error) {
    console.error(
      "Invoice account lookup error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos cargar tus pedidos para facturación." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderNumber = cleanText(body.orderNumber).toUpperCase();
    const purchaseEmail = normalizeEmail(body.purchaseEmail);

    if (!orderNumber || !isValidEmail(purchaseEmail)) {
      return NextResponse.json(
        { error: "Ingresa tu número de pedido y email de compra." },
        { status: 400 }
      );
    }

    const orderResult = await pool.query(
      `
        SELECT
          orders.id,
          orders.order_number,
          orders.customer_id,
          orders.total_cents,
          orders.currency,
          orders.payment_method,
          orders.payment_status,
          orders.status,
          orders.created_at,
          customers.full_name,
          customers.email
        FROM orders
        JOIN customers ON customers.id = orders.customer_id
        WHERE UPPER(orders.order_number) = $1
          AND LOWER(customers.email) = LOWER($2)
        LIMIT 1
      `,
      [orderNumber, purchaseEmail]
    );

    const order = orderResult.rows[0];

    if (!order) {
      return NextResponse.json(
        {
          error:
            "No encontramos una compra elegible con esos datos. Revisa el número y el email.",
        },
        { status: 404 }
      );
    }

    if (order.status === "cancelled" || order.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Este pedido aún no está confirmado para facturación." },
        { status: 409 }
      );
    }

    const customer = await getOptionalAuthenticatedCustomer();

    if (customer && String(order.customer_id) !== customer.customerId) {
      return NextResponse.json(
        {
          error:
            "No encontramos una compra elegible con esos datos. Revisa el número y el email.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: mapOrder(order),
      authenticated: Boolean(customer),
      taxProfiles: customer ? await getTaxProfiles(customer.customerId) : [],
    });
  } catch (error) {
    console.error(
      "Invoice validation error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos validar la compra." },
      { status: 500 }
    );
  }
}
