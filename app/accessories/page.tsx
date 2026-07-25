import StorefrontProductCard from "@/components/StorefrontProductCard";
import { accessoryProducts } from "@/data/secondaryCatalog";
import { createWhatsAppLink } from "@/lib/whatsapp";

export const metadata = {
  title: "Accesorios · Óptica OLM",
  description:
    "Estuches, cuidado para tus lentes y accesorios de Óptica OLM.",
};

export default function AccessoriesPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="border-b border-black/10 bg-[#f7f3ee] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
            Detalles OLM
          </p>
          <h1 className="mt-3 max-w-3xl text-5xl font-bold tracking-[-0.04em] md:text-7xl">
            Accesorios para todos los días
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            Cuida tus lentes y lleva un poco del estilo OLM contigo.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
              Colección inicial
            </p>
            <h2 className="mt-2 text-3xl font-bold">Nuestros accesorios</h2>
          </div>
          <p className="text-sm text-gray-500">3 productos</p>
        </div>

        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {accessoryProducts.map((product, index) => (
            <StorefrontProductCard
              key={product.slug}
              name={product.name}
              eyebrow={product.eyebrow}
              description={product.description}
              price={product.price}
              image={product.image}
              actionHref={createWhatsAppLink(
                `Hola, quiero comprar ${product.name} y confirmar disponibilidad.`
              )}
              actionLabel="Comprar"
              priority={index === 0}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
