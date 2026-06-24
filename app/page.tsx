import ProductGrid from "@/components/ProductGrid";
import { products } from "@/data/products";
import { locations } from "@/data/locations";

const featuredProducts = products
  .filter((product) => product.isActive)
  .slice(0, 3);

const valueProps = [
  {
    title: "Envío gratis",
    copy: "En pedidos mayores a $1,500 MXN.",
  },
  {
    title: "Examen incluido",
    copy: "Gratis al comprar tu armazón en tienda.",
  },
  {
    title: "Prueba sin compromiso",
    copy: "Cambia o devuelve en 30 días.",
  },
];

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

          <div className="mt-8 flex flex-wrap justify-center gap-4">
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

            <a
              href="/eye-exam/book"
              className="rounded-full border border-black px-8 py-3"
            >
              Agendar examen
            </a>
          </div>
        </div>
      </section>

      <section className="border-y bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-3">
          {valueProps.map((prop) => (
            <div key={prop.title} className="text-center md:text-left">
              <p className="font-semibold">{prop.title}</p>
              <p className="mt-1 text-sm text-gray-600">{prop.copy}</p>
            </div>
          ))}
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

      <section className="bg-[#f7f3ee] px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-600">
              Examen de la vista
            </p>
            <h2 className="mt-3 text-4xl font-bold">
              Tu examen en menos de un minuto
            </h2>
            <p className="mt-4 text-gray-700">
              Agenda con un optometrista certificado. Gratis si compras tu
              armazón el mismo día.
            </p>
            <a
              href="/eye-exam/book"
              className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
            >
              Reservar mi cita
            </a>
          </div>

          <div className="flex h-64 items-center justify-center rounded-3xl bg-white">
            <span className="text-gray-500">Foto del optometrista</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold">Visítanos en tienda</h2>
            <p className="mt-3 text-gray-600">
              Pruébate cualquier modelo en persona.
            </p>
          </div>
          <a href="/locations" className="text-sm font-semibold underline">
            Ver todas
          </a>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {locations.map((location) => (
            <a
              key={location.slug}
              href={`/locations/${location.slug}`}
              className="rounded-2xl border bg-white p-6 transition hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-widest text-gray-500">
                {location.city}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{location.name}</h3>
              <p className="mt-2 text-gray-600">{location.address}</p>
              <p className="mt-3 text-sm font-medium text-black underline">
                Ver tienda →
              </p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
