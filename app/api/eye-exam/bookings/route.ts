import {
  createHash,
  randomBytes,
} from "node:crypto";
import type { PoolClient } from "pg";
import { NextResponse } from "next/server";
import {
  eyeExamTimeSlots,
  getEyeExamServiceById,
} from "@/data/eyeExamServices";
import { getLocationBySlug } from "@/data/locations";
import {
  queueAppointmentEmail,
  type AppointmentEmailBooking,
} from "@/lib/appointmentEmails";
import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";
import { pool } from "@/lib/db";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";

export const runtime = "nodejs";

type PatientAgeGroup = "adult" | "child";

type ValidatedBookingInput = {
  locationSlug: string;
  locationName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  patientAgeGroup: PatientAgeGroup;
  dateOfBirth: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  patientDetails: Record<string, never>;
  notes: string | null;
  reschedule: {
    bookingNumber: string;
    manageTokenHash: string;
  } | null;
};

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

type BookingRow = {
  id: string;
  customer_id: string | null;
  booking_number: string;
  location_slug: string;
  location_name: string;
  service_name: string;
  appointment_date: string | Date;
  appointment_time: string;
  duration_minutes: number;
  patient_age_group: PatientAgeGroup | null;
  date_of_birth: string | null;
  patient_details: Record<string, unknown> | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  status: BookingStatus;
  manage_token_hash: string | null;
  google_calendar_event_id: string | null;
  created_at: Date;
  updated_at: Date;
};

type PostgresError = {
  code?: string;
  constraint?: string;
};

class EyeExamBookingError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "EyeExamBookingError";
    this.status = status;
  }
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const parsedDate = new Date(`${date}T12:00:00.000Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
}

function getAge(dateOfBirth: string) {
  const birthDate = new Date(`${dateOfBirth}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());

  if (beforeBirthday) age -= 1;
  return age;
}

function hashManageToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function validateBookingInput(body: unknown): ValidatedBookingInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new EyeExamBookingError("Los datos de la cita no son válidos.");
  }

  const input = body as Record<string, unknown>;
  const locationSlug = cleanText(input.locationSlug);
  const appointmentDate = cleanText(input.appointmentDate);
  const appointmentTime = cleanText(input.appointmentTime);
  const patientAgeGroup = cleanText(input.patientAgeGroup) as PatientAgeGroup;
  const dateOfBirth = cleanText(input.dateOfBirth);
  const customerName = cleanText(input.customerName);
  const customerEmail = cleanText(input.customerEmail).toLowerCase();
  const customerPhone = cleanText(input.customerPhone);
  const notes = cleanText(input.notes) || null;
  const location = getLocationBySlug(locationSlug);
  const service = getEyeExamServiceById(
    patientAgeGroup === "child" ? "kids" : "full"
  );
  if (
    !location ||
    !service ||
    !appointmentDate ||
    !appointmentTime ||
    !customerName ||
    !customerEmail ||
    !customerPhone ||
    !dateOfBirth
  ) {
    throw new EyeExamBookingError("Completa todos los campos requeridos.");
  }

  if (patientAgeGroup !== "adult" && patientAgeGroup !== "child") {
    throw new EyeExamBookingError("Selecciona para quién es la consulta.");
  }

  if (!isValidDate(dateOfBirth)) {
    throw new EyeExamBookingError("Ingresa una fecha de nacimiento válida.");
  }

  const age = getAge(dateOfBirth);

  if (
    (patientAgeGroup === "adult" && age < 18) ||
    (patientAgeGroup === "child" && (age < 2 || age > 17))
  ) {
    throw new EyeExamBookingError(
      patientAgeGroup === "adult"
        ? "La opción adulto requiere una edad de 18 años o más."
        : "La consulta infantil es para pacientes de 2 a 17 años."
    );
  }

  if (!isValidDate(appointmentDate)) {
    throw new EyeExamBookingError("Selecciona una fecha válida.");
  }

  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (appointmentDate < localToday) {
    throw new EyeExamBookingError("La fecha seleccionada ya pasó.");
  }

  if (!eyeExamTimeSlots.includes(appointmentTime)) {
    throw new EyeExamBookingError("Selecciona una hora válida.");
  }

  if (!isValidEmail(customerEmail)) {
    throw new EyeExamBookingError("Ingresa un correo electrónico válido.");
  }

  if (!/^\+\d{8,15}$/.test(customerPhone)) {
    throw new EyeExamBookingError(
      "Ingresa un teléfono válido con código de país."
    );
  }

  if (customerName.length > 150 || customerPhone.length > 50) {
    throw new EyeExamBookingError("Revisa el nombre y teléfono ingresados.");
  }

  if (customerEmail.length > 254 || (notes && notes.length > 1000)) {
    throw new EyeExamBookingError("Uno de los campos es demasiado largo.");
  }

  const rescheduleInput =
    input.reschedule &&
    typeof input.reschedule === "object" &&
    !Array.isArray(input.reschedule)
      ? (input.reschedule as Record<string, unknown>)
      : null;
  const rescheduleBookingNumber = cleanText(rescheduleInput?.bookingNumber);
  const rescheduleManageToken = cleanText(rescheduleInput?.manageToken);

  return {
    locationSlug: location.slug,
    locationName: location.name,
    serviceName: service.label,
    appointmentDate,
    appointmentTime,
    durationMinutes: 45,
    patientAgeGroup,
    dateOfBirth,
    customerName,
    customerEmail,
    customerPhone,
    patientDetails: {},
    notes,
    reschedule:
      rescheduleBookingNumber && rescheduleManageToken
        ? {
            bookingNumber: rescheduleBookingNumber,
            manageTokenHash: hashManageToken(rescheduleManageToken),
          }
        : null,
  };
}

function generateBookingNumber() {
  return `EX-${randomBytes(8).toString("hex").toUpperCase()}`;
}

function generateManageToken() {
  return randomBytes(32).toString("base64url");
}

function getPostgresError(error: unknown) {
  return error && typeof error === "object" ? (error as PostgresError) : null;
}

function serializeDate(value: string | Date) {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : value.slice(0, 10);
}

async function insertBooking(
  client: PoolClient,
  input: ValidatedBookingInput,
  customerId: string | null,
  manageTokenHash: string,
  rescheduledFromBookingId: string | null
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const bookingNumber = generateBookingNumber();

    try {
      const result = await client.query<BookingRow>(
        `
          INSERT INTO eye_exam_bookings (
            customer_id,
            booking_number,
            location_slug,
            location_name,
            service_name,
            appointment_date,
            appointment_time,
            duration_minutes,
            patient_age_group,
            date_of_birth,
            patient_details,
            customer_name,
            customer_email,
            customer_phone,
            notes,
            status,
            manage_token_hash,
            rescheduled_from_booking_id
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11::JSONB, $12, $13, $14, $15, 'confirmed', $16, $17
          )
          RETURNING *;
        `,
        [
          customerId,
          bookingNumber,
          input.locationSlug,
          input.locationName,
          input.serviceName,
          input.appointmentDate,
          input.appointmentTime,
          input.durationMinutes,
          input.patientAgeGroup,
          input.dateOfBirth,
          JSON.stringify(input.patientDetails),
          input.customerName,
          input.customerEmail,
          input.customerPhone,
          input.notes,
          manageTokenHash,
          rescheduledFromBookingId,
        ]
      );

      return result.rows[0];
    } catch (error) {
      const postgresError = getPostgresError(error);

      if (
        postgresError?.code === "23505" &&
        postgresError.constraint ===
          "eye_exam_bookings_booking_number_key"
      ) {
        continue;
      }

      if (
        postgresError?.code === "23505" &&
        postgresError.constraint === "idx_eye_exam_bookings_active_slot"
      ) {
        throw new EyeExamBookingError(
          "Ese horario ya no está disponible. Elige otro horario.",
          409
        );
      }

      throw error;
    }
  }

  throw new Error("Could not generate a unique eye exam booking number");
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
    googleCalendarEventId: booking.google_calendar_event_id,
    createdAt: booking.created_at,
    updatedAt: booking.updated_at,
  };
}

function toEmailBooking(
  booking: BookingRow,
  manageToken?: string
): AppointmentEmailBooking {
  const location = getLocationBySlug(booking.location_slug);

  return {
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
    manageToken,
  };
}

export async function GET() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) return unauthorizedAdminResponse();

  try {
    const result = await pool.query<BookingRow>(`
      SELECT *
      FROM eye_exam_bookings
      ORDER BY appointment_date ASC, appointment_time ASC, created_at ASC;
    `);

    return NextResponse.json({
      bookings: result.rows.map(serializeBooking),
    });
  } catch (error) {
    console.error("Error fetching eye exam bookings:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las citas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no contiene JSON válido." },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    const validatedInput = validateBookingInput(body);
    const authenticatedCustomer = await getOptionalAuthenticatedCustomer();
    const input = authenticatedCustomer
      ? {
          ...validatedInput,
          customerEmail: authenticatedCustomer.email,
        }
      : validatedInput;
    const manageToken = generateManageToken();
    const manageTokenHash = hashManageToken(manageToken);
    let previousBooking: BookingRow | null = null;

    await client.query("BEGIN");

    if (input.reschedule) {
      const previousResult = await client.query<BookingRow>(
        `
          SELECT *
          FROM eye_exam_bookings
          WHERE booking_number = $1
            AND manage_token_hash = $2
          FOR UPDATE;
        `,
        [
          input.reschedule.bookingNumber,
          input.reschedule.manageTokenHash,
        ]
      );
      previousBooking = previousResult.rows[0] || null;

      if (!previousBooking) {
        throw new EyeExamBookingError(
          "No pudimos validar la cita que quieres reagendar.",
          403
        );
      }

      if (
        previousBooking.status !== "confirmed" &&
        previousBooking.status !== "pending"
      ) {
        throw new EyeExamBookingError(
          "Esta cita ya no se puede reagendar.",
          409
        );
      }

      await client.query(
        `
          UPDATE eye_exam_bookings
          SET
            status = 'cancelled',
            cancellation_reason = 'Reagendada por el cliente',
            cancelled_at = NOW()
          WHERE id = $1;
        `,
        [previousBooking.id]
      );
    }

    const booking = await insertBooking(
      client,
      input,
      authenticatedCustomer?.customerId ||
        previousBooking?.customer_id ||
        null,
      manageTokenHash,
      previousBooking?.id || null
    );

    await client.query("COMMIT");

    const baseUrl = new URL(request.url).origin;
    const emailNotifications: string[] = [];

    if (previousBooking) {
      try {
        await queueAppointmentEmail({
          type: "cancellation",
          booking: toEmailBooking(previousBooking),
          baseUrl,
        });
        emailNotifications.push("cancellation_queued");
      } catch (error) {
        console.error("Could not queue cancellation email:", error);
        emailNotifications.push("cancellation_failed");
      }
    }

    try {
      await queueAppointmentEmail({
        type: previousBooking
          ? "reschedule_confirmation"
          : "confirmation",
        booking: toEmailBooking(booking, manageToken),
        baseUrl,
      });
      emailNotifications.push(
        previousBooking ? "reschedule_confirmation_queued" : "confirmation_queued"
      );
    } catch (error) {
      console.error("Could not queue appointment confirmation email:", error);
      emailNotifications.push("confirmation_failed");
    }

    return NextResponse.json(
      {
        booking: serializeBooking(booking),
        manageToken,
        emailNotifications,
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);

    if (error instanceof EyeExamBookingError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Error creating eye exam booking:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la cita. Intenta de nuevo." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
