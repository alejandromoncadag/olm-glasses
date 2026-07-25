import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";
import { pool } from "@/lib/db";
import {
  cleanText,
  isValidEmail,
  normalizeEmail,
  validateFiscalData,
} from "@/lib/invoiceRequests";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";

export const runtime = "nodejs";

function generateRequestNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `FAC-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function mapInvoiceRequest(invoiceRequest: Record<string, unknown>) {
  return {
    id: String(invoiceRequest.id),
    requestNumber: String(invoiceRequest.request_number),
    orderNumber: String(invoiceRequest.order_number),
    customerId: invoiceRequest.customer_id
      ? String(invoiceRequest.customer_id)
      : null,
    customerName: String(invoiceRequest.customer_name || ""),
    purchaseEmail: String(invoiceRequest.purchase_email || ""),
    rfc: String(invoiceRequest.rfc),
    taxName: String(invoiceRequest.tax_name),
    fiscalPostalCode: String(invoiceRequest.fiscal_postal_code),
    taxRegime: String(invoiceRequest.tax_regime),
    cfdiUse: String(invoiceRequest.cfdi_use),
    invoiceEmail: String(invoiceRequest.invoice_email),
    paymentMethod: String(invoiceRequest.payment_method),
    orderTotal: Number(invoiceRequest.order_total_cents) / 100,
    orderTotalCents: Number(invoiceRequest.order_total_cents),
    status: String(invoiceRequest.status),
    adminNotes: invoiceRequest.admin_notes
      ? String(invoiceRequest.admin_notes)
      : "",
    rejectionReason: invoiceRequest.rejection_reason
      ? String(invoiceRequest.rejection_reason)
      : "",
    xmlUrl: invoiceRequest.xml_url ? String(invoiceRequest.xml_url) : "",
    pdfUrl: invoiceRequest.pdf_url ? String(invoiceRequest.pdf_url) : "",
    orderDate: invoiceRequest.order_date,
    createdAt: invoiceRequest.created_at,
    updatedAt: invoiceRequest.updated_at,
  };
}

export async function GET() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) return unauthorizedAdminResponse();

  try {
    const result = await pool.query(`
      SELECT
        invoice_requests.*
      FROM invoice_requests
      ORDER BY invoice_requests.created_at DESC
    `);

    return NextResponse.json({
      invoiceRequests: result.rows.map(mapInvoiceRequest),
    });
  } catch (error) {
    console.error(
      "Admin invoice request list error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos cargar las solicitudes de factura." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const customer = await getOptionalAuthenticatedCustomer();
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const body = await request.json();
    const orderNumber = cleanText(body.orderNumber).toUpperCase();
    const purchaseEmail = normalizeEmail(body.purchaseEmail);
    const taxProfileId = cleanText(body.customerTaxProfileId) || null;
    const saveTaxProfile = Boolean(body.saveTaxProfile);
    const makeDefault = Boolean(body.isDefault);
    const { error: fiscalError, fiscalData } = validateFiscalData(body);

    if (!orderNumber || !isValidEmail(purchaseEmail)) {
      return NextResponse.json(
        { error: "Ingresa tu número de pedido y email de compra." },
        { status: 400 }
      );
    }

    if (fiscalError) {
      return NextResponse.json({ error: fiscalError }, { status: 400 });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const orderResult = await client.query(
      `
        SELECT
          orders.id,
          orders.order_number,
          orders.customer_id,
          orders.total_cents,
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
        FOR SHARE OF orders, customers
      `,
      [orderNumber, purchaseEmail]
    );

    const order = orderResult.rows[0];

    if (
      !order ||
      (customer && String(order.customer_id) !== customer.customerId)
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return NextResponse.json(
        {
          error:
            "No encontramos una compra elegible con esos datos. Vuelve al paso anterior.",
        },
        { status: 404 }
      );
    }

    if (order.status === "cancelled" || order.payment_status !== "paid") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return NextResponse.json(
        { error: "Este pedido aún no está confirmado para facturación." },
        { status: 409 }
      );
    }

    const existingRequestResult = await client.query(
      `
        SELECT request_number, status
        FROM invoice_requests
        WHERE order_id = $1
          AND status IN ('pending', 'issued')
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [order.id]
    );

    if (existingRequestResult.rows.length > 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      const existingRequest = existingRequestResult.rows[0];

      return NextResponse.json(
        {
          error:
            existingRequest.status === "issued"
              ? "Este pedido ya tiene una factura emitida."
              : "Ya existe una solicitud pendiente para este pedido.",
          requestNumber: existingRequest.request_number,
          status: existingRequest.status,
        },
        { status: 409 }
      );
    }

    let customerTaxProfileId: string | null = null;

    if (taxProfileId) {
      if (!customer) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return NextResponse.json(
          { error: "Inicia sesión para reutilizar un perfil fiscal." },
          { status: 401 }
        );
      }

      const profileResult = await client.query(
        `
          SELECT id
          FROM customer_tax_profiles
          WHERE id = $1 AND customer_id = $2
          LIMIT 1
        `,
        [taxProfileId, customer.customerId]
      );

      if (profileResult.rows.length === 0) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return NextResponse.json(
          { error: "El perfil fiscal seleccionado ya no está disponible." },
          { status: 404 }
        );
      }

      customerTaxProfileId = String(profileResult.rows[0].id);
    }

    if (saveTaxProfile && customer) {
      const defaultResult = await client.query(
        `
          SELECT EXISTS(
            SELECT 1
            FROM customer_tax_profiles
            WHERE customer_id = $1 AND is_default = TRUE
          ) AS exists
        `,
        [customer.customerId]
      );
      const shouldBeDefault = makeDefault || !defaultResult.rows[0].exists;

      if (shouldBeDefault) {
        await client.query(
          `
            UPDATE customer_tax_profiles
            SET is_default = FALSE
            WHERE customer_id = $1
          `,
          [customer.customerId]
        );
      }

      if (customerTaxProfileId) {
        const updatedProfileResult = await client.query(
          `
            UPDATE customer_tax_profiles
            SET
              rfc = $3,
              tax_name = $4,
              fiscal_postal_code = $5,
              tax_regime = $6,
              cfdi_use = $7,
              invoice_email = $8,
              is_default = $9
            WHERE id = $1 AND customer_id = $2
            RETURNING id
          `,
          [
            customerTaxProfileId,
            customer.customerId,
            fiscalData.rfc,
            fiscalData.taxName,
            fiscalData.fiscalPostalCode,
            fiscalData.taxRegime,
            fiscalData.cfdiUse,
            fiscalData.invoiceEmail,
            shouldBeDefault,
          ]
        );

        customerTaxProfileId = String(updatedProfileResult.rows[0].id);
      } else {
        const insertedProfileResult = await client.query(
          `
            INSERT INTO customer_tax_profiles (
              customer_id,
              rfc,
              tax_name,
              fiscal_postal_code,
              tax_regime,
              cfdi_use,
              invoice_email,
              is_default
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `,
          [
            customer.customerId,
            fiscalData.rfc,
            fiscalData.taxName,
            fiscalData.fiscalPostalCode,
            fiscalData.taxRegime,
            fiscalData.cfdiUse,
            fiscalData.invoiceEmail,
            shouldBeDefault,
          ]
        );

        customerTaxProfileId = String(insertedProfileResult.rows[0].id);
      }
    }

    const insertedRequestResult = await client.query(
      `
        INSERT INTO invoice_requests (
          request_number,
          order_id,
          order_number,
          customer_name,
          purchase_email,
          order_date,
          customer_id,
          customer_tax_profile_id,
          rfc,
          tax_name,
          fiscal_postal_code,
          tax_regime,
          cfdi_use,
          invoice_email,
          payment_method,
          order_total_cents,
          status
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending'
        )
        RETURNING *
      `,
      [
        generateRequestNumber(),
        order.id,
        order.order_number,
        order.full_name,
        order.email,
        order.created_at,
        order.customer_id,
        customerTaxProfileId,
        fiscalData.rfc,
        fiscalData.taxName,
        fiscalData.fiscalPostalCode,
        fiscalData.taxRegime,
        fiscalData.cfdiUse,
        fiscalData.invoiceEmail,
        order.payment_method,
        order.total_cents,
      ]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return NextResponse.json(
      {
        invoiceRequest: mapInvoiceRequest(insertedRequestResult.rows[0]),
        message:
          "Recibimos tu solicitud. El equipo de Óptica OLM revisará los datos antes de emitir la factura.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK");

    console.error(
      "Invoice request creation error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos guardar la solicitud de factura." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
