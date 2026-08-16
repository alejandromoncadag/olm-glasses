"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Location } from "@/data/locations";

type HomeLocationFinderProps = { locations: Location[] };

export default function HomeLocationFinder({ locations }: HomeLocationFinderProps) {
  const [startIndex, setStartIndex] = useState(0);
  const visibleLocations = useMemo(() => {
    if (locations.length <= 2) return locations;
    return [0, 1].map((offset) => locations[(startIndex + offset) % locations.length]);
  }, [locations, startIndex]);

  function move(direction: "previous" | "next") {
    if (locations.length < 2) return;
    setStartIndex((current) => (current + (direction === "next" ? 1 : -1) + locations.length) % locations.length);
  }

  if (!locations.length) return null;

  return (
    <div className="mt-10">
      <div className="mb-5 flex items-center justify-between gap-5 border-b border-black/10 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Nuestras sucursales</p>
          <p className="mt-1 text-lg font-semibold sm:text-xl">Encuentra tu tienda OLM</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => move("previous")} disabled={locations.length < 2} className="grid h-10 w-10 place-items-center border border-black/15 bg-white text-[var(--brand-espresso)] transition hover:border-[var(--brand-espresso)] hover:bg-[var(--brand-espresso)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Sucursales anteriores"><ArrowIcon direction="left" /></button>
          <button type="button" onClick={() => move("next")} disabled={locations.length < 2} className="grid h-10 w-10 place-items-center border border-black/15 bg-white text-[var(--brand-espresso)] transition hover:border-[var(--brand-espresso)] hover:bg-[var(--brand-espresso)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-espresso)] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Siguientes sucursales"><ArrowIcon direction="right" /></button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6" aria-live="polite">
        {visibleLocations.map((location) => (
          <article key={location.slug} className="group min-w-0">
            <Link href={`/locations/${location.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-[#eee9e2] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-espresso)]" aria-label={`Conocer ${location.name}`}>
              <Image src={location.image} alt={`Interior y entorno de ${location.name}`} fill sizes="(min-width: 640px) 50vw, 94vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
              <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/5" />
            </Link>
            <div className="border-b border-black/10 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{location.city}, {location.state}</p>
              <h3 className="mt-2 text-xl tracking-[-0.02em] sm:text-2xl">{location.name}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{location.address}</p>
              <Link href={`/locations/${location.slug}`} className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-espresso)] underline decoration-black/25 underline-offset-4 transition hover:decoration-[var(--brand-espresso)]">Conocer tienda</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{direction === "left" ? <path d="M15 5 8 12l7 7M9 12h9" /> : <path d="m9 5 7 7-7 7M15 12H6" />}</svg>;
}
