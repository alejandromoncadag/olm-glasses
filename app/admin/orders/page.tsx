import AdminNav from "@/components/AdminNav";
import AdminOrders from "@/components/AdminOrders";

export default function AdminOrdersPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-4xl font-bold">Pedidos</h1>

            <p className="mt-4 max-w-2xl text-gray-600">
              Revisa pedidos recibidos, clientes, pago, envío, rastreo y estado
              general de cada compra.
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
          <AdminOrders />
        </div>
      </section>
    </main>
  );
}

