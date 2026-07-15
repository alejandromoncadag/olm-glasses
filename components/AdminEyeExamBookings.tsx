"use client";

import { useEffect, useMemo, useState } from "react";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

type EyeExamBooking = {
  id: string;
  bookingNumber: string;
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
  status: BookingStatus;
  googleCalendarEventId: string | null;
  createdAt: string;
  updatedAt: string;
};

type BookingApiResponse = {
  bookings?: EyeExamBooking[];
  booking?: EyeExamBooking;
  error?: string;
};

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "completed", label: "Completada" },
];

function getStatusLabel(status: BookingStatus) {
  return (
    statusOptions.find((option) => option.value === status)?.label || status
  );
}

function getStatusClassName(status: BookingStatus) {
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "confirmed") return "bg-blue-100 text-blue-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  if (status === "completed") return "bg-green-100 text-green-700";

  return "bg-gray-100 text-gray-700";
}

function formatAppointmentDate(date: string) {
  const normalizedDate = date.slice(0, 10);
  const parsedDate = new Date(`${normalizedDate}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function requestBookings() {
  const response = await fetch("/api/eye-exam/bookings");
  const data = (await response.json()) as BookingApiResponse;

  if (!response.ok) {
    throw new Error(data.error || "No se pudieron cargar las citas.");
  }

  return Array.isArray(data.bookings) ? data.bookings : [];
}

export default function AdminEyeExamBookings() {
  const [bookings, setBookings] = useState<EyeExamBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>(
    "all"
  );
  const [loading, setLoading] = useState(true);
  const [savingBookingNumber, setSavingBookingNumber] = useState("");
  const [error, setError] = useState("");

  async function fetchBookings() {
    try {
      setLoading(true);
      setError("");

      setBookings(await requestBookings());
    } catch (error) {
      console.error(error);
      setError(getErrorMessage(error, "No se pudieron cargar las citas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    requestBookings()
      .then((loadedBookings) => {
        if (isActive) {
          setBookings(loadedBookings);
        }
      })
      .catch((error) => {
        console.error(error);

        if (isActive) {
          setError(getErrorMessage(error, "No se pudieron cargar las citas."));
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function updateBookingStatus(
    bookingNumber: string,
    status: BookingStatus
  ) {
    try {
      setSavingBookingNumber(bookingNumber);
      setError("");

      const response = await fetch(
        `/api/eye-exam/bookings/${encodeURIComponent(bookingNumber)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );
      const data = (await response.json()) as BookingApiResponse;

      if (!response.ok || !data.booking) {
        throw new Error(data.error || "No se pudo actualizar la cita.");
      }

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.bookingNumber === bookingNumber ? data.booking! : booking
        )
      );
    } catch (error) {
      console.error(error);
      setError(getErrorMessage(error, "No se pudo actualizar la cita."));
    } finally {
      setSavingBookingNumber("");
    }
  }

  const locationOptions = useMemo(
    () =>
      Array.from(
        new Map(
          bookings.map((booking) => [
            booking.locationSlug,
            booking.locationName,
          ])
        ).entries()
      ).sort((left, right) => left[1].localeCompare(right[1], "es")),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesLocation =
        locationFilter === "all" || booking.locationSlug === locationFilter;
      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;
      const searchableText = [
        booking.bookingNumber,
        booking.customerName,
        booking.customerEmail,
        booking.customerPhone,
        booking.locationName,
        booking.locationSlug,
        booking.serviceName,
        booking.notes,
        booking.status,
        getStatusLabel(booking.status),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        normalizedSearchTerm === "" ||
        searchableText.includes(normalizedSearchTerm);

      return matchesLocation && matchesStatus && matchesSearch;
    });
  }, [bookings, locationFilter, searchTerm, statusFilter]);

  const pendingCount = bookings.filter(
    (booking) => booking.status === "pending"
  ).length;
  const confirmedCount = bookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;
  const completedCount = bookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  return (
    <div>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
          {bookings.length === 0 && (
            <button
              type="button"
              onClick={fetchBookings}
              className="mt-3 rounded-full bg-black px-5 py-2 text-sm text-white"
            >
              Intentar de nuevo
            </button>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-600">Citas totales</p>
          <p className="mt-2 text-3xl font-bold">{bookings.length}</p>
        </div>
        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="mt-2 text-3xl font-bold text-yellow-700">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-600">Confirmadas</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {confirmedCount}
          </p>
        </div>
        <div className="rounded-2xl border p-5">
          <p className="text-sm text-gray-600">Completadas</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {completedCount}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 rounded-2xl border bg-gray-50 p-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <label className="text-sm font-medium" htmlFor="booking-search">
            Buscar
          </label>
          <input
            id="booking-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nombre, teléfono, correo o folio"
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="location-filter">
            Tienda
          </label>
          <select
            id="location-filter"
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-black"
          >
            <option value="all">Todas las tiendas</option>
            {locationOptions.map(([slug, name]) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="status-filter">
            Estado
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | BookingStatus)
            }
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-black"
          >
            <option value="all">Todos los estados</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-5 text-sm text-gray-600">
        Mostrando {filteredBookings.length} de {bookings.length} citas.
      </p>

      {loading ? (
        <div className="mt-8 rounded-2xl border p-8 text-center text-gray-600">
          Cargando citas desde PostgreSQL...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border p-8 text-center text-gray-600">
          No hay citas que coincidan con los filtros.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Folio</th>
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Tienda</th>
                  <th className="px-5 py-4">Servicio</th>
                  <th className="px-5 py-4">Fecha y hora</th>
                  <th className="px-5 py-4">Notas</th>
                  <th className="px-5 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBookings.map((booking) => {
                  const isSaving =
                    savingBookingNumber === booking.bookingNumber;

                  return (
                    <tr key={booking.id} className="align-top">
                      <td className="px-5 py-5">
                        <p className="font-semibold">{booking.bookingNumber}</p>
                      </td>
                      <td className="px-5 py-5">
                        <p className="font-semibold">{booking.customerName}</p>
                        <a
                          href={`mailto:${booking.customerEmail}`}
                          className="mt-1 block text-gray-600 underline"
                        >
                          {booking.customerEmail}
                        </a>
                        <a
                          href={`tel:${booking.customerPhone.replace(/\s/g, "")}`}
                          className="mt-1 block text-gray-600 underline"
                        >
                          {booking.customerPhone}
                        </a>
                      </td>
                      <td className="px-5 py-5">
                        <p className="font-medium">{booking.locationName}</p>
                        <p className="mt-1 text-gray-500">
                          {booking.locationSlug}
                        </p>
                      </td>
                      <td className="px-5 py-5">
                        <p className="font-medium">{booking.serviceName}</p>
                        <p className="mt-1 text-gray-500">
                          {booking.durationMinutes} minutos
                        </p>
                      </td>
                      <td className="px-5 py-5">
                        <p className="font-medium">
                          {formatAppointmentDate(booking.appointmentDate)}
                        </p>
                        <p className="mt-1 text-gray-600">
                          {booking.appointmentTime}
                        </p>
                      </td>
                      <td className="max-w-xs px-5 py-5 text-gray-600">
                        <p className="whitespace-pre-wrap">
                          {booking.notes?.trim() || "Sin notas"}
                        </p>
                      </td>
                      <td className="px-5 py-5">
                        <select
                          aria-label={`Estado de ${booking.bookingNumber}`}
                          value={booking.status}
                          disabled={isSaving}
                          onChange={(event) =>
                            void updateBookingStatus(
                              booking.bookingNumber,
                              event.target.value as BookingStatus
                            )
                          }
                          className={`rounded-full border-0 px-3 py-2 text-sm font-medium outline-none ${getStatusClassName(
                            booking.status
                          )} disabled:cursor-wait disabled:opacity-60`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {isSaving && (
                          <p className="mt-2 text-xs text-gray-500">
                            Guardando...
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
