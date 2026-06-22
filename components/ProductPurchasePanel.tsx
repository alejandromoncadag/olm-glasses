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

  function handleAddToCart() {
    const currentCart: CartItem[] = JSON.parse(
      localStorage.getItem("olm-cart") || "[]"
    );

    const cartSlug = `${product.slug}-${selectedLens.id}-${selectedPrescription.id}`;

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
    <div>
      <div className="mt-8 border-t pt-8">
        <h2 className="text-lg font-semibold">Selecciona tu tipo de lente</h2>

        <div className="mt-4 grid gap-3">
          {lensOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedLens(option)}
              className={`rounded-2xl border px-5 py-4 text-left ${
                selectedLens.id === option.id
                  ? "border-black bg-gray-50"
                  : "hover:border-black"
              }`}
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="text-sm text-gray-600">
                {option.description}
              </span>

              {option.extraPrice > 0 && (
                <span className="mt-1 block text-sm font-medium">
                  +${option.extraPrice.toLocaleString("es-MX")} MXN
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 border-t pt-8">
        <h2 className="text-lg font-semibold">¿Cómo enviarás tu receta?</h2>

        <div className="mt-4 grid gap-3">
          {prescriptionOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedPrescription(option)}
              className={`rounded-2xl border px-5 py-4 text-left ${
                selectedPrescription.id === option.id
                  ? "border-black bg-gray-50"
                  : "hover:border-black"
              }`}
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="text-sm text-gray-600">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-gray-50 p-4">
        <div className="flex justify-between">
          <span>Precio final</span>
          <span className="font-semibold">
            ${finalPrice.toLocaleString("es-MX")} MXN
          </span>
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        className="mt-6 w-full rounded-full bg-black px-8 py-4 text-white"
      >
        {added ? "Agregado al carrito" : "Agregar al carrito"}
      </button>
    </div>
  );
}


