import { Suspense } from "react";
import EyeExamBooking from "@/components/EyeExamBooking";

export const metadata = {
  title: "Examen de la vista · Óptica OLM",
  description:
    "Agenda un examen de la vista de 45 minutos en la sucursal Óptica OLM más conveniente para ti.",
};

export default function EyeExamPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-4 py-10 text-black sm:px-6 sm:py-14">
      <div className="mx-auto mb-9 max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
          Examen de la vista
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Agenda tu cita
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
          Elige una sucursal y un horario de 45 minutos. No necesitas pagar por
          adelantado.
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-center text-gray-600">Cargando agenda…</p>
        }
      >
        <EyeExamBooking />
      </Suspense>
    </main>
  );
}
