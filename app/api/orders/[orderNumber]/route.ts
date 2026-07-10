import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    orderNumber: string;
  }>;
};

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

type UpdateOrderInput = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  adminNotes?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  customerVisibleNotes?: string;
};

const allowedOrderStatuses: OrderStatus[] = [
  "pending",
  "processing",
  "completed",
  "cancelled",
];

const allowedPaymentStatuses: PaymentStatus[] = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
];

function hasField(object: object, field: string) {
  return Object.prototype.hasOwnProperty.call(object, field);
}

function cleanNullableText(value: string | undefined) {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  try {
    const { orderNumber } = await context.params;

    const orderResult = await pool.query(
      `
      SELECT
        orders.id,
        orders.order_number,
        orders.status,
        orders.customer_id,
        orders.payment_status,
        orders.payment_method,
        orders.delivery_method,
        orders.subtotal_cents,
        orders.shipping_cents,
        orders.total_cents,
        orders.currency,
        orders.customer_notes,
        orders.admin_notes,
        orders.shipping_carrier,
        orders.tracking_number,
        orders.customer_visible_notes,
        orders.created_at,
        orders.updated_at,
        customers.full_name,
        customers.email,
        customers.phone,
        customers.address,
        customers.city,
        customers.state,
        customers.zip_code,
        customers.country
      FROM orders
      JOIN customers ON customers.id = orders.customer_id
      WHERE orders.order_number = $1
      LIMIT 1;
      `,
      [orderNumber]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `
      SELECT
        id,
        product_id,
        product_name,
        product_slug,
        unit_price_cents,
        quantity,
        lens_option,
        prescription_method,
        created_at
      FROM order_items
      WHERE order_id = $1
      ORDER BY created_at ASC;
      `,
      [order.id]
    );

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        deliveryMethod: order.delivery_method,
        subtotal: order.subtotal_cents / 100,
        subtotalCents: order.subtotal_cents,
        shipping: order.shipping_cents / 100,
        shippingCents: order.shipping_cents,
        total: order.total_cents / 100,
        totalCents: order.total_cents,
        currency: order.currency,
        customerNotes: order.customer_notes,
        adminNotes: order.admin_notes,
        shippingCarrier: order.shipping_carrier,
        trackingNumber: order.tracking_number,
        customerVisibleNotes: order.customer_visible_notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        customer: {
          id: order.customer_id,
          fullName: order.full_name,
          email: order.email,
          phone: order.phone,
          address: order.address,
          city: order.city,
          state: order.state,
          zipCode: order.zip_code,
          country: order.country,
        },
        items: itemsResult.rows.map((item) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          productSlug: item.product_slug,
          unitPrice: item.unit_price_cents / 100,
          unitPriceCents: item.unit_price_cents,
          quantity: item.quantity,
          lineTotal: (item.unit_price_cents * item.quantity) / 100,
          lensOption: item.lens_option,
          prescriptionMethod: item.prescription_method,
          createdAt: item.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);

    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  try {
    const { orderNumber } = await context.params;
    const body = (await request.json()) as UpdateOrderInput;

    if (body.status && !allowedOrderStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 }
      );
    }

    if (
      body.paymentStatus &&
      !allowedPaymentStatuses.includes(body.paymentStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid payment status" },
        { status: 400 }
      );
    }

    const hasAdminNotes = hasField(body, "adminNotes");
    const hasShippingCarrier = hasField(body, "shippingCarrier");
    const hasTrackingNumber = hasField(body, "trackingNumber");
    const hasCustomerVisibleNotes = hasField(body, "customerVisibleNotes");

    const adminNotes = cleanNullableText(body.adminNotes);
    const shippingCarrier = cleanNullableText(body.shippingCarrier);
    const trackingNumber = cleanNullableText(body.trackingNumber);
    const customerVisibleNotes = cleanNullableText(body.customerVisibleNotes);

    const result = await pool.query(
      `
      UPDATE orders
      SET
        status = COALESCE($1::order_status, status),
        payment_status = COALESCE($2::payment_status, payment_status),
        admin_notes = CASE WHEN $3::boolean THEN $4::text ELSE admin_notes END,
        shipping_carrier = CASE WHEN $5::boolean THEN $6::text ELSE shipping_carrier END,
        tracking_number = CASE WHEN $7::boolean THEN $8::text ELSE tracking_number END,
        customer_visible_notes = CASE WHEN $9::boolean THEN $10::text ELSE customer_visible_notes END,
        updated_at = now()
      WHERE order_number = $11
      RETURNING
        id,
        order_number,
        status,
        payment_status,
        payment_method,
        delivery_method,
        subtotal_cents,
        shipping_cents,
        total_cents,
        currency,
        customer_notes,
        admin_notes,
        shipping_carrier,
        tracking_number,
        customer_visible_notes,
        created_at,
        updated_at;
      `,
      [
        body.status || null,
        body.paymentStatus || null,
        hasAdminNotes,
        adminNotes,
        hasShippingCarrier,
        shippingCarrier,
        hasTrackingNumber,
        trackingNumber,
        hasCustomerVisibleNotes,
        customerVisibleNotes,
        orderNumber,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = result.rows[0];

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        deliveryMethod: order.delivery_method,
        subtotal: order.subtotal_cents / 100,
        shipping: order.shipping_cents / 100,
        total: order.total_cents / 100,
        currency: order.currency,
        customerNotes: order.customer_notes,
        adminNotes: order.admin_notes,
        shippingCarrier: order.shipping_carrier,
        trackingNumber: order.tracking_number,
        customerVisibleNotes: order.customer_visible_notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating order:", error);

    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}


