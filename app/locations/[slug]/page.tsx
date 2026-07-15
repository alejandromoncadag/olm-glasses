import { getLocationBySlug, locations } from "@/data/locations";
import { createWhatsAppLink } from "@/lib/whatsapp";
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

  return (
    <main className="min-h-screen bg-white text-black">
      <section
        className="px-6 py-16"
        style={{ backgroundColor: location.color }}
      >
        <div className="mx-auto max-w-6xl">
          <a
            href="/locations"
            className="text-sm text-gray-700 underline"
          >
            ← Todas las tiendas
          </a>

          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-gray-600">
            {location.city}, {location.state}
          </p>
          <h1 className="mt-3 text-5xl font-bold md:text-6xl">
            {location.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-gray-700">
            {location.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`/eye-exam/book?location=${location.slug}`}
              className="rounded-full bg-black px-6 py-3 text-white"
            >
              Agendar examen de la vista
            </a>
            <a
              href={`tel:${location.phone.startsWith("+") ? "" : "+52"}${location.phone.replace(/\s/g, "")}`}
              className="rounded-full border border-black px-6 py-3"
            >
              Llamar al {location.phone}
            </a>
            {location.whatsapp && (
              <a
                href={createWhatsAppLink(
                  `Hola, quiero información de ${location.name}.`,
                  location.whatsapp
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-black px-6 py-3 transition hover:bg-black hover:text-white"
              >
                Escribir por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_1fr]">
          <div>
            <div className="flex h-80 items-center justify-center rounded-3xl border bg-[#f3f4f6]">
              <span className="text-gray-500">Mapa de la tienda</span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="h-24 rounded-2xl bg-gray-100" />
              <div className="h-24 rounded-2xl bg-gray-100" />
              <div className="h-24 rounded-2xl bg-gray-100" />
            </div>
          </div>

          <div>
            <div>
              <h2 className="text-2xl font-semibold">Dirección</h2>
              <p className="mt-3 text-gray-700">{location.address}</p>
              <p className="text-gray-700">
                {location.neighborhood}, {location.city}, {location.state}{" "}
                {location.zipCode}
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
              <p className="mt-3 text-gray-700">{location.phone}</p>
              <p className="text-gray-700">{location.email}</p>
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
          <a
            href={`/eye-exam/book?location=${location.slug}`}
            className="mt-8 inline-block rounded-full bg-black px-8 py-4 text-white"
          >
            Reservar mi cita
          </a>
        </div>
      </section>
    </main>
  );
}
