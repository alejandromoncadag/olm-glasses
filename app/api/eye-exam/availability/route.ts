import { NextResponse } from "next/server";
import { eyeExamTimeSlots } from "@/data/eyeExamServices";
import { getLocationBySlug } from "@/data/locations";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T12:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locationSlug = url.searchParams.get("location")?.trim() || "";
  const appointmentDate = url.searchParams.get("date")?.trim() || "";
  const location = getLocationBySlug(locationSlug);

  if (!location || !isValidDate(appointmentDate)) {
    return NextResponse.json(
      { error: "Selecciona una sucursal y fecha válidas." },
      { status: 400 }
    );
  }

  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (appointmentDate < localToday) {
    return NextResponse.json(
      { error: "La fecha seleccionada ya pasó." },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query<{ appointment_time: string }>(
      `
        SELECT appointment_time
        FROM eye_exam_bookings
        WHERE location_slug = $1
          AND appointment_date = $2
          AND status IN ('pending', 'confirmed');
      `,
      [location.slug, appointmentDate]
    );
    const occupied = new Set(result.rows.map((row) => row.appointment_time));
    const nowMinutes = today.getHours() * 60 + today.getMinutes();

    return NextResponse.json({
      locationSlug: location.slug,
      appointmentDate,
      durationMinutes: 45,
      slots: eyeExamTimeSlots.map((time) => {
        const [hours, minutes] = time.split(":").map(Number);
        const timeHasPassed =
          appointmentDate === localToday &&
          hours * 60 + minutes <= nowMinutes;

        return {
          time,
          available: !occupied.has(time) && !timeHasPassed,
        };
      }),
    });
  } catch (error) {
    console.error("Error loading eye exam availability:", error);
    return NextResponse.json(
      { error: "No se pudo consultar la disponibilidad." },
      { status: 500 }
    );
  }
}
