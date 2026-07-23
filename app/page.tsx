import Image from "next/image";
import Link from "next/link";
import FeaturedProductsFromDb from "@/components/FeaturedProductsFromDb";
import HomeLocationFinder from "@/components/HomeLocationFinder";
import { locations } from "@/data/locations";

const announcements = [
  { title: "Envío gratis", copy: "En pedidos mayores a $1,500 MXN" },
  { title: "Examen incluido", copy: "Gratis al comprar tu armazón en tienda" },
  { title: "Prueba sin compromiso", copy: "Cambia o devuelve en 30 días" },
];

function AnnouncementItems({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {announcements.map((announcement) => (
        <div key={announcement.title} className="flex min-w-max items-center gap-3 px-8 md:px-14">
          <span className="text-sm font-bold uppercase tracking-[0.12em]">{announcement.title}</span>
          <span className="text-sm text-black/65">{announcement.copy}</span>
          <span className="ml-5 text-lg" aria-hidden="true">•</span>
        </div>
      ))}
    </div>
  );
}

const outlineButton =
  "rounded-full border border-black bg-white/55 px-7 py-3 backdrop-blur-sm transition-colors duration-200 hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

export default function Home() {
  return (
    <main className="bg-white text-black">
      <section className="relative isolate min-h-[620px] overflow-hidden">
        <Image
          src="/images/home-hero-eyewear.png"
          alt=""
          fill
          preload
          sizes="100vw"
          className="-z-20 object-cover object-[64%_center] md:object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#f7f3ee] via-[#f7f3ee]/90 to-[#f7f3ee]/10 md:via-[#f7f3ee]/65 md:to-transparent" />

        <div className="mx-auto flex min-h-[620px] max-w-6xl items-center px-6 py-20">
          <div className="max-w-xl text-left">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em]">
              Óptica OLM
            </p>
            <h1 className="text-5xl font-bold leading-[0.98] tracking-[-0.04em] md:text-7xl">
              Lentes modernos para todos los días
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-gray-700 md:text-lg">
              Compra lentes ópticos y de sol en México con estilo, calidad y precios en pesos mexicanos.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/eyeglasses"
                className={outlineButton}
              >
                Ver lentes
              </Link>
              <Link href="/sunglasses" className={outlineButton}>Ver solares</Link>
              <Link href="/eye-exam/book" className={outlineButton}>Agendar examen</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="announcement-bar overflow-hidden border-y border-black/20 bg-white py-5" aria-label="Anuncios de la tienda">
        <div className="announcement-track flex w-max">
          <AnnouncementItems />
          <AnnouncementItems hidden />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <FeaturedProductsFromDb />
      </section>

      <section className="bg-[#f7f3ee] px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-600">Examen de la vista</p>
            <h2 className="mt-3 text-4xl font-bold">Tu examen en menos de un minuto</h2>
            <p className="mt-4 text-gray-700">
              Agenda con un optometrista certificado. Gratis si compras tu armazón el mismo día.
            </p>
            <Link href="/eye-exam/book" className="mt-6 inline-block rounded-full border border-black bg-transparent px-6 py-3 font-medium text-black transition hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
              Reservar mi cita
            </Link>
          </div>

          <div className="relative min-h-80 overflow-hidden rounded-3xl bg-white shadow-sm md:min-h-96">
            <Image
              src="/images/optometrist-olm.png"
              alt="Optometrista de Óptica OLM en una sala de examen"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">Cerca de ti</p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Visítanos en tienda</h2>
          <p className="mt-4 leading-relaxed text-gray-600">
            Conoce nuestros espacios, pruébate cualquier modelo y recibe atención personalizada.
          </p>
        </div>

        <HomeLocationFinder locations={locations} />
      </section>
    </main>
  );
}
