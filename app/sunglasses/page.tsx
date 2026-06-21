import CatalogBrowser from "@/components/CatalogBrowser";
import { products } from "@/data/products";

const sunglasses = products.filter((product) => product.type === "sunglasses");

export default function SunglassesPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">Lentes de sol</h1>

        <p className="mt-4 max-w-2xl text-gray-600">
          Descubre nuestra colección de lentes de sol modernos y elegantes.
        </p>

        <CatalogBrowser products={sunglasses} />
      </section>
    </main>
  );
}
