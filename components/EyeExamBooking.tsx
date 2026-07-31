"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { locations, type Location } from "@/data/locations";
import { useAuth } from "@/hooks/useAuth";
import { formatAppointmentTime } from "@/lib/formatAppointmentTime";

type Step = 1 | 2 | 3 | 4;
type PatientAgeGroup = "adult" | "child";
type DayPeriod = "morning" | "afternoon" | "evening";
type AppointmentAction = "reschedule" | "cancel";

type PatientInfo = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  notes: string;
};

type Booking = {
  id: string;
  bookingNumber: string;
  locationSlug: string;
  locationName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  patientAgeGroup: PatientAgeGroup;
  dateOfBirth: string;
  patientDetails: Record<string, unknown>;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
};

type BookingResponse = {
  booking?: Booking;
  manageToken?: string;
  emailNotifications?: string[];
  emailNotification?: string;
  error?: string;
};

type AvailabilityResponse = {
  slots?: Array<{
    time: string;
    available: boolean;
  }>;
  error?: string;
};

const initialPatientInfo: PatientInfo = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  notes: "",
};

const stepLabels: Array<{ step: Step; label: string }> = [
  { step: 1, label: "Paciente" },
  { step: 2, label: "Sucursal" },
  { step: 3, label: "Fecha y hora" },
  { step: 4, label: "Tus datos" },
];

const weekdayLabels = ["D", "L", "M", "M", "J", "V", "S"];
const monthLabels = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const phoneCountries = [
  {
    code: "+52",
    country: "México",
    shortLabel: "MX",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "984 177 6838",
  },
  {
    code: "+1",
    country: "Estados Unidos / Canadá",
    shortLabel: "US/CA",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "305 555 0123",
  },
  {
    code: "+34",
    country: "España",
    shortLabel: "ES",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "612 345 678",
  },
  {
    code: "+57",
    country: "Colombia",
    shortLabel: "CO",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "300 123 4567",
  },
  {
    code: "+54",
    country: "Argentina",
    shortLabel: "AR",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "11 2345 6789",
  },
  {
    code: "+55",
    country: "Brasil",
    shortLabel: "BR",
    minDigits: 10,
    maxDigits: 11,
    placeholder: "11 91234 5678",
  },
  {
    code: "+44",
    country: "Reino Unido",
    shortLabel: "UK",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "7700 900123",
  },
] as const;
const dayPeriods: Array<{
  id: DayPeriod;
  label: string;
  range: string;
  startMinutes: number;
  endMinutes: number;
}> = [
  {
    id: "morning",
    label: "Mañana",
    range: "8:00 a.m. – 12:00 p.m.",
    startMinutes: 8 * 60,
    endMinutes: 12 * 60,
  },
  {
    id: "afternoon",
    label: "Tarde",
    range: "12:00 p.m. – 4:00 p.m.",
    startMinutes: 12 * 60,
    endMinutes: 16 * 60,
  },
  {
    id: "evening",
    label: "Noche",
    range: "4:00 p.m. – 8:00 p.m.",
    startMinutes: 16 * 60,
    endMinutes: 20 * 60,
  },
];

function getDayPeriodForTime(time: string): DayPeriod {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;

  return (
    dayPeriods.find(
      (period) =>
        totalMinutes >= period.startMinutes &&
        totalMinutes < period.endMinutes
    )?.id || "evening"
  );
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, amount: number) {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

function getCalendarDays(month: Date) {
  const firstWeekday = month.getDay();
  const totalDays = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();
  const cells: Array<Date | null> = Array(firstWeekday).fill(null);

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatDateForApi(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateInput(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function birthDateYearsAgo(years: number, addDays = 0) {
  const today = new Date();
  const result = new Date(
    today.getFullYear() - years,
    today.getMonth(),
    today.getDate() + addDays
  );
  return formatDateInput(result);
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function splitStoredPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const matchedCountry = [...phoneCountries]
    .sort(
      (first, second) =>
        second.code.replace(/\D/g, "").length -
        first.code.replace(/\D/g, "").length
    )
    .find((entry) => digits.startsWith(entry.code.replace(/\D/g, "")));

  if (!matchedCountry) {
    return { countryCode: "+52", nationalNumber: digits };
  }

  return {
    countryCode: matchedCountry.code,
    nationalNumber: digits.slice(matchedCountry.code.replace(/\D/g, "").length),
  };
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getLocationSearchText(location: Location) {
  return normalizeSearch(
    [
      location.name,
      location.neighborhood,
      location.address,
      location.city,
      location.state,
      location.zipCode,
      location.country,
    ].join(" ")
  );
}

function ChoiceCard({
  selected,
  title,
  copy,
  illustration,
  onClick,
}: {
  selected: boolean;
  title: string;
  copy: string;
  illustration: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group min-h-72 overflow-hidden rounded-[1.75rem] border p-4 text-left transition ${
        selected
          ? "border-[var(--brand-espresso)] bg-[#f7f3ee] shadow-sm"
          : "border-black/10 bg-white hover:border-[var(--brand-espresso)] hover:bg-[#f7f3ee]"
      }`}
    >
      <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-[#f7f3ee]">
        {illustration}
      </div>
      <div className="px-2 pb-2">
        <h3 className="mt-5 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-gray-600">{copy}</p>
      </div>
    </button>
  );
}

export default function EyeExamBooking() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const presetLocation = searchParams.get("location");
  const manageBookingNumber = searchParams.get("manage");
  const manageTokenFromUrl = searchParams.get("token");
  const initialLocation =
    locations.find((entry) => entry.slug === presetLocation) || null;
  const isLocationPreset = Boolean(initialLocation);
  const currentMonth = useMemo(() => startOfMonth(new Date()), []);
  const bookingYears = useMemo(
    () =>
      Array.from(
        { length: 6 },
        (_, index) => currentMonth.getFullYear() + index
      ),
    [currentMonth]
  );
  const [step, setStep] = useState<Step>(1);
  const [patientAgeGroup, setPatientAgeGroup] =
    useState<PatientAgeGroup | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [location, setLocation] = useState<Location | null>(initialLocation);
  const [calendarMonth, setCalendarMonth] = useState(currentMonth);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [selectedDayPeriod, setSelectedDayPeriod] =
    useState<DayPeriod>("morning");
  const [slots, setSlots] = useState<
    Array<{ time: string; available: boolean }>
  >([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [patientInfo, setPatientInfo] =
    useState<PatientInfo>(initialPatientInfo);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+52");
  const [confirmedBooking, setConfirmedBooking] =
    useState<Booking | null>(null);
  const [manageToken, setManageToken] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [loadingManagedBooking, setLoadingManagedBooking] = useState(
    Boolean(manageBookingNumber && manageTokenFromUrl)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [pendingAppointmentAction, setPendingAppointmentAction] =
    useState<AppointmentAction | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const visibleSteps = isLocationPreset
    ? stepLabels.filter((entry) => entry.step !== 2)
    : stepLabels;
  const currentVisibleStepIndex = Math.max(
    visibleSteps.findIndex((entry) => entry.step === step),
    0
  );
  const selectedPhoneCountry =
    phoneCountries.find((entry) => entry.code === phoneCountryCode) ||
    phoneCountries[0];

  const filteredLocations = useMemo(() => {
    const query = normalizeSearch(locationSearch);
    if (!query) return locations;

    return locations.filter((entry) =>
      getLocationSearchText(entry).includes(query)
    );
  }, [locationSearch]);
  const calendarDays = useMemo(
    () => getCalendarDays(calendarMonth),
    [calendarMonth]
  );

  useEffect(() => {
    if (!user) return;

    const timeoutId = window.setTimeout(() => {
      setPatientInfo((current) => ({
        ...current,
        fullName: current.fullName || user.fullName,
        email: current.email || user.email,
      }));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [user]);

  useEffect(() => {
    if (!manageBookingNumber || !manageTokenFromUrl) {
      return;
    }

    let active = true;
    const bookingNumber = manageBookingNumber;
    const token = manageTokenFromUrl;

    async function loadManagedBooking() {
      try {
        setLoadingManagedBooking(true);
        setError("");
        const response = await fetch(
          `/api/eye-exam/bookings/${encodeURIComponent(
            bookingNumber
          )}/manage?token=${encodeURIComponent(token)}`
        );
        const result = (await response
          .json()
          .catch(() => ({}))) as BookingResponse;

        if (!response.ok || !result.booking) {
          throw new Error(result.error || "No pudimos cargar esta cita.");
        }

        if (active) {
          setConfirmedBooking(result.booking);
          setManageToken(token);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No pudimos cargar esta cita."
          );
        }
      } finally {
        if (active) setLoadingManagedBooking(false);
      }
    }

    loadManagedBooking();

    return () => {
      active = false;
    };
  }, [manageBookingNumber, manageTokenFromUrl]);

  useEffect(() => {
    if (!location || !date) {
      return;
    }

    let active = true;
    const selectedDate = formatDateForApi(date);
    const selectedLocationSlug = location.slug;

    async function loadSlots() {
      try {
        setLoadingSlots(true);
        setError("");
        const response = await fetch(
          `/api/eye-exam/availability?location=${encodeURIComponent(
            selectedLocationSlug
          )}&date=${selectedDate}`
        );
        const result = (await response
          .json()
          .catch(() => ({}))) as AvailabilityResponse;

        if (!response.ok || !result.slots) {
          throw new Error(
            result.error || "No pudimos consultar los horarios."
          );
        }

        if (active) {
          setSlots(result.slots);
          setTime((current) =>
            result.slots?.some(
              (slot) => slot.time === current && slot.available
            )
              ? current
              : ""
          );
          const firstAvailableSlot = result.slots.find(
            (slot) => slot.available
          );
          setSelectedDayPeriod(
            getDayPeriodForTime(firstAvailableSlot?.time || "10:00")
          );
        }
      } catch (slotError) {
        if (active) {
          setSlots([]);
          setError(
            slotError instanceof Error
              ? slotError.message
              : "No pudimos consultar los horarios."
          );
        }
      } finally {
        if (active) setLoadingSlots(false);
      }
    }

    loadSlots();

    return () => {
      active = false;
    };
  }, [date, location]);

  function goTo(nextStep: Step) {
    setStep(nextStep);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectAgeGroup(value: PatientAgeGroup) {
    setPatientAgeGroup(value);
    setPatientInfo((current) => ({ ...current, dateOfBirth: "" }));
    goTo(isLocationPreset ? 3 : 2);
  }

  function selectLocation(entry: Location) {
    setLocation(entry);
    setDate(null);
    setTime("");
    setCalendarMonth(currentMonth);
    goTo(3);
  }

  function updateCalendarMonth(month: number) {
    const candidate = new Date(calendarMonth.getFullYear(), month, 1);
    setCalendarMonth(
      candidate.getTime() < currentMonth.getTime() ? currentMonth : candidate
    );
    setDate(null);
    setTime("");
  }

  function updateCalendarYear(year: number) {
    const candidate = new Date(year, calendarMonth.getMonth(), 1);
    setCalendarMonth(
      candidate.getTime() < currentMonth.getTime() ? currentMonth : candidate
    );
    setDate(null);
    setTime("");
  }

  function canSubmitPatientInfo() {
    const phoneDigits = patientInfo.phone.replace(/\D/g, "");

    return Boolean(
      patientInfo.fullName.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientInfo.email.trim()) &&
        phoneDigits.length >= selectedPhoneCountry.minDigits &&
        phoneDigits.length <= selectedPhoneCountry.maxDigits &&
        patientInfo.dateOfBirth
    );
  }

  async function submitBooking() {
    if (
      !patientAgeGroup ||
      !location ||
      !date ||
      !time ||
      !canSubmitPatientInfo()
    ) {
      setError("Completa todos los campos requeridos.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setNotice("");
      const response = await fetch("/api/eye-exam/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationSlug: location.slug,
          appointmentDate: formatDateForApi(date),
          appointmentTime: time,
          patientAgeGroup,
          dateOfBirth: patientInfo.dateOfBirth,
          customerName: patientInfo.fullName,
          customerEmail: patientInfo.email,
          customerPhone: `${phoneCountryCode}${patientInfo.phone.replace(/\D/g, "")}`,
          patientDetails: {},
          notes: patientInfo.notes,
          reschedule:
            rescheduling && confirmedBooking && manageToken
              ? {
                  bookingNumber: confirmedBooking.bookingNumber,
                  manageToken,
                }
              : undefined,
        }),
      });
      const result = (await response
        .json()
        .catch(() => ({}))) as BookingResponse;

      if (!response.ok || !result.booking || !result.manageToken) {
        throw new Error(result.error || "No se pudo guardar la cita.");
      }

      setConfirmedBooking(result.booking);
      setManageToken(result.manageToken);
      setRescheduling(false);
      setNotice(
        result.emailNotifications?.some((item) => item.endsWith("_failed"))
          ? "La cita quedó guardada, pero la notificación por correo requiere revisión."
          : "La confirmación por correo quedó preparada para envío."
      );
      window.history.replaceState(
        {},
        "",
        `/eye-exam/book?manage=${encodeURIComponent(
          result.booking.bookingNumber
        )}&token=${encodeURIComponent(result.manageToken)}`
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar la cita."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function beginReschedule() {
    if (!confirmedBooking) return;

    const currentLocation =
      locations.find(
        (entry) => entry.slug === confirmedBooking.locationSlug
      ) || null;
    const storedPhone = splitStoredPhone(confirmedBooking.customerPhone);
    setPatientAgeGroup(confirmedBooking.patientAgeGroup);
    setLocation(currentLocation);
    setPhoneCountryCode(storedPhone.countryCode);
    setPatientInfo({
      fullName: confirmedBooking.customerName,
      email: confirmedBooking.customerEmail,
      phone: storedPhone.nationalNumber,
      dateOfBirth: confirmedBooking.dateOfBirth,
      notes: confirmedBooking.notes || "",
    });
    setDate(null);
    setTime("");
    setSlots([]);
    setCalendarMonth(currentMonth);
    setStep(1);
    setRescheduling(true);
    setNotice("Elige los nuevos datos. Tu cita actual seguirá activa hasta confirmar el cambio.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function cancelBooking() {
    if (!confirmedBooking || !manageToken) return;

    try {
      setIsCancelling(true);
      setError("");
      const response = await fetch(
        `/api/eye-exam/bookings/${encodeURIComponent(
          confirmedBooking.bookingNumber
        )}/manage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", manageToken }),
        }
      );
      const result = (await response
        .json()
        .catch(() => ({}))) as BookingResponse;

      if (!response.ok || !result.booking) {
        throw new Error(result.error || "No se pudo cancelar la cita.");
      }

      setConfirmedBooking(result.booking);
      setNotice("La cita fue cancelada y la notificación por correo quedó preparada.");
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "No se pudo cancelar la cita."
      );
    } finally {
      setIsCancelling(false);
    }
  }

  if (loadingManagedBooking) {
    return (
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white p-10 text-center">
        <p className="text-gray-600">Cargando los datos de tu cita…</p>
      </div>
    );
  }

  if (confirmedBooking && !rescheduling) {
    const selectedLocation =
      locations.find(
        (entry) => entry.slug === confirmedBooking.locationSlug
      ) || null;
    const isCancelled = confirmedBooking.status === "cancelled";

    return (
      <div className="editorial-sharp mx-auto max-w-3xl overflow-hidden border border-black/15 bg-white shadow-[0_25px_70px_rgba(53,35,27,0.12)]">
        <div
          className={`px-8 py-10 text-center ${
            isCancelled ? "bg-[#f4f1ed]" : "bg-[#edf6ef]"
          }`}
        >
          <div
            className={`mx-auto grid h-14 w-14 place-items-center border-2 text-2xl ${
              isCancelled
                ? "border-gray-500 text-gray-600"
                : "border-green-700 text-green-700"
            }`}
          >
            {isCancelled ? "×" : "✓"}
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-gray-600">
            {isCancelled ? "Cita cancelada" : "Reservación confirmada"}
          </p>
          <h2 className="mt-3 font-luxury text-3xl sm:text-4xl">
            {isCancelled
              ? "Tu examen fue cancelado"
              : "Tu examen de la vista está confirmado"}
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            Folio {confirmedBooking.bookingNumber}
          </p>
        </div>

        <div className="grid gap-8 p-7 sm:p-10 md:grid-cols-[1.2fr_.8fr]">
          <div>
            <dl className="divide-y divide-black/10">
              <div className="py-4 first:pt-0">
                <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">
                  Fecha y hora
                </dt>
                <dd className="mt-2 font-semibold">
                  {formatLongDate(confirmedBooking.appointmentDate)}
                </dd>
                <dd className="text-gray-700">
                  {formatAppointmentTime(confirmedBooking.appointmentTime)} · 45
                  minutos
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">
                  Sucursal
                </dt>
                <dd className="mt-2 font-semibold">
                  {confirmedBooking.locationName}
                </dd>
                {selectedLocation && (
                  <dd className="mt-1 text-sm leading-6 text-gray-600">
                    {selectedLocation.address}, {selectedLocation.city},{" "}
                    {selectedLocation.state}, C.P. {selectedLocation.zipCode}
                  </dd>
                )}
              </div>
              <div className="py-4 last:pb-0">
                <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">
                  Paciente
                </dt>
                <dd className="mt-2 font-semibold">
                  {confirmedBooking.customerName}
                </dd>
                <dd className="text-sm text-gray-600">
                  {confirmedBooking.customerEmail}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-l-4 border-[var(--brand-espresso)] bg-[#f7f3ee] p-6">
            <h3 className="font-semibold">
              {isCancelled ? "¿Necesitas otra cita?" : "Administra tu cita"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {isCancelled
                ? "Puedes comenzar una reservación nueva cuando quieras."
                : "Puedes cambiar la sucursal, fecha u horario sin llamar a la tienda."}
            </p>

            {!isCancelled ? (
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() => setPendingAppointmentAction("reschedule")}
                  className="h-11 bg-[var(--brand-espresso)] px-5 text-sm font-semibold text-white transition hover:bg-[#1f1511]"
                >
                  Reagendar examen
                </button>
                <button
                  type="button"
                  onClick={() => setPendingAppointmentAction("cancel")}
                  disabled={isCancelling}
                  className="h-11 border border-[var(--brand-espresso)] px-5 text-sm font-semibold text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white disabled:opacity-50"
                >
                  {isCancelling ? "Cancelando…" : "Cancelar examen"}
                </button>
              </div>
            ) : (
              <a
                href="/eye-exam/book"
                className="mt-5 inline-flex h-11 w-full items-center justify-center bg-[var(--brand-espresso)] px-5 text-sm font-semibold text-white"
              >
                Agendar otra cita
              </a>
            )}
          </div>
        </div>

        {(notice || error) && (
          <div
            role={error ? "alert" : "status"}
            className={`mx-7 mb-7 rounded-2xl px-4 py-3 text-sm sm:mx-10 sm:mb-10 ${
              error
                ? "bg-red-50 text-red-700"
                : "bg-[#f7f3ee] text-gray-700"
            }`}
          >
            {error || notice}
          </div>
        )}

        {pendingAppointmentAction && (
          <div
            className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setPendingAppointmentAction(null);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="appointment-action-title"
              className="w-full max-w-md border border-black/15 bg-white p-7 shadow-2xl"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Confirmar acción
              </p>
              <h3
                id="appointment-action-title"
                className="mt-3 font-luxury text-3xl text-[var(--brand-espresso)]"
              >
                {pendingAppointmentAction === "cancel"
                  ? "¿Cancelar tu examen?"
                  : "¿Reagendar tu examen?"}
              </h3>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                {pendingAppointmentAction === "cancel"
                  ? "Tu horario quedará disponible para otra persona. Recibirás una confirmación cuando la cancelación se complete."
                  : "Volverás al inicio para elegir una nueva sucursal, fecha u horario. Tu cita actual seguirá activa hasta confirmar el cambio."}
              </p>
              <div className="mt-7 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPendingAppointmentAction(null)}
                  className="h-11 border border-black/25 px-5 text-sm font-semibold transition hover:bg-[#f4f1ed]"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const action = pendingAppointmentAction;
                    setPendingAppointmentAction(null);
                    if (action === "reschedule") {
                      beginReschedule();
                    } else {
                      void cancelBooking();
                    }
                  }}
                  className="h-11 bg-[var(--brand-espresso)] px-5 text-sm font-semibold text-white transition hover:bg-[#1f1511]"
                >
                  {pendingAppointmentAction === "cancel"
                    ? "Sí, cancelar"
                    : "Sí, reagendar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="editorial-sharp mx-auto max-w-4xl">
      <div className="mb-8">
        <div className="h-1 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-[var(--brand-espresso)] transition-all"
            style={{
              width: `${((currentVisibleStepIndex + 1) / visibleSteps.length) * 100}%`,
            }}
          />
        </div>
        <div className="mt-3 flex justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 sm:text-xs">
          {visibleSteps.map(({ label }, index) => (
            <span
              key={label}
              className={
                currentVisibleStepIndex >= index
                  ? "text-[var(--brand-espresso)]"
                  : ""
              }
            >
              {index + 1}. <span className="hidden sm:inline">{label}</span>
            </span>
          ))}
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className="mb-6 rounded-2xl bg-[#f7f3ee] px-5 py-4 text-sm text-gray-700"
        >
          {notice}
        </p>
      )}

      {step === 1 && (
        <section className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
              Empecemos
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              ¿Para quién es esta consulta?
            </h2>
            <p className="mt-3 text-gray-600">
              Esto nos ayuda a preparar el examen correcto.
            </p>
          </div>

          <div className="mx-auto mt-9 grid max-w-2xl gap-4 sm:grid-cols-2">
            <ChoiceCard
              selected={patientAgeGroup === "adult"}
              title="Adulto"
              copy="Paciente de 18 años o más"
              onClick={() => selectAgeGroup("adult")}
              illustration={
                <div className="relative h-full w-full">
                  <Image
                    src="/images/eye-exam/adult-patient.png"
                    alt="Ilustración de una persona adulta con lentes"
                    fill
                    loading="eager"
                    sizes="(min-width: 640px) 320px, 90vw"
                    className="object-cover object-[center_35%] transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              }
            />
            <ChoiceCard
              selected={patientAgeGroup === "child"}
              title="Niño o adolescente"
              copy="Paciente de 2 a 17 años"
              onClick={() => selectAgeGroup("child")}
              illustration={
                <div className="relative h-full w-full">
                  <Image
                    src="/images/eye-exam/young-patient.png"
                    alt="Ilustración de un niño y una adolescente con lentes"
                    fill
                    loading="eager"
                    sizes="(min-width: 640px) 320px, 90vw"
                    className="object-cover object-[center_35%] transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              }
            />
          </div>

          <p className="mt-7 text-center text-sm text-gray-500">
            Selecciona una opción para avanzar.
          </p>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-10">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
              Cerca de ti
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Elige una sucursal
            </h2>
            <p className="mt-3 text-gray-600">
              Busca por código postal, colonia, dirección, ciudad o nombre.
            </p>
          </div>

          <label className="mx-auto mt-8 block max-w-2xl">
            <span className="sr-only">Buscar sucursal</span>
            <input
              type="search"
              value={locationSearch}
              onChange={(event) => setLocationSearch(event.target.value)}
              placeholder="Ej. 77725, Playa del Carmen, Cuautitlán…"
              className="h-13 w-full rounded-full border border-black/15 px-6 outline-none transition focus:border-[var(--brand-espresso)]"
            />
          </label>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {filteredLocations.map((entry) => (
              <button
                type="button"
                key={entry.slug}
                onClick={() => selectLocation(entry)}
                aria-pressed={location?.slug === entry.slug}
                className={`overflow-hidden rounded-[1.75rem] border text-left transition ${
                  location?.slug === entry.slug
                    ? "border-[var(--brand-espresso)] shadow-sm"
                    : "border-black/10 hover:border-[var(--brand-espresso)] hover:bg-[#f7f3ee]"
                }`}
              >
                <div className="relative h-36 bg-[#f7f3ee]">
                  <Image
                    src={entry.image}
                    alt={`Zona de ${entry.neighborhood}`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    {entry.neighborhood} · C.P. {entry.zipCode}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{entry.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {entry.address}, {entry.city}, {entry.state}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {filteredLocations.length === 0 && (
            <div className="mt-8 rounded-3xl bg-[#f7f3ee] p-7 text-center">
              <p className="font-semibold">No encontramos una sucursal.</p>
              <p className="mt-2 text-sm text-gray-600">
                Intenta con otra colonia, código postal o parte de la dirección.
              </p>
            </div>
          )}

          <div className="mt-9">
            <button
              type="button"
              onClick={() => goTo(1)}
              className="h-12 rounded-full border border-[var(--brand-espresso)] px-6 font-semibold text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white"
            >
              Atrás
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-10">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
              Citas de 45 minutos
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Elige fecha y hora
            </h2>
            <p className="mt-3 text-gray-600">
              Disponibilidad en {location?.name}.
            </p>
          </div>

          <div className="mx-auto mt-9 max-w-xl overflow-hidden border border-black/15 bg-white shadow-[0_18px_55px_rgba(53,35,27,0.08)]">
            <div className="bg-[var(--brand-espresso)] px-5 py-5 text-white sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
                Calendario
              </p>
              <h3 className="mt-1 font-luxury text-2xl">
                Selecciona una fecha
              </h3>
              <p className="mt-1 text-sm text-white/70">
                Cambia de mes o año para consultar fechas futuras.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-black/10 bg-[#f7f3ee] p-4 sm:px-6">
              <button
                type="button"
                aria-label="Mes anterior"
                disabled={calendarMonth.getTime() <= currentMonth.getTime()}
                onClick={() =>
                  setCalendarMonth((current) => addMonths(current, -1))
                }
                className="flex h-11 w-11 items-center justify-center border border-black/15 bg-white text-2xl transition hover:border-[var(--brand-espresso)] hover:bg-[var(--brand-espresso)] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              >
                ‹
              </button>
              <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_6.5rem] gap-2 sm:max-w-sm">
                <label>
                  <span className="sr-only">Mes</span>
                  <select
                    value={calendarMonth.getMonth()}
                    onChange={(event) =>
                      updateCalendarMonth(Number(event.target.value))
                    }
                    className="h-11 w-full border border-black/15 bg-white px-3 text-sm font-semibold outline-none focus:border-[var(--brand-espresso)]"
                  >
                    {monthLabels.map((label, index) => (
                      <option
                        key={label}
                        value={index}
                        disabled={
                          calendarMonth.getFullYear() ===
                            currentMonth.getFullYear() &&
                          index < currentMonth.getMonth()
                        }
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="sr-only">Año</span>
                  <select
                    value={calendarMonth.getFullYear()}
                    onChange={(event) =>
                      updateCalendarYear(Number(event.target.value))
                    }
                    className="h-11 w-full border border-black/15 bg-white px-3 text-sm font-semibold outline-none focus:border-[var(--brand-espresso)]"
                  >
                    {bookingYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() =>
                  setCalendarMonth((current) => addMonths(current, 1))
                }
                className="flex h-11 w-11 items-center justify-center border border-black/15 bg-white text-2xl transition hover:border-[var(--brand-espresso)] hover:bg-[var(--brand-espresso)] hover:text-white"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 p-4 text-center sm:p-6">
              {weekdayLabels.map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className="py-2 text-xs font-semibold text-gray-400"
                >
                  {label}
                </span>
              ))}
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <span key={`empty-${index}`} aria-hidden="true" />;
                }

                const isPast = startOfDay(day) < startOfDay(new Date());
                const selected =
                  date?.toDateString() === day.toDateString();
                const isToday =
                  startOfDay(day).getTime() === startOfDay(new Date()).getTime();

                return (
                  <button
                    type="button"
                    key={day.toISOString()}
                    disabled={isPast}
                    aria-label={new Intl.DateTimeFormat("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(day)}
                    aria-pressed={selected}
                    onClick={() => {
                      setDate(day);
                      setTime("");
                    }}
                    className={`aspect-square rounded-full text-sm font-semibold transition ${
                      selected
                        ? "bg-[var(--brand-espresso)] text-white"
                        : isPast
                          ? "cursor-not-allowed text-gray-300"
                          : "hover:bg-[var(--brand-espresso)] hover:text-white"
                    } ${isToday && !selected ? "ring-1 ring-[var(--brand-espresso)]" : ""}`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 min-h-44">
            {!date ? (
              <div className="rounded-3xl bg-[#f7f3ee] p-8 text-center text-gray-600">
                Selecciona un día para consultar horarios.
              </div>
            ) : loadingSlots ? (
              <div className="rounded-3xl bg-[#f7f3ee] p-8 text-center text-gray-600">
                Consultando disponibilidad…
              </div>
            ) : (
              <div>
                <div
                  className="grid border-y border-black/15 sm:grid-cols-3"
                  aria-label="Periodo del día"
                >
                  {dayPeriods.map((period) => {
                    const isActive = selectedDayPeriod === period.id;
                    const availableCount = slots.filter(
                      (slot) =>
                        slot.available &&
                        getDayPeriodForTime(slot.time) === period.id
                    ).length;

                    return (
                      <button
                        type="button"
                        key={period.id}
                        onClick={() => setSelectedDayPeriod(period.id)}
                        aria-pressed={isActive}
                        className={`border-b px-4 py-4 text-center transition sm:border-b-0 sm:border-r sm:last:border-r-0 ${
                          isActive
                            ? "border-[var(--brand-espresso)] bg-[var(--brand-espresso)] text-white"
                            : "border-black/15 hover:bg-[#f7f3ee]"
                        }`}
                      >
                        <span className="block text-sm font-semibold uppercase tracking-[0.16em]">
                          {period.label}
                        </span>
                        <span
                          className={`mt-1 block text-xs ${
                            isActive ? "text-white/75" : "text-gray-500"
                          }`}
                        >
                          {period.range}
                        </span>
                        <span className="sr-only">
                          {availableCount} horarios disponibles
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {slots
                    .filter(
                      (slot) =>
                        getDayPeriodForTime(slot.time) === selectedDayPeriod
                    )
                    .map((slot) => (
                      <button
                        type="button"
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => {
                          setTime(slot.time);
                          goTo(4);
                        }}
                        className={`h-12 border text-sm font-semibold transition ${
                          time === slot.time
                            ? "border-[var(--brand-espresso)] bg-[var(--brand-espresso)] text-white"
                            : slot.available
                              ? "border-black/15 hover:border-[var(--brand-espresso)] hover:bg-[var(--brand-espresso)] hover:text-white"
                              : "cursor-not-allowed border-black/5 bg-gray-50 text-gray-300 line-through"
                        }`}
                      >
                        {formatAppointmentTime(slot.time)}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-9 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => goTo(isLocationPreset ? 1 : 2)}
              className="h-12 rounded-full border border-[var(--brand-espresso)] px-6 font-semibold text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white"
            >
              Atrás
            </button>
            <p className="text-right text-sm text-gray-500">
              Selecciona un horario para avanzar.
            </p>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-10">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
              Ya casi terminamos
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Información del paciente
            </h2>
            <p className="mt-3 text-gray-600">
              Usaremos estos datos para preparar el examen y confirmar la cita.
            </p>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-semibold">Nombre completo *</span>
              <input
                value={patientInfo.fullName}
                onChange={(event) =>
                  setPatientInfo((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                autoComplete="name"
                className="mt-2 h-12 w-full rounded-xl border border-black/15 px-4 outline-none focus:border-[var(--brand-espresso)]"
              />
            </label>
            <label>
              <span className="text-sm font-semibold">
                Correo electrónico *
              </span>
              <input
                type="email"
                value={patientInfo.email}
                onChange={(event) =>
                  setPatientInfo((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                autoComplete="email"
                className="mt-2 h-12 w-full rounded-xl border border-black/15 px-4 outline-none focus:border-[var(--brand-espresso)]"
              />
            </label>
            <label>
              <span className="text-sm font-semibold">Teléfono *</span>
              <span className="mt-2 grid grid-cols-[8.5rem_minmax(0,1fr)]">
                <select
                  value={phoneCountryCode}
                  onChange={(event) => {
                    setPhoneCountryCode(event.target.value);
                    setPatientInfo((current) => ({ ...current, phone: "" }));
                  }}
                  aria-label="País y código telefónico"
                  className="h-12 border border-r-0 border-black/15 bg-[#f7f3ee] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-espresso)]"
                >
                  {phoneCountries.map((entry) => (
                    <option key={entry.code} value={entry.code}>
                      {entry.shortLabel} {entry.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={patientInfo.phone}
                  onChange={(event) => {
                    const digits = event.target.value
                      .replace(/\D/g, "")
                      .slice(0, selectedPhoneCountry.maxDigits);
                    setPatientInfo((current) => ({
                      ...current,
                      phone: digits,
                    }));
                  }}
                  placeholder={selectedPhoneCountry.placeholder}
                  autoComplete="tel-national"
                  aria-label="Número telefónico"
                  className="h-12 min-w-0 border border-black/15 px-4 outline-none focus:border-[var(--brand-espresso)]"
                />
              </span>
              <span className="mt-2 block text-xs text-gray-500">
                {selectedPhoneCountry.country} {selectedPhoneCountry.code} ·{" "}
                {selectedPhoneCountry.minDigits ===
                selectedPhoneCountry.maxDigits
                  ? `${selectedPhoneCountry.minDigits} dígitos`
                  : `${selectedPhoneCountry.minDigits}–${selectedPhoneCountry.maxDigits} dígitos`}
              </span>
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-semibold">
                Fecha de nacimiento *
              </span>
              <input
                type="date"
                value={patientInfo.dateOfBirth}
                min={
                  patientAgeGroup === "child"
                    ? birthDateYearsAgo(18, 1)
                    : undefined
                }
                max={
                  patientAgeGroup === "adult"
                    ? birthDateYearsAgo(18)
                    : birthDateYearsAgo(2)
                }
                onChange={(event) =>
                  setPatientInfo((current) => ({
                    ...current,
                    dateOfBirth: event.target.value,
                  }))
                }
                className="mt-2 h-12 w-full rounded-xl border border-black/15 px-4 outline-none focus:border-[var(--brand-espresso)]"
              />
              <p className="mt-2 text-xs text-gray-500">
                {patientAgeGroup === "adult"
                  ? "La persona debe tener 18 años o más."
                  : "La persona debe tener entre 2 y 17 años."}
              </p>
            </label>
          </div>

          <div className="mt-9 rounded-3xl bg-[#f7f3ee] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Resumen
            </p>
            <p className="mt-3 font-semibold">{location?.name}</p>
            <p className="mt-1 text-sm text-gray-600">
              {date ? formatLongDate(formatDateForApi(date)) : ""} ·{" "}
              {formatAppointmentTime(time)} · 45 minutos
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-6 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="mt-9 flex justify-between">
            <button
              type="button"
              onClick={() => goTo(3)}
              className="h-12 rounded-full border border-[var(--brand-espresso)] px-6 font-semibold text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white"
            >
              Atrás
            </button>
            <button
              type="button"
              disabled={isSubmitting || !canSubmitPatientInfo()}
              onClick={submitBooking}
              className="h-12 rounded-full bg-[var(--brand-espresso)] px-7 font-semibold text-white transition hover:bg-[#1f1511] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {isSubmitting
                ? rescheduling
                  ? "Reagendando…"
                  : "Confirmando…"
                : rescheduling
                  ? "Confirmar nueva cita"
                  : "Confirmar cita"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
