"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { locations, type Location } from "@/data/locations";
import { getCurrentUser } from "@/lib/auth";

type Service = {
  id: string;
  label: string;
  duration: string;
  price: string;
};

type ContactInfo = {
  fullName: string;
  email: string;
  phone: string;
};

const services: Service[] = [
  {
    id: "full",
    label: "Examen completo de la vista",
    duration: "30 min",
    price: "$400 MXN",
  },
  {
    id: "full-styling",
    label: "Examen + asesoría de armazón",
    duration: "45 min",
    price: "$400 MXN",
  },
  {
    id: "kids",
    label: "Examen para niños",
    duration: "30 min",
    price: "$350 MXN",
  },
];

const timeSlots = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

function nextSevenDays() {
  const days = [];
  const today = new Date();
  for (let i = 1; i <= 7; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  return days;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

type Step = 1 | 2 | 3 | 4 | 5;

export default function EyeExamBooking() {
  const searchParams = useSearchParams();
  const presetLocation = searchParams.get("location");

  const initialLocation =
    locations.find((location) => location.slug === presetLocation) ??
    locations[0];

  const [step, setStep] = useState<Step>(1);
  const [location, setLocation] = useState<Location>(initialLocation);
  const [service, setService] = useState<Service>(services[0]);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactInfo>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [confirmed, setConfirmed] = useState<{
    id: string;
    dateLabel: string;
  } | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setContact((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName,
        email: prev.email || user.email,
      }));
    }
  }, []);

  const days = useMemo(() => nextSevenDays(), []);

  function goTo(target: Step) {
    setStep(target);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleConfirm() {
    if (!date || !time) return;

    const id = `EX-${Date.now()}`;
    const dateLabel = formatDateLong(date);

    const booking = {
      id,
      locationSlug: location.slug,
      locationName: location.name,
      date: dateLabel,
      time,
      service: service.label,
      fullName: contact.fullName,
      email: contact.email,
      phone: contact.phone,
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(
      localStorage.getItem("olm-eye-exam-bookings") || "[]"
    );
    localStorage.setItem(
      "olm-eye-exam-bookings",
      JSON.stringify([booking, ...existing])
    );

    setConfirmed({ id, dateLabel });
    goTo(5);
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border bg-white p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="mt-6 text-3xl font-bold">¡Cita agendada!</h2>

        <p className="mt-3 text-gray-600">
          Te enviamos los detalles a {contact.email}.
        </p>

        <div className="mt-8 grid gap-3 rounded-2xl bg-[#f7f3ee] p-6 text-left text-gray-700">
          <p>
            <strong>Folio:</strong> {confirmed.id}
          </p>
          <p>
            <strong>Servicio:</strong> {service.label}
          </p>
          <p>
            <strong>Tienda:</strong> {location.name}
          </p>
          <p>
            <strong>Día:</strong> {confirmed.dateLabel}
          </p>
          <p>
            <strong>Hora:</strong> {time}
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <a
            href="/account"
            className="rounded-full bg-black px-6 py-3 text-white"
          >
            Ver mis citas
          </a>
          <a
            href="/eyeglasses"
            className="rounded-full border border-black px-6 py-3"
          >
            Seguir viendo lentes
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-10 flex items-center justify-between text-xs uppercase tracking-widest text-gray-500">
        {[
          { step: 1, label: "Tienda" },
          { step: 2, label: "Servicio" },
          { step: 3, label: "Día y hora" },
          { step: 4, label: "Contacto" },
        ].map((item) => (
          <li
            key={item.step}
            className={`flex flex-1 items-center gap-2 ${
              step >= item.step ? "text-black" : ""
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                step >= item.step
                  ? "bg-black text-white"
                  : "border border-gray-300"
              }`}
            >
              {item.step}
            </span>
            <span className="hidden sm:inline">{item.label}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="rounded-3xl border bg-white p-8">
          <h2 className="text-2xl font-semibold">Elige tu tienda</h2>
          <p className="mt-2 text-gray-600">
            Selecciona dónde quieres hacer tu examen.
          </p>

          <div className="mt-6 grid gap-4">
            {locations.map((entry) => (
              <button
                key={entry.slug}
                onClick={() => setLocation(entry)}
                className={`rounded-2xl border p-5 text-left transition ${
                  location.slug === entry.slug
                    ? "border-black bg-gray-50"
                    : "hover:border-black"
                }`}
              >
                <p className="font-semibold">{entry.name}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {entry.address}, {entry.city}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => goTo(2)}
              className="rounded-full bg-black px-6 py-3 text-white"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-3xl border bg-white p-8">
          <h2 className="text-2xl font-semibold">Elige tu servicio</h2>
          <p className="mt-2 text-gray-600">
            ¿Qué tipo de examen necesitas?
          </p>

          <div className="mt-6 grid gap-3">
            {services.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setService(entry)}
                className={`rounded-2xl border p-5 text-left transition ${
                  service.id === entry.id
                    ? "border-black bg-gray-50"
                    : "hover:border-black"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{entry.label}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {entry.duration}
                    </p>
                  </div>
                  <p className="font-semibold">{entry.price}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => goTo(1)}
              className="rounded-full border border-black px-6 py-3"
            >
              Atrás
            </button>
            <button
              onClick={() => goTo(3)}
              className="rounded-full bg-black px-6 py-3 text-white"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-3xl border bg-white p-8">
          <h2 className="text-2xl font-semibold">Elige día y hora</h2>
          <p className="mt-2 text-gray-600">
            Disponibilidad en los próximos 7 días.
          </p>

          <div className="mt-6">
            <p className="text-sm font-medium">Día</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {days.map((day) => {
                const selected =
                  date && day.toDateString() === date.toDateString();
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setDate(day)}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      selected
                        ? "border-black bg-black text-white"
                        : "hover:border-black"
                    }`}
                  >
                    {formatDate(day)}
                  </button>
                );
              })}
            </div>
          </div>

          {date && (
            <div className="mt-8">
              <p className="text-sm font-medium">Hora</p>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      time === slot
                        ? "border-black bg-black text-white"
                        : "hover:border-black"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between">
            <button
              onClick={() => goTo(2)}
              className="rounded-full border border-black px-6 py-3"
            >
              Atrás
            </button>
            <button
              onClick={() => goTo(4)}
              disabled={!date || !time}
              className="rounded-full bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-3xl border bg-white p-8">
          <h2 className="text-2xl font-semibold">Tus datos</h2>
          <p className="mt-2 text-gray-600">
            Para enviarte el recordatorio de tu cita.
          </p>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-medium">Nombre completo</label>
              <input
                value={contact.fullName}
                onChange={(event) =>
                  setContact((prev) => ({
                    ...prev,
                    fullName: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="Alejandro Moncada"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Correo electrónico</label>
              <input
                type="email"
                value={contact.email}
                onChange={(event) =>
                  setContact((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="correo@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <input
                value={contact.phone}
                onChange={(event) =>
                  setContact((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="55 1234 5678"
              />
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-[#f7f3ee] p-5 text-sm text-gray-700">
            <p className="font-semibold">Resumen</p>
            <p className="mt-2">{service.label}</p>
            <p>{location.name}</p>
            <p>
              {date ? formatDateLong(date) : ""} · {time}
            </p>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => goTo(3)}
              className="rounded-full border border-black px-6 py-3"
            >
              Atrás
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                !contact.fullName.trim() ||
                !contact.email.includes("@") ||
                !contact.phone.trim()
              }
              className="rounded-full bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Confirmar cita
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
