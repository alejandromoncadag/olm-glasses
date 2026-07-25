import AdminInvoiceRequests from "@/components/AdminInvoiceRequests";
import AdminNav from "@/components/AdminNav";

export const metadata = {
  title: "Facturación · Admin OLM",
};

export default function AdminFacturacionPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b4a3f]">
              Operación manual
            </p>
            <h1 className="mt-3 text-4xl font-bold">Facturación</h1>
            <p className="mt-4 max-w-3xl text-gray-600">
              Revisa solicitudes, valida los datos fiscales y registra
              manualmente los enlaces XML y PDF después de emitir cada factura.
            </p>
          </div>
          <a
            href="/admin"
            className="rounded-full border px-6 py-3 text-center text-sm transition hover:bg-black hover:text-white"
          >
            Panel admin
          </a>
        </div>

        <AdminNav />

        <div className="mt-10">
          <AdminInvoiceRequests />
        </div>
      </section>
    </main>
  );
}
