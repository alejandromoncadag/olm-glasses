"use client";

import { useState } from "react";

type Card = { stem: string; title: string; href: string };

const cards: Card[] = [
  { stem: "opticos", title: "Otoño fotocromático", href: "/shop?category=lentes_opticos" },
  { stem: "solar", title: "Comfort con clip on", href: "/shop?category=lentes_de_sol" },
  { stem: "modelo", title: "Solares para brillar aún más", href: "/shop?category=lentes_de_sol" },
];

const extensions = [".png", ".jpg", ".jpeg", ".webp"];

function LocalImage({ stem, title }: { stem: string; title: string }) {
  const [extensionIndex, setExtensionIndex] = useState(0);
  const src = `/images/${stem}${extensions[extensionIndex]}`;

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={extensionIndex < extensions.length - 1 ? () => setExtensionIndex((value) => value + 1) : undefined}
      className="block h-full w-full object-cover"
    />
  );
}

export default function SolarHighlights() {
  return (
    <section aria-labelledby="solar-highlights-title" className="w-full bg-white">
      <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#657789]">Colección solar</p>
            <h2 id="solar-highlights-title" className="mt-2 text-3xl font-light tracking-tight text-[#1f1a17] sm:text-4xl">
              Lentes solares para tus días
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-0 overflow-hidden sm:grid-cols-3">
          {cards.map((card) => (
            <a key={card.title} href={card.href} className="group block border-r border-white last:border-r-0">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f4f0eb]">
                <LocalImage stem={card.stem} title={card.title} />
              </div>
              <div className="px-4 py-5 text-center sm:px-3">
                <h3 className="text-lg font-medium text-[#1f1a17]">{card.title}</h3>
                <span className="mt-2 inline-block text-sm text-[#1f1a17] underline underline-offset-4">Ver colección</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
