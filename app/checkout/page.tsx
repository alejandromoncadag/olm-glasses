import CheckoutEntry from "@/components/CheckoutEntry";

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
            Completa tus datos, elige cómo recibir tu pedido y revisa el total antes de continuar al pago.
          </p>
        </div>

        <div className="mt-10"><CheckoutEntry /></div>
      </section>
    </main>
  );
}

