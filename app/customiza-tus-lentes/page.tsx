"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CatalogProduct = {
  slug: string;
  category: string;
  frameColor: string | null;
  mainImage: { imageUrl: string; altText: string | null } | null;
};

type FrameKind = "optico" | "solar";

const frameKinds: { id: FrameKind; label: string; category: string }[] = [
  { id: "optico", label: "Armazón óptico", category: "lentes_opticos" },
  { id: "solar", label: "Armazón solar", category: "lentes_de_sol" },
];

const colorOptions = [
  { name: "Negro", value: "negro", swatch: "#171717" },
  { name: "Café", value: "cafe", swatch: "#6b4226" },
  { name: "Dorado", value: "dorado", swatch: "#c7a45b" },
  { name: "Transparente", value: "transparente", swatch: "#e8eef0" },
];

const micaOptions = ["Monofocal", "Bifocal", "Progresivo", "Sin graduación"];
const tintOptions = ["Sin tinte", "Verde", "Azul", "Café", "Gris"];

function matchesCategory(product: CatalogProduct, category: string) {
  return product.category.toLowerCase().replace(/-/g, "_").includes(category);
}

export default function CustomizeGlassesPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [frameKind, setFrameKind] = useState<FrameKind | null>(null);
  const [frameColor, setFrameColor] = useState<string | null>(null);
  const [micaType, setMicaType] = useState<string | null>(null);
  const [tint, setTint] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/catalog/products", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("catalog"))))
      .then((data) => setProducts(data.products || []))
      .catch(() => setProducts([]));
  }, []);

  const selectedKind = frameKinds.find((item) => item.id === frameKind) || null;
  const selectedFrame = useMemo(
    () => (selectedKind ? products.find((product) => matchesCategory(product, selectedKind.category)) : null),
    [products, selectedKind],
  );

  function chooseFrame(kind: FrameKind) {
    setFrameKind(kind);
    setFrameColor(null);
    setMicaType(null);
    setTint(null);
    setStep(2);
  }

  function chooseColor(color: string) {
    setFrameColor(color);
    setStep(3);
  }

  function chooseMicas(micas: string) {
    setMicaType(micas);
    setStep(4);
  }

  function completeCustomization(selectedTint: string) {
    setTint(selectedTint);
    sessionStorage.setItem("olm-customized-glasses", JSON.stringify({
      frameKind,
      frameProductSlug: selectedFrame?.slug || null,
      frameColor,
      micaType,
      tint: selectedTint,
    }));
    setStep(5);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#edf4f5] text-[#201713]">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src="/videos/beige.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-14 sm:px-10 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6b7778]">Óptica OLM</p>
        <h1 className="mt-4 text-4xl leading-tight sm:text-6xl">Personaliza tus lentes</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#526062]">Selecciona una opción en cada paso y crea tu configuración ideal.</p>

        <div className="mt-10 flex items-center gap-2" aria-label="Progreso de personalización">
          {[1, 2, 3, 4].map((number) => <span key={number} className={`h-1.5 flex-1 ${step >= number ? "bg-[#2d1f1a]" : "bg-black/10"}`} />)}
        </div>

        <section className="mt-8 bg-white px-5 py-8 sm:px-10 sm:py-12" aria-live="polite">
          {step === 1 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7778]">Paso 1</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">Selecciona tu tipo de lente</h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {frameKinds.map((kind) => (
                  <button key={kind.id} type="button" onClick={() => chooseFrame(kind.id)} className="group text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2d1f1a]">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#f6f5f2]">
                      {(() => {
                        const product = products.find((item) => matchesCategory(item, kind.category));
                        const image = product?.mainImage;
                        return image ? <Image src={image.imageUrl} alt={image.altText || kind.label} fill sizes="(min-width: 640px) 45vw, 90vw" className="object-contain p-8 transition duration-500 group-hover:scale-105" unoptimized={image.imageUrl.startsWith("http")} /> : <div className="grid h-full place-items-center text-sm text-gray-500">Imagen próximamente</div>;
                      })()}
                    </div>
                    <p className="mt-4 text-lg font-semibold">{kind.label}</p>
                    <p className="mt-1 text-sm text-gray-600">Elige este tipo para comenzar.</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7778]">Paso 2</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">Color de armazón</h2>
              <p className="mt-3 text-gray-600">Seleccionaste: {selectedKind?.label}</p>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {colorOptions.map((color) => <button key={color.value} type="button" onClick={() => chooseColor(color.value)} className="border border-black/15 px-4 py-5 text-center transition hover:border-[#2d1f1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d1f1a]"><span className="mx-auto block h-12 w-12 rounded-full border border-black/15" style={{ backgroundColor: color.swatch }} /><span className="mt-3 block text-sm font-semibold">{color.name}</span></button>)}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7778]">Paso 3</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">Selecciona tu tipo de micas</h2>
              <p className="mt-3 text-gray-600">Elige el diseño que necesitas. Aquí podrás agregar las imágenes de cada mica más adelante.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {micaOptions.map((mica) => <button key={mica} type="button" onClick={() => chooseMicas(mica)} className="min-h-28 border border-black/15 p-5 text-left transition hover:border-[#2d1f1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d1f1a]"><span className="block h-10 bg-[#f6f5f2]" /><span className="mt-4 block font-semibold">{mica}</span></button>)}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7778]">Paso 4</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">¿Quieres agregar tinte?</h2>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
                {tintOptions.map((option) => <button key={option} type="button" onClick={() => completeCustomization(option)} className="border border-black/15 px-4 py-5 text-sm font-semibold transition hover:border-[#2d1f1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d1f1a]">{option}</button>)}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7778]">Lente personalizado completado</p>
              <h2 className="mt-4 text-3xl sm:text-4xl">Tu configuración está lista</h2>
              <p className="mx-auto mt-4 max-w-xl text-gray-600">{selectedKind?.label}, color {frameColor}, micas {micaType}, tinte {tint}.</p>
              <button type="button" onClick={() => router.push("/cart")} className="mt-8 inline-flex h-12 items-center justify-center bg-[#2d1f1a] px-7 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#1f1511]">Ir al carrito</button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
