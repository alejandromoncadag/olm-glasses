import AdminOrders from "@/components/AdminOrders";

export default function AdminOrdersPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">Pedidos</h1>

        <p className="mt-4 text-gray-600">
          Aquí puedes ver los pedidos temporales guardados en este navegador.
        </p>

        <AdminOrders />
      </section>
    </main>
  );
}

