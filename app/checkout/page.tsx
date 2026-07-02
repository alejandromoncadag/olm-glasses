import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSummary from "@/components/CheckoutSummary";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <a href="/cart" className="text-sm text-gray-500 underline">
          ← Regresar al carrito
        </a>

        <div className="mt-6">
          <h1 className="text-4xl font-bold">Checkout</h1>

          <p className="mt-4 max-w-2xl text-gray-600">
            Completa tus datos de envío y revisa tu pedido antes de finalizar la
            compra.
          </p>
        </div>

        <div className="mt-8 grid gap-3 rounded-2xl bg-gray-50 p-4 text-sm md:grid-cols-3">
          <div className="rounded-xl bg-black p-4 text-white">
            <p className="font-semibold">1. Carrito</p>
            <p className="mt-1 text-white/70">Productos seleccionados</p>
          </div>

          <div className="rounded-xl bg-black p-4 text-white">
            <p className="font-semibold">2. Datos de envío</p>
            <p className="mt-1 text-white/70">Información del cliente</p>
          </div>

          <div className="rounded-xl bg-white p-4">
            <p className="font-semibold">3. Confirmación</p>
            <p className="mt-1 text-gray-500">Crear pedido</p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px]">
          <CheckoutForm />
          <CheckoutSummary />
        </div>
      </section>
    </main>
  );
}

