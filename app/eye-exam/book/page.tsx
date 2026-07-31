import { Suspense } from "react";
import EyeExamBooking from "@/components/EyeExamBooking";

export const metadata = {
  title: "Agendar examen · Óptica OLM",
};

export default function EyeExamBookPage() {
  return (
    <main className="editorial-sharp min-h-screen bg-[#f7f3ee] px-6 py-12 text-black">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-gray-600">
          Examen de la vista
        </p>
        <h1 className="mt-3 text-4xl">Reserva tu cita</h1>
        <p className="mt-4 max-w-2xl text-gray-700">
          Cuatro pasos rápidos, horarios de 45 minutos y listo. Sin pagar nada
          por adelantado.
        </p>
      </div>

      <div className="mt-10">
        <Suspense fallback={<p className="text-center text-gray-600">Cargando…</p>}>
          <EyeExamBooking />
        </Suspense>
      </div>
    </main>
  );
}
