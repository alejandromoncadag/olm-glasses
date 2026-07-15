import AdminEyeExamBookings from "@/components/AdminEyeExamBookings";
import AdminNav from "@/components/AdminNav";

export const metadata = {
  title: "Citas de examen · Admin OLM",
};

export default function AdminEyeExamsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
              Administración
            </p>
            <h1 className="mt-3 text-4xl font-bold">Citas de examen</h1>
            <p className="mt-4 max-w-2xl text-gray-600">
              Consulta las citas registradas en PostgreSQL, encuentra pacientes y
              actualiza el estado de cada examen.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-full border px-6 py-3 text-center text-sm"
          >
            Panel admin
          </a>
        </div>

        <AdminNav />

        <div className="mt-10">
          <AdminEyeExamBookings />
        </div>
      </section>
    </main>
  );
}
