import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";

export const runtime = "nodejs";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

type RouteContext = {
  params: Promise<{
    bookingNumber: string;
  }>;
};

type BookingRow = {
  id: string;
  booking_number: string;
  location_slug: string;
  location_name: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  status: BookingStatus;
  google_calendar_event_id: string | null;
  created_at: Date;
  updated_at: Date;
};

type PostgresError = {
  code?: string;
  constraint?: string;
};

const allowedStatuses: BookingStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

function isBookingStatus(value: unknown): value is BookingStatus {
  return (
    typeof value === "string" &&
    allowedStatuses.includes(value as BookingStatus)
  );
}

function serializeBooking(booking: BookingRow) {
  return {
    id: booking.id,
    bookingNumber: booking.booking_number,
    locationSlug: booking.location_slug,
    locationName: booking.location_name,
    serviceName: booking.service_name,
    appointmentDate: booking.appointment_date,
    appointmentTime: booking.appointment_time,
    durationMinutes: booking.duration_minutes,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone,
    notes: booking.notes,
    status: booking.status,
    googleCalendarEventId: booking.google_calendar_event_id,
    createdAt: booking.created_at,
    updatedAt: booking.updated_at,
  };
}

function getPostgresError(error: unknown) {
  return error && typeof error === "object" ? (error as PostgresError) : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no contiene JSON válido." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Los datos de actualización no son válidos." },
      { status: 400 }
    );
  }

  const status = (body as Record<string, unknown>).status;

  if (!isBookingStatus(status)) {
    return NextResponse.json(
      { error: "Selecciona un estado válido." },
      { status: 400 }
    );
  }

  const { bookingNumber } = await context.params;

  if (!bookingNumber || bookingNumber.length > 100) {
    return NextResponse.json(
      { error: "El folio de la cita no es válido." },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query<BookingRow>(
      `
      UPDATE eye_exam_bookings
      SET status = $1
      WHERE booking_number = $2
      RETURNING
        id,
        booking_number,
        location_slug,
        location_name,
        service_name,
        appointment_date,
        appointment_time,
        duration_minutes,
        customer_name,
        customer_email,
        customer_phone,
        notes,
        status,
        google_calendar_event_id,
        created_at,
        updated_at;
      `,
      [status, bookingNumber]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No encontramos esa cita." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      booking: serializeBooking(result.rows[0]),
    });
  } catch (error) {
    const postgresError = getPostgresError(error);

    if (
      postgresError?.code === "23505" &&
      postgresError.constraint === "idx_eye_exam_bookings_active_slot"
    ) {
      return NextResponse.json(
        { error: "Ese horario ya está ocupado por otra cita activa." },
        { status: 409 }
      );
    }

    console.error("Error updating eye exam booking:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar la cita." },
      { status: 500 }
    );
  }
}
