import { products } from "@/data/products";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <div
            className="flex h-[450px] items-center justify-center rounded-3xl"
            style={{ backgroundColor: product.color }}
          >
            <span className="text-gray-500">Imagen principal del producto</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="h-28 rounded-2xl bg-gray-100" />
            <div className="h-28 rounded-2xl bg-gray-100" />
            <div className="h-28 rounded-2xl bg-gray-100" />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">
            {product.category}
          </p>

          <h1 className="mt-3 text-5xl font-bold">{product.name}</h1>

          <p className="mt-4 text-2xl">
            ${product.price.toLocaleString("es-MX")} MXN
          </p>

          <p className="mt-6 max-w-md text-gray-600">
            {product.description}
          </p>

          <div className="mt-8 border-t pt-8">
            <h2 className="text-lg font-semibold">Selecciona tu tipo de lente</h2>

            <div className="mt-4 grid gap-3">
              <button className="rounded-2xl border px-5 py-4 text-left hover:border-black">
                <span className="block font-semibold">Graduación sencilla</span>
                <span className="text-sm text-gray-600">
                  Para visión de lejos o cerca.
                </span>
              </button>

              <button className="rounded-2xl border px-5 py-4 text-left hover:border-black">
                <span className="block font-semibold">Lentes sin graduación</span>
                <span className="text-sm text-gray-600">
                  Solo armazón con mica transparente.
                </span>
              </button>

              <button className="rounded-2xl border px-5 py-4 text-left hover:border-black">
                <span className="block font-semibold">Lentes de sol</span>
                <span className="text-sm text-gray-600">
                  Protección solar con estilo.
                </span>
              </button>
            </div>
          </div>

          <AddToCartButton
            product={{
                slug: product.slug,
                name: product.name,
                price: product.price,
            }}
            />

          <p className="mt-4 text-center text-sm text-gray-500">
            Pago seguro en pesos mexicanos.
          </p>
        </div>
      </section>
    </main>
  );
}



