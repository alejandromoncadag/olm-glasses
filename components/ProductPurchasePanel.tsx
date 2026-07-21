"use client";

import { useState } from "react";

type LensOption = {
  id: string;
  label: string;
  description: string;
  extraPrice: number;
};

type PrescriptionOption = {
  id: string;
  label: string;
  description: string;
};

type ProductPurchasePanelProps = {
  product: {
    slug: string;
    name: string;
    price: number;
    stock: number;
  };
};

type CartItem = {
  slug: string;
  name: string;
  price: number;
  quantity: number;
  lensOption: string;
  prescriptionMethod: string;
};

const lensOptions: LensOption[] = [
  {
    id: "single-vision",
    label: "Graduación sencilla",
    description: "Para visión de lejos o cerca.",
    extraPrice: 0,
  },
  {
    id: "no-prescription",
    label: "Lentes sin graduación",
    description: "Solo armazón con mica transparente.",
    extraPrice: 0,
  },
  {
    id: "sunglasses",
    label: "Lentes de sol",
    description: "Protección solar con estilo.",
    extraPrice: 300,
  },
];

const prescriptionOptions: PrescriptionOption[] = [
  {
    id: "upload-later",
    label: "Subir receta después",
    description: "Puedes completar tu compra y enviar tu receta más tarde.",
  },
  {
    id: "whatsapp",
    label: "Enviar por WhatsApp",
    description: "Te contactaremos para recibir tu receta por WhatsApp.",
  },
  {
    id: "no-prescription-needed",
    label: "No necesito graduación",
    description: "El pedido será procesado sin graduación.",
  },
];

export default function ProductPurchasePanel({
  product,
}: ProductPurchasePanelProps) {
  const [selectedLens, setSelectedLens] = useState<LensOption>(lensOptions[0]);
  const [selectedPrescription, setSelectedPrescription] =
    useState<PrescriptionOption>(prescriptionOptions[0]);
  const [added, setAdded] = useState(false);

  const finalPrice = product.price + selectedLens.extraPrice;
  const isOutOfStock = product.stock <= 0;

  function handleAddToCart() {
    if (isOutOfStock) {
      alert("Este producto está agotado.");
      return;
    }

    const currentCart: CartItem[] = JSON.parse(
      localStorage.getItem("olm-cart") || "[]"
    );




    const cartSlug = `${product.slug}-${selectedLens.id}-${selectedPrescription.id}`;

    const totalQuantityForProduct = currentCart
      .filter((item) => item.slug.startsWith(`${product.slug}-`))
      .reduce((sum, item) => sum + item.quantity, 0);

    if (totalQuantityForProduct >= product.stock) {
      alert("No hay más piezas disponibles de este producto.");
      return;
    }

    const existingItem = currentCart.find((item) => item.slug === cartSlug);

    let updatedCart: CartItem[];

    if (existingItem) {
      updatedCart = currentCart.map((item) =>
        item.slug === cartSlug
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [
        ...currentCart,
        {
          slug: cartSlug,
          name: product.name,
          price: finalPrice,
          quantity: 1,
          lensOption: selectedLens.label,
          prescriptionMethod: selectedPrescription.label,
        },
      ];
    }

    localStorage.setItem("olm-cart", JSON.stringify(updatedCart));

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1500);
  }

  return (
    <div className="mt-8 space-y-8">
      <section aria-labelledby="lens-options-heading">
        <div className="flex items-start gap-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
            1
          </span>
          <div>
            <h2 id="lens-options-heading" className="text-lg font-semibold">
              Selecciona tu tipo de lente
            </h2>
            <p className="mt-1 text-sm leading-5 text-gray-500">
              Elige la opción que mejor se adapte a lo que necesitas.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {lensOptions.map((option) => {
            const isSelected = selectedLens.id === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedLens(option)}
                disabled={isOutOfStock}
                aria-pressed={isSelected}
                className={`flex min-h-24 w-full items-start gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:p-5 ${
                  isSelected
                    ? "border-black bg-[#faf9f7] shadow-[inset_0_0_0_1px_#000]"
                    : "border-gray-200 hover:border-gray-500"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected ? "border-black" : "border-gray-300"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-black" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{option.label}</span>
                  <span className="mt-1 block text-sm leading-5 text-gray-600">
                    {option.description}
                  </span>
                </span>

                <span className="shrink-0 pt-0.5 text-xs font-semibold text-gray-700 sm:text-sm">
                  {option.extraPrice > 0
                    ? `+$${option.extraPrice.toLocaleString("es-MX")}`
                    : "Incluido"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="prescription-options-heading"
        className="border-t border-gray-200 pt-8"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
            2
          </span>
          <div>
            <h2
              id="prescription-options-heading"
              className="text-lg font-semibold"
            >
              ¿Cómo enviarás tu receta?
            </h2>
            <p className="mt-1 text-sm leading-5 text-gray-500">
              Puedes continuar ahora y completar este paso después.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {prescriptionOptions.map((option) => {
            const isSelected = selectedPrescription.id === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedPrescription(option)}
                disabled={isOutOfStock}
                aria-pressed={isSelected}
                className={`flex min-h-24 w-full items-start gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:p-5 ${
                  isSelected
                    ? "border-black bg-[#faf9f7] shadow-[inset_0_0_0_1px_#000]"
                    : "border-gray-200 hover:border-gray-500"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected ? "border-black" : "border-gray-300"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-black" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{option.label}</span>
                  <span className="mt-1 block text-sm leading-5 text-gray-600">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="rounded-3xl bg-[#f4f3f0] p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              ${finalPrice.toLocaleString("es-MX")} MXN
            </p>
          </div>
          <p className="pb-1 text-right text-xs text-gray-600">
            {isOutOfStock ? "Agotado" : `${product.stock} disponibles`}
          </p>
        </div>

        <div className="mt-4 space-y-1 text-xs leading-5 text-gray-600">
          <p>Lente: {selectedLens.label}</p>
          <p>Receta: {selectedPrescription.label}</p>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="mt-5 w-full rounded-full bg-black px-8 py-4 font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f3f0] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isOutOfStock
            ? "Producto agotado"
            : added
              ? "Agregado al carrito"
              : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}


