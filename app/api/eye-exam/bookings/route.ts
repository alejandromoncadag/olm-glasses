import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  eyeExamTimeSlots,
  getEyeExamServiceById,
} from "@/data/eyeExamServices";
import { getLocationBySlug } from "@/data/locations";
import { pool } from "@/lib/db";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";
import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";

export const runtime = "nodejs";

type ValidatedBookingInput = {
  locationSlug: string;
  locationName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string | null;
};

type BookingRow = {
  id: string;
  booking_number: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: Date;
};

type AdminBookingRow = BookingRow & {
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
  google_calendar_event_id: string | null;
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
}

function validateBookingInput(body: unknown): ValidatedBookingInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new EyeExamBookingError("Los datos de la cita no son válidos.");
  }

  const input = body as Record<string, unknown>;
  const locationSlug = cleanText(input.locationSlug);
  const serviceId = cleanText(input.serviceId);
  const appointmentDate = cleanText(input.appointmentDate);
  const appointmentTime = cleanText(input.appointmentTime);
  const customerName = cleanText(input.customerName);
  const customerEmail = cleanText(input.customerEmail).toLowerCase();
  const customerPhone = cleanText(input.customerPhone);
  const notes = cleanText(input.notes) || null;

  if (
    !locationSlug ||
    !serviceId ||
    !appointmentDate ||
    !appointmentTime ||
    !customerName ||
    !customerEmail ||
    !customerPhone
  ) {
    throw new EyeExamBookingError("Completa todos los campos requeridos.");
  }

  const location = getLocationBySlug(locationSlug);

  if (!location) {
    throw new EyeExamBookingError("Selecciona una tienda válida.");
  }

  const service = getEyeExamServiceById(serviceId);

  if (!service) {
    throw new EyeExamBookingError("Selecciona un servicio válido.");
  }

  if (!isValidDate(appointmentDate)) {
    throw new EyeExamBookingError("Selecciona una fecha válida.");
  }

  if (!eyeExamTimeSlots.includes(appointmentTime)) {
    throw new EyeExamBookingError("Selecciona una hora válida.");
  }

  if (!isValidEmail(customerEmail)) {
    throw new EyeExamBookingError("Ingresa un correo electrónico válido.");
  }

  if (customerName.length > 150) {
    throw new EyeExamBookingError("El nombre es demasiado largo.");
  }

  if (customerEmail.length > 254) {
    throw new EyeExamBookingError("El correo electrónico es demasiado largo.");
  }

  if (customerPhone.length > 50) {
    throw new EyeExamBookingError("El teléfono es demasiado largo.");
  }

  if (notes && notes.length > 1000) {
    throw new EyeExamBookingError("Las notas son demasiado largas.");
  }

  return {
    locationSlug: location.slug,
    locationName: location.name,
    serviceName: service.label,
    appointmentDate,
    appointmentTime,
    durationMinutes: service.durationMinutes,
    customerName,
    customerEmail,
    customerPhone,
    notes,
  };
}

function generateBookingNumber() {
  return `EX-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function getPostgresError(error: unknown) {
  return error && typeof error === "object" ? (error as PostgresError) : null;
}

async function insertBooking(
  input: ValidatedBookingInput,
  customerId: string | null
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const bookingNumber = generateBookingNumber();

    try {
      const result = await pool.query<BookingRow>(
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
          customer_name,
          customer_email,
          customer_phone,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, booking_number, status, created_at;
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
          input.customerName,
          input.customerEmail,
          input.customerPhone,
          input.notes,
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

function serializeAdminBooking(booking: AdminBookingRow) {
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

export async function GET() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return unauthorizedAdminResponse();
  }

  try {
    const result = await pool.query<AdminBookingRow>(`
      SELECT
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
        updated_at
      FROM eye_exam_bookings
      ORDER BY appointment_date ASC, appointment_time ASC, created_at ASC;
    `);

    return NextResponse.json({
      bookings: result.rows.map(serializeAdminBooking),
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

  try {
    const validatedInput = validateBookingInput(body);
    const authenticatedCustomer = await getOptionalAuthenticatedCustomer();
    const input = authenticatedCustomer
      ? {
          ...validatedInput,
          customerName: authenticatedCustomer.fullName,
          customerEmail: authenticatedCustomer.email,
        }
      : validatedInput;
    const booking = await insertBooking(
      input,
      authenticatedCustomer?.customerId || null
    );

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          bookingNumber: booking.booking_number,
          locationSlug: input.locationSlug,
          locationName: input.locationName,
          serviceName: input.serviceName,
          appointmentDate: input.appointmentDate,
          appointmentTime: input.appointmentTime,
          durationMinutes: input.durationMinutes,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          notes: input.notes,
          status: booking.status,
          googleCalendarEventId: null,
          createdAt: booking.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
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
  }
}
