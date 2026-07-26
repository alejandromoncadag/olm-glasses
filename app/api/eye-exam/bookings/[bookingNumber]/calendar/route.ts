import { createHash } from "node:crypto";
import { getLocationBySlug } from "@/data/locations";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type CalendarBookingRow = {
  booking_number: string;
  location_slug: string;
  location_name: string;
  appointment_date: string | Date;
  appointment_time: string;
  duration_minutes: number;
  status: string;
};

function hashManageToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function serializeDate(value: string | Date) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function escapeIcs(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function formatLocalCalendarDate(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    "T",
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
    "00",
  ].join("");
}

function foldIcsLine(line: string) {
  if (line.length <= 73) return line;

  const pieces: string[] = [];
  let remaining = line;
  while (remaining.length > 73) {
    pieces.push(remaining.slice(0, 73));
    remaining = remaining.slice(73);
  }
  pieces.push(remaining);
  return pieces.join("\r\n ");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ bookingNumber: string }> }
) {
  const { bookingNumber } = await context.params;
  const manageToken = new URL(request.url).searchParams.get("token")?.trim();

  if (!bookingNumber || !manageToken) {
    return new Response("No se pudo validar la cita.", { status: 400 });
  }

  const result = await pool.query<CalendarBookingRow>(
    `
      SELECT
        booking_number,
        location_slug,
        location_name,
        appointment_date,
        appointment_time,
        duration_minutes,
        status
      FROM eye_exam_bookings
      WHERE booking_number = $1
        AND manage_token_hash = $2
      LIMIT 1;
    `,
    [bookingNumber, hashManageToken(manageToken)]
  );
  const booking = result.rows[0];

  if (!booking) {
    return new Response("No se pudo validar la cita.", { status: 404 });
  }

  if (booking.status === "cancelled") {
    return new Response("Esta cita fue cancelada.", { status: 409 });
  }

  const location = getLocationBySlug(booking.location_slug);
  const appointmentDate = serializeDate(booking.appointment_date);
  const start = new Date(
    `${appointmentDate}T${booking.appointment_time}:00.000Z`
  );
  const end = new Date(
    start.getTime() + Number(booking.duration_minutes || 45) * 60_000
  );
  const timeZone = location?.timezone || "America/Mexico_City";
  const locationAddress = location
    ? `${location.address}, ${location.city}, ${location.state}, C.P. ${location.zipCode}`
    : booking.location_name;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Optica OLM//Citas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(booking.booking_number)}@opticaolm.mx`,
    `DTSTAMP:${formatLocalCalendarDate(new Date())}Z`,
    `DTSTART;TZID=${timeZone}:${formatLocalCalendarDate(start)}`,
    `DTEND;TZID=${timeZone}:${formatLocalCalendarDate(end)}`,
    "SUMMARY:Examen de la vista · Óptica OLM",
    `LOCATION:${escapeIcs(locationAddress)}`,
    `DESCRIPTION:${escapeIcs(
      `Cita ${booking.booking_number} en ${booking.location_name}.`
    )}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const body = `${lines.map(foldIcsLine).join("\r\n")}\r\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="cita-${booking.booking_number}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
