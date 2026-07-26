"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Location } from "@/data/locations";

type HomeLocationFinderProps = { locations: Location[] };

export default function HomeLocationFinder({ locations }: HomeLocationFinderProps) {
  const [selectedSlug, setSelectedSlug] = useState(locations[0]?.slug ?? "");
  const locationRailRef = useRef<HTMLDivElement>(null);
  const selectedLocation =
    locations.find((location) => location.slug === selectedSlug) ?? locations[0];

  function moveLocationRail(direction: "left" | "right") {
    const rail = locationRailRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction === "left" ? -Math.max(260, rail.clientWidth * 0.7) : Math.max(260, rail.clientWidth * 0.7),
      behavior: "smooth",
    });
  }

  if (!selectedLocation) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-6 border-y border-black/15">
        <div
          ref={locationRailRef}
          className="product-carousel flex min-w-0 flex-1 gap-8 overflow-x-auto py-1"
          aria-label="Seleccionar ubicación"
        >
          {locations.map((location, index) => {
            const isActive = location.slug === selectedLocation.slug;

            return (
              <button
                key={location.slug}
                type="button"
                onClick={() => setSelectedSlug(location.slug)}
                className={
                  "group relative min-w-max py-5 text-left transition " +
                  (isActive ? "text-black" : "text-black/45 hover:text-black")
                }
                aria-pressed={isActive}
                aria-controls="selected-location"
              >
                <span className="mr-3 text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-lg font-semibold">{location.neighborhood}</span>
                <span
                  className={
                    "absolute inset-x-0 bottom-0 h-0.5 bg-black transition-transform " +
                    (isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")
                  }
                />
              </button>
            );
          })}
        </div>

        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => moveLocationRail("left")}
            className="grid h-10 w-10 place-items-center rounded-full border border-black/20 transition hover:border-black hover:bg-black hover:text-white"
            aria-label="Ver ubicaciones anteriores"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={() => moveLocationRail("right")}
            className="grid h-10 w-10 place-items-center rounded-full border border-black/20 transition hover:border-black hover:bg-black hover:text-white"
            aria-label="Ver más ubicaciones"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div
        id="selected-location"
        className="relative mt-6 min-h-[520px] overflow-hidden rounded-[2rem] bg-[#eee9e2]"
        aria-live="polite"
      >
        <Image
          key={selectedLocation.image}
          src={selectedLocation.image}
          alt={`Vista editorial inspirada en ${selectedLocation.neighborhood}`}
          fill
          sizes="(min-width: 1280px) 1152px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

        <div className="relative flex min-h-[520px] items-end p-4 sm:p-7 md:p-9">
          <div className="w-full max-w-xl rounded-[1.5rem] bg-white/95 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
              {selectedLocation.city}, {selectedLocation.state}
            </p>
            <h3 className="mt-3 text-3xl font-bold tracking-tight">
              {selectedLocation.name}
            </h3>
            <p className="mt-4 leading-relaxed text-gray-600">
              {selectedLocation.address}
            </p>

            <div className="mt-6 grid gap-5 border-t border-black/10 pt-5 sm:grid-cols-2">
              <div className="text-sm leading-relaxed text-gray-600">
                <p className="font-semibold text-black">Horario</p>
                <p className="mt-1">{selectedLocation.hours[0]?.day}</p>
                <p>{selectedLocation.hours[0]?.time}</p>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                {selectedLocation.phone ? (
                  <a
                    href={"tel:" + selectedLocation.phone.replace(/\s/g, "")}
                    className="text-sm underline underline-offset-4"
                  >
                    {selectedLocation.phone}
                  </a>
                ) : (
                  <span className="text-sm text-gray-500">
                    Teléfono próximamente
                  </span>
                )}
                <Link
                  href={"/locations/" + selectedLocation.slug}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-black bg-transparent px-5 text-sm font-semibold transition hover:bg-black hover:text-white"
                >
                  Conocer tienda
                </Link>
              </div>
            </div>
          </div>

          <p className="absolute bottom-3 right-5 hidden text-xs text-white/85 md:block">
            Imagen de ambiente inspirada en la zona
          </p>
        </div>
      </div>
    </div>
  );
}
