import { getLocationBySlug, locations } from "@/data/locations";
import { createWhatsAppLink } from "@/lib/whatsapp";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type LocationPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return locations.map((location) => ({ slug: location.slug }));
}

export default async function LocationDetailPage({
  params,
}: LocationPageProps) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);

  if (!location) {
    notFound();
  }

  const fullAddress = `${location.address}, ${location.city}, ${location.state}, C.P. ${location.zipCode}, ${location.country}`;
  const locationRegion = [
    location.neighborhood !== location.city ? location.neighborhood : null,
    location.city,
    location.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-white text-black">
      <section className="relative min-h-[560px] overflow-hidden px-6 py-16">
        <Image
          src={location.image}
          alt={`Vista inspirada en ${location.city}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/5" />

        <div className="relative mx-auto flex min-h-[430px] max-w-6xl flex-col justify-between text-white">
          <Link
            href="/locations"
            className="w-fit text-sm underline underline-offset-4"
          >
            ← Todas las tiendas
          </Link>

          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/75">
              {location.city}, {location.state}
            </p>
            <h1 className="mt-3 max-w-3xl text-5xl font-bold md:text-6xl">
              {location.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90">
              {location.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/eye-exam/book?location=${location.slug}`}
                className="rounded-full bg-white px-6 py-3 font-semibold text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white"
              >
                Agendar examen de la vista
              </Link>
              {location.phone && (
                <a
                  href={`tel:${location.phone.startsWith("+") ? "" : "+52"}${location.phone.replace(/\s/g, "")}`}
                  className="rounded-full border border-white px-6 py-3 transition hover:bg-white hover:text-[var(--brand-espresso)]"
                >
                  Llamar al {location.phone}
                </a>
              )}
              {location.whatsapp && (
                <a
                  href={createWhatsAppLink(
                    `Hola, quiero información de ${location.name}.`,
                    location.whatsapp
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white px-6 py-3 transition hover:bg-white hover:text-[var(--brand-espresso)]"
                >
                  Escribir por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_1fr]">
          <div>
            <div className="relative h-80 overflow-hidden rounded-3xl border bg-[#f3f4f6]">
              <Image
                src={location.image}
                alt={`Entorno de ${location.name}`}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="mt-4 rounded-2xl border bg-[#f7f3ee] p-5">
              <p className="text-sm leading-6 text-gray-700">{fullAddress}</p>
              <a
                href={location.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full border border-[var(--brand-espresso)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white"
              >
                Abrir en Google Maps
              </a>
            </div>
          </div>

          <div>
            <div>
              <h2 className="text-2xl font-semibold">Dirección</h2>
              <p className="mt-3 text-gray-700">{location.address}</p>
              <p className="text-gray-700">
                {locationRegion} {location.zipCode}
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Horarios</h2>
              <ul className="mt-3 divide-y rounded-2xl border bg-white">
                {location.hours.map((entry) => (
                  <li
                    key={entry.day}
                    className="flex justify-between px-5 py-3 text-gray-700"
                  >
                    <span>{entry.day}</span>
                    <span>{entry.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Contacto</h2>
              {location.phone || location.email ? (
                <>
                  {location.phone && (
                    <p className="mt-3 text-gray-700">{location.phone}</p>
                  )}
                  {location.email && (
                    <p className="text-gray-700">{location.email}</p>
                  )}
                </>
              ) : (
                <p className="mt-3 text-gray-600">
                  Información de contacto próximamente.
                </p>
              )}
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Servicios en tienda</h2>
              <ul className="mt-3 space-y-2 text-gray-700">
                {location.services.map((service) => (
                  <li key={service} className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-black" />
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f3ee] px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">¿Listo para tu examen?</h2>
          <p className="mt-4 text-gray-700">
            Agenda en línea en menos de un minuto. Sin tarjeta, sin compromiso.
          </p>
          <Link
            href={`/eye-exam/book?location=${location.slug}`}
            className="mt-8 inline-block rounded-full bg-[var(--brand-espresso)] px-8 py-4 text-white"
          >
            Reservar mi cita
          </Link>
        </div>
      </section>
    </main>
  );
}
