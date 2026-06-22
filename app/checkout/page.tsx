import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSummary from "@/components/CheckoutSummary";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold">Checkout</h1>

        <p className="mt-4 text-gray-600">
          Completa tus datos para continuar con tu compra.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_360px]">
          <CheckoutForm />
          <CheckoutSummary />
        </div>
      </section>
    </main>
  );
}

