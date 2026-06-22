
import ClearCart from "@/components/ClearCart";
import OrderSuccessDetails from "@/components/OrderSuccessDetails";

export default function OrderSuccessPage() {
    return (
        <main className="min-h-screen bg-white px-6 py-20 text-black">
            <ClearCart />

            <section className="mx-auto max-w-3xl text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl">
                    ✓
                </div>

                <h1 className="mt-8 text-4xl font-bold">Pedido recibido</h1>

                <p className="mt-4 text-lg text-gray-600">
                    Gracias por comprar en Óptica OLM. Hemos recibido tu pedido y pronto
                    te contactaremos para confirmar los detalles.
                </p>

                <OrderSuccessDetails />


                <div className="mt-10 rounded-2xl border p-6 text-left">
                    <h2 className="text-xl font-semibold">Próximos pasos</h2>

                    <ul className="mt-4 space-y-3 text-gray-600">
                        <li>1. Revisaremos tu pedido.</li>
                        <li>2. Confirmaremos tu información de envío.</li>
                        <li>3. Te enviaremos instrucciones de pago.</li>
                    </ul>
                </div>

                <a
                    href="/eyeglasses"
                    className="mt-8 inline-block rounded-full bg-black px-8 py-3 text-white"
                >
                    Seguir comprando
                </a>
            </section>
        </main>
    );
}

