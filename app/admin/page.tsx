export default function AdminPage() {
    return (
        <main className="min-h-screen bg-white px-6 py-12 text-black">
            <section className="mx-auto max-w-6xl">
                <h1 className="text-4xl font-bold">Admin</h1>

                <p className="mt-4 text-gray-600">
                    Panel administrativo temporal para Óptica OLM.
                </p>

                <div className="mt-10 grid gap-6 md:grid-cols-3">
                    <a
                        href="/admin/orders"
                        className="rounded-2xl border p-6 transition hover:shadow-lg"
                    >
                        <h2 className="text-2xl font-semibold">Pedidos</h2>

                        <p className="mt-3 text-gray-600">
                            Ver pedidos temporales guardados en este navegador.
                        </p>
                    </a>

                    <a
                        href="/admin/products"
                        className="rounded-2xl border p-6 transition hover:shadow-lg"
                    >
                        <h2 className="text-2xl font-semibold">Productos</h2>

                        <p className="mt-3 text-gray-600">
                            Ver productos actuales del catálogo.
                        </p>
                    </a>


                    <div className="rounded-2xl border p-6 opacity-50">
                        <h2 className="text-2xl font-semibold">Inventario</h2>

                        <p className="mt-3 text-gray-600">
                            Próximamente podrás controlar stock y disponibilidad.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}

