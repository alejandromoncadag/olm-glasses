import ProductGrid from "@/components/ProductGrid";
import { products } from "@/data/products";

const featuredProducts = products.slice(0, 3);

export default function Home() {
  return (
    <main className="bg-white text-black">
      <section className="bg-[#f7f3ee] px-6 py-24 text-center">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em]">
            Óptica OLM
          </p>

          <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
            Lentes modernos para todos los días
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-700">
            Compra lentes ópticos y de sol en México con estilo, calidad y
            precios en pesos mexicanos.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <a
              href="/eyeglasses"
              className="rounded-full bg-black px-8 py-3 text-white"
            >
              Ver lentes
            </a>

            <a
              href="/sunglasses"
              className="rounded-full border border-black px-8 py-3"
            >
              Ver solares
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold">Productos destacados</h2>
            <p className="mt-3 text-gray-600">
              Explora algunos de nuestros modelos favoritos.
            </p>
          </div>

          <a href="/eyeglasses" className="text-sm font-semibold underline">
            Ver todos
          </a>
        </div>

        <ProductGrid products={featuredProducts} />
      </section>
    </main>
  );
}
