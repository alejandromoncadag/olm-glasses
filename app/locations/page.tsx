import { locations } from "@/data/locations";

export const metadata = {
  title: "Tiendas · Óptica OLM",
};

export default function LocationsPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="bg-[#f7f3ee] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-600">
            Visítanos
          </p>
          <h1 className="mt-3 text-5xl font-bold md:text-6xl">
            Nuestras tiendas
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-gray-700">
            Prueba cualquier modelo, agenda un examen de la vista o recoge tu
            pedido en persona con asesoría de nuestros expertos.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {locations.map((location) => (
            <a
              key={location.slug}
              href={`/locations/${location.slug}`}
              className="group overflow-hidden rounded-3xl border bg-white transition hover:shadow-lg"
            >
              <div
                className="flex h-56 items-center justify-center"
                style={{ backgroundColor: location.color }}
              >
                <span className="text-sm text-gray-500">
                  Foto de la tienda
                </span>
              </div>

              <div className="p-6">
                <p className="text-xs uppercase tracking-widest text-gray-500">
                  {location.city}
                </p>
                <h2 className="mt-1 text-2xl font-semibold group-hover:underline">
                  {location.name}
                </h2>
                <p className="mt-3 text-gray-600">{location.address}</p>
                <p className="mt-1 text-gray-600">
                  {location.neighborhood}, {location.state} {location.zipCode}
                </p>
                <p className="mt-4 text-sm font-medium">
                  Hoy: {location.hours[0].time}
                </p>

                <div className="mt-5 flex gap-3">
                  <span className="rounded-full bg-black px-4 py-2 text-sm text-white">
                    Ver tienda
                  </span>
                  <span className="rounded-full border border-black px-4 py-2 text-sm">
                    Agendar examen
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
