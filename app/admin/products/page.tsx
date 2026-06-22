import { products } from "@/data/products";

export default function AdminProductsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">Productos</h1>

        <p className="mt-4 text-gray-600">
          Lista temporal de productos cargados en el archivo de datos.
        </p>

        <div className="mt-10 grid gap-6">
          {products.map((product) => (
            <div
              key={product.slug}
              className="grid gap-4 rounded-2xl border p-6 md:grid-cols-[160px_1fr_160px]"
            >
              <div
                className="h-32 rounded-2xl"
                style={{ backgroundColor: product.color }}
              />

              <div>
                <p className="text-sm text-gray-500">{product.category}</p>

                <h2 className="mt-1 text-2xl font-semibold">
                  {product.name}
                </h2>

                <p className="mt-2 text-gray-600">{product.description}</p>

                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {product.gender}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {product.shape}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {product.frameColor}
                  </span>
                </div>
              </div>

              <div className="md:text-right">
                <p className="text-sm text-gray-500">Precio</p>

                <p className="mt-1 text-xl font-semibold">
                  ${product.price.toLocaleString("es-MX")} MXN
                </p>

                <a
                  href={`/product/${product.slug}`}
                  className="mt-4 inline-block rounded-full border px-5 py-2 text-sm font-semibold hover:border-black"
                >
                  Ver producto
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

