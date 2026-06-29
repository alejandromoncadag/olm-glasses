import ClearCart from "@/components/ClearCart";
import OrderSuccessDetails from "@/components/OrderSuccessDetails";

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20 text-black">
      <ClearCart />

      <section className="mx-auto max-w-3xl">
        <OrderSuccessDetails />
      </section>
    </main>
  );
}


