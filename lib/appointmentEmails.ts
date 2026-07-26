import { pool } from "@/lib/db";

export type AppointmentEmailType =
  | "confirmation"
  | "cancellation"
  | "reschedule_confirmation";

export type AppointmentEmailBooking = {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  locationName: string;
  locationAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  timeZone: string;
  manageToken?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAppointmentDate(date: string) {
  const dateOnly = date.slice(0, 10);

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${dateOnly}T12:00:00.000Z`));
}

function formatCalendarDate(date: Date) {
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

function getCalendarRange(booking: AppointmentEmailBooking) {
  const start = new Date(
    `${booking.appointmentDate.slice(0, 10)}T${booking.appointmentTime}:00.000Z`
  );
  const end = new Date(start.getTime() + booking.durationMinutes * 60_000);

  return {
    start: formatCalendarDate(start),
    end: formatCalendarDate(end),
  };
}

function buildGoogleCalendarUrl(booking: AppointmentEmailBooking) {
  const range = getCalendarRange(booking);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Examen de la vista · Óptica OLM",
    dates: `${range.start}/${range.end}`,
    ctz: booking.timeZone,
    location: booking.locationAddress,
    details: `Cita ${booking.bookingNumber} en ${booking.locationName}.`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildEmail(
  type: AppointmentEmailType,
  booking: AppointmentEmailBooking,
  baseUrl: string
) {
  const isCancellation = type === "cancellation";
  const subject = isCancellation
    ? `Cita cancelada · ${booking.bookingNumber}`
    : type === "reschedule_confirmation"
      ? `Nueva cita confirmada · ${booking.bookingNumber}`
      : `Cita confirmada · ${booking.bookingNumber}`;
  const heading = isCancellation
    ? "Tu examen de la vista fue cancelado"
    : type === "reschedule_confirmation"
      ? "Tu nueva cita está confirmada"
      : "Tu examen de la vista está confirmado";
  const managementUrl = booking.manageToken
    ? `${baseUrl}/eye-exam/book?manage=${encodeURIComponent(
        booking.bookingNumber
      )}&token=${encodeURIComponent(booking.manageToken)}`
    : `${baseUrl}/eye-exam/book`;
  const googleCalendarUrl =
    !isCancellation && booking.manageToken
      ? buildGoogleCalendarUrl(booking)
      : "";
  const outlookCalendarUrl =
    !isCancellation && booking.manageToken
      ? `${baseUrl}/api/eye-exam/bookings/${encodeURIComponent(
          booking.bookingNumber
        )}/calendar?token=${encodeURIComponent(booking.manageToken)}`
      : "";
  const dateLabel = formatAppointmentDate(booking.appointmentDate);
  const details = [
    `Folio: ${booking.bookingNumber}`,
    `Fecha: ${dateLabel}`,
    `Hora: ${booking.appointmentTime}`,
    `Duración: ${booking.durationMinutes} minutos`,
    `Sucursal: ${booking.locationName}`,
    `Dirección: ${booking.locationAddress}`,
  ];
  const text = [
    `Hola ${booking.customerName},`,
    "",
    heading,
    "",
    ...details,
    "",
    isCancellation
      ? "Si necesitas una nueva cita, puedes comenzar desde el sitio de Óptica OLM."
      : `Administra tu cita: ${managementUrl}`,
    ...(!isCancellation && booking.manageToken
      ? [
          "",
          `Agregar a Google Calendar: ${googleCalendarUrl}`,
          `Agregar a Outlook: ${outlookCalendarUrl}`,
        ]
      : []),
  ].join("\n");
  const detailHtml = details
    .map((detail) => `<li style="margin:8px 0">${escapeHtml(detail)}</li>`)
    .join("");
  const actionUrl = isCancellation
    ? `${baseUrl}/eye-exam/book`
    : managementUrl;
  const actionLabel = isCancellation
    ? "Agendar otra cita"
    : "Administrar mi cita";
  const calendarActions =
    !isCancellation && booking.manageToken
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 0">
          <tr>
            <td style="padding:0 10px 10px 0">
              <a href="${escapeHtml(
                googleCalendarUrl
              )}" style="display:inline-block;border-radius:999px;border:1px solid #38251d;color:#38251d;padding:11px 18px;text-decoration:none;font-weight:600">Agregar a Google Calendar</a>
            </td>
            <td style="padding:0 0 10px">
              <a href="${escapeHtml(
                outlookCalendarUrl
              )}" style="display:inline-block;border-radius:999px;border:1px solid #38251d;color:#38251d;padding:11px 18px;text-decoration:none;font-weight:600">Agregar a Outlook</a>
            </td>
          </tr>
        </table>
      `
      : "";
  const html = `
    <div style="background:#f7f3ee;padding:32px 16px">
      <div style="font-family:Arial,sans-serif;color:#171717;line-height:1.55;max-width:620px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden">
        <div style="background:#38251d;color:#fff;padding:24px 32px;text-align:center">
          <p style="letter-spacing:.28em;text-transform:uppercase;font-size:14px;font-weight:700;margin:0">ÓPTICA OLM</p>
        </div>
        <div style="padding:32px">
          <p style="color:#76675f;letter-spacing:.16em;text-transform:uppercase;font-size:11px;font-weight:700;margin:0">Examen de la vista</p>
          <h1 style="font-size:28px;margin:10px 0 8px">${escapeHtml(heading)}</h1>
          <p>Hola ${escapeHtml(booking.customerName)},</p>
          <p>${isCancellation ? "La cita indicada abajo fue cancelada." : "Tu espacio quedó reservado. Aquí tienes todos los detalles:"}</p>
          <div style="background:#f7f3ee;border-radius:16px;padding:16px 22px;margin:24px 0">
            <ul style="padding-left:20px;margin:0">${detailHtml}</ul>
          </div>
          <a href="${escapeHtml(
            actionUrl
          )}" style="display:inline-block;border-radius:999px;background:#38251d;color:#fff;padding:12px 20px;text-decoration:none;font-weight:600">${actionLabel}</a>
          ${calendarActions}
          <p style="margin-top:28px;color:#666;font-size:13px">Conserva este correo para consultar los datos de tu cita. Si necesitas hacer un cambio, usa el botón para administrar la cita.</p>
        </div>
      </div>
    </div>
  `;

  return { subject, html, text };
}

export async function queueAppointmentEmail({
  type,
  booking,
  baseUrl,
}: {
  type: AppointmentEmailType;
  booking: AppointmentEmailBooking;
  baseUrl: string;
}) {
  const message = buildEmail(type, booking, baseUrl);
  const queued = await pool.query<{ id: string }>(
    `
      INSERT INTO appointment_email_outbox (
        booking_id,
        recipient_email,
        email_type,
        subject,
        html_body,
        text_body
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `,
    [
      booking.id,
      booking.customerEmail,
      type,
      message.subject,
      message.html,
      message.text,
    ]
  );

  return {
    status: "queued" as const,
    outboxId: queued.rows[0].id,
  };
}
