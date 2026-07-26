import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getLocationBySlug } from "@/data/locations";
import { queueAppointmentEmail } from "@/lib/appointmentEmails";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

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
  appointment_date: string | Date;
  appointment_time: string;
  duration_minutes: number;
  patient_age_group: "adult" | "child" | null;
  date_of_birth: string | null;
  patient_details: Record<string, unknown> | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: Date;
};

function hashManageToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function serializeDate(value: string | Date) {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : value.slice(0, 10);
}

function serializeBooking(booking: BookingRow) {
  return {
    id: booking.id,
    bookingNumber: booking.booking_number,
    locationSlug: booking.location_slug,
    locationName: booking.location_name,
    serviceName: booking.service_name,
    appointmentDate: serializeDate(booking.appointment_date),
    appointmentTime: booking.appointment_time,
    durationMinutes: booking.duration_minutes,
    patientAgeGroup: booking.patient_age_group,
    dateOfBirth: booking.date_of_birth,
    patientDetails: booking.patient_details || {},
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone,
    notes: booking.notes,
    status: booking.status,
    createdAt: booking.created_at,
  };
}

async function findManagedBooking(bookingNumber: string, manageToken: string) {
  if (!bookingNumber || !manageToken || bookingNumber.length > 100) return null;

  const result = await pool.query<BookingRow>(
    `
      SELECT *
      FROM eye_exam_bookings
      WHERE booking_number = $1
        AND manage_token_hash = $2;
    `,
    [bookingNumber, hashManageToken(manageToken)]
  );

  return result.rows[0] || null;
}

export async function GET(request: Request, context: RouteContext) {
  const { bookingNumber } = await context.params;
  const manageToken = new URL(request.url).searchParams.get("token")?.trim() || "";

  try {
    const booking = await findManagedBooking(bookingNumber, manageToken);

    if (!booking) {
      return NextResponse.json(
        { error: "No pudimos validar esta cita." },
        { status: 403 }
      );
    }

    return NextResponse.json({ booking: serializeBooking(booking) });
  } catch (error) {
    console.error("Error loading managed eye exam booking:", error);
    return NextResponse.json(
      { error: "No se pudo cargar la cita." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { bookingNumber } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "La solicitud no contiene JSON válido." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "La solicitud no es válida." },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;
  const action = typeof input.action === "string" ? input.action : "";
  const manageToken =
    typeof input.manageToken === "string" ? input.manageToken.trim() : "";

  if (action !== "cancel" || !manageToken) {
    return NextResponse.json(
      { error: "La acción solicitada no es válida." },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query<BookingRow>(
      `
        UPDATE eye_exam_bookings
        SET
          status = 'cancelled',
          cancellation_reason = 'Cancelada por el cliente',
          cancelled_at = NOW()
        WHERE booking_number = $1
          AND manage_token_hash = $2
          AND status IN ('pending', 'confirmed')
        RETURNING *;
      `,
      [bookingNumber, hashManageToken(manageToken)]
    );
    const booking = result.rows[0];

    if (!booking) {
      const existing = await findManagedBooking(bookingNumber, manageToken);

      return NextResponse.json(
        {
          error: existing
            ? "Esta cita ya no se puede cancelar."
            : "No pudimos validar esta cita.",
        },
        { status: existing ? 409 : 403 }
      );
    }

    const location = getLocationBySlug(booking.location_slug);
    let emailNotification = "cancellation_queued";

    try {
      await queueAppointmentEmail({
        type: "cancellation",
        baseUrl: new URL(request.url).origin,
        booking: {
          id: booking.id,
          bookingNumber: booking.booking_number,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          locationName: booking.location_name,
          locationAddress: location
            ? `${location.address}, ${location.city}, ${location.state}, C.P. ${location.zipCode}`
            : booking.location_name,
          appointmentDate: serializeDate(booking.appointment_date),
          appointmentTime: booking.appointment_time,
          durationMinutes: booking.duration_minutes,
          timeZone: location?.timezone || "America/Mexico_City",
        },
      });
    } catch (error) {
      console.error("Could not queue appointment cancellation email:", error);
      emailNotification = "cancellation_failed";
    }

    return NextResponse.json({
      booking: serializeBooking(booking),
      emailNotification,
    });
  } catch (error) {
    console.error("Error cancelling eye exam booking:", error);
    return NextResponse.json(
      { error: "No se pudo cancelar la cita." },
      { status: 500 }
    );
  }
}
