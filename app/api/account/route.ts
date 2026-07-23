import { NextResponse } from "next/server";

import { isClerkConfigured } from "@/lib/clerkConfig";
import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

function unavailableResponse() {
  if (!isClerkConfigured()) {
    return NextResponse.json(
      { error: "El acceso de clientes todavía no está configurado." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "Inicia sesión para ver tu cuenta." },
    { status: 401 }
  );
}

export async function GET() {
  try {
    const customer = await getOptionalAuthenticatedCustomer();

    if (!customer) return unavailableResponse();

    const [countsResult, ordersResult, bookingsResult, addressResult] =
      await Promise.all([
        pool.query(
          `
            SELECT
              (SELECT COUNT(*)::int FROM orders WHERE customer_id = $1) AS orders_count,
              (
                SELECT COUNT(*)::int
                FROM customer_favorites
                WHERE customer_id = $1
              ) AS favorites_count,
              (
                SELECT COUNT(*)::int
                FROM eye_exam_bookings
                WHERE customer_id = $1
                   OR (
                     customer_id IS NULL
                     AND LOWER(customer_email) = LOWER($2)
                   )
              ) AS bookings_count
          `,
          [customer.customerId, customer.email]
        ),
        pool.query(
          `
            SELECT
              orders.order_number,
              orders.status,
              orders.payment_status,
              orders.payment_method,
              orders.delivery_method,
              orders.total_cents,
              orders.currency,
              orders.tracking_number,
              orders.created_at,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'name', order_items.product_name,
                    'slug', order_items.product_slug,
                    'quantity', order_items.quantity
                  )
                  ORDER BY order_items.created_at
                ) FILTER (WHERE order_items.id IS NOT NULL),
                '[]'::json
              ) AS items
            FROM orders
            LEFT JOIN order_items ON order_items.order_id = orders.id
            WHERE orders.customer_id = $1
            GROUP BY orders.id
            ORDER BY orders.created_at DESC
            LIMIT 10
          `,
          [customer.customerId]
        ),
        pool.query(
          `
            SELECT
              booking_number,
              location_slug,
              location_name,
              service_name,
              appointment_date,
              appointment_time,
              status
            FROM eye_exam_bookings
            WHERE (
              customer_id = $1
              OR (
                customer_id IS NULL
                AND LOWER(customer_email) = LOWER($2)
              )
            )
              AND status <> 'cancelled'
            ORDER BY appointment_date DESC, appointment_time DESC
            LIMIT 10
          `,
          [customer.customerId, customer.email]
        ),
        pool.query(
          `
            SELECT
              id,
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
            FROM customer_addresses
            WHERE customer_id = $1
            ORDER BY is_default DESC, created_at DESC
          `,
          [customer.customerId]
        ),
      ]);

    const counts = countsResult.rows[0];

    return NextResponse.json({
      profile: {
        id: customer.customerId,
        authUserId: customer.authUserId,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        avatarUrl: customer.avatarUrl,
      },
      counts: {
        orders: Number(counts.orders_count),
        favorites: Number(counts.favorites_count),
        bookings: Number(counts.bookings_count),
      },
      orders: ordersResult.rows.map((order) => ({
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        deliveryMethod: order.delivery_method,
        total: Number(order.total_cents) / 100,
        currency: order.currency,
        trackingNumber: order.tracking_number,
        createdAt: order.created_at,
        items: order.items,
      })),
      bookings: bookingsResult.rows.map((booking) => ({
        bookingNumber: booking.booking_number,
        locationSlug: booking.location_slug,
        locationName: booking.location_name,
        serviceName: booking.service_name,
        appointmentDate: booking.appointment_date,
        appointmentTime: booking.appointment_time,
        status: booking.status,
      })),
      addresses: addressResult.rows.map((address) => ({
        id: address.id,
        label: address.label,
        recipientName: address.recipient_name,
        phone: address.phone,
        addressLine1: address.address_line_1,
        addressLine2: address.address_line_2,
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
        country: address.country,
        isDefault: address.is_default,
      })),
    });
  } catch (error) {
    console.error(
      "Customer account error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos cargar tu cuenta." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const customer = await getOptionalAuthenticatedCustomer();

    if (!customer) return unavailableResponse();

    const body = await request.json();
    const phone = String(body.phone || "").trim();

    if (phone.length > 40) {
      return NextResponse.json(
        { error: "El teléfono es demasiado largo." },
        { status: 400 }
      );
    }

    await pool.query(
      `
        UPDATE customers
        SET phone = $2
        WHERE id = $1
      `,
      [customer.customerId, phone]
    );

    return NextResponse.json({ success: true, phone });
  } catch (error) {
    console.error(
      "Customer profile update error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos actualizar tus datos." },
      { status: 500 }
    );
  }
}
