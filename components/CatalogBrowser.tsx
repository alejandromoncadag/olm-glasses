"use client";

import { useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/types/product";

type FilterValue =
  | "todos"
  | "hombre"
  | "mujer"
  | "redondo"
  | "cuadrado"
  | "negro"
  | "transparente";

type CatalogBrowserProps = {
  products: Product[];
};

const filters: { label: string; value: FilterValue }[] = [
  { label: "Todos", value: "todos" },
  { label: "Hombre", value: "hombre" },
  { label: "Mujer", value: "mujer" },
  { label: "Redondos", value: "redondo" },
  { label: "Cuadrados", value: "cuadrado" },
  { label: "Negros", value: "negro" },
  { label: "Transparentes", value: "transparente" },
];

export default function CatalogBrowser({ products }: CatalogBrowserProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("todos");

  const filteredProducts = products.filter((product) => {
    if (activeFilter === "todos") return true;

    return (
      product.gender === activeFilter ||
      product.shape === activeFilter ||
      product.frameColor === activeFilter
    );
  });

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-3 border-b pb-6">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`rounded-full border px-5 py-2 text-sm ${
              activeFilter === filter.value
                ? "border-black bg-black text-white"
                : "hover:border-black"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        {filteredProducts.length} productos encontrados
      </p>

      <ProductGrid products={filteredProducts} />
    </>
  );
}
