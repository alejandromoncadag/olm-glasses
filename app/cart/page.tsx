import CartItems from "@/components/CartItems";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">Carrito</h1>

        <p className="mt-4 text-gray-600">
          Revisa tus productos antes de continuar al pago.
        </p>

        <CartItems />
      </section>
    </main>
  );
}
