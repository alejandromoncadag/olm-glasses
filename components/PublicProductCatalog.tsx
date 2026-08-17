"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";

type ProductType = "eyeglasses" | "sunglasses";
type FilterLayout = "top" | "sidebar";
type FrameSize =
  | "extra_small"
  | "small"
  | "medium"
  | "large"
  | "extra_large";
type FrameMaterial =
  | "acetate_stainless_steel"
  | "stainless_steel"
  | "acetate"
  | "acetate_slash_stainless_steel"
  | "titanium"
  | "nylon"
  | "titanium_nylon"
  | "reform";
type SortOption = "newest" | "price-asc" | "price-desc" | "name";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  type: ProductType;
  gender: string | null;
  shape: string | null;
  frameColor: string | null;
  frameSize: FrameSize | null;
  frameMaterial: FrameMaterial | null;
  clipOnCompatible: boolean | null;
  stock: number;
  isAvailable: boolean;
  isActive: boolean;
  purchasableOnline: boolean;
  favoritable: boolean;
  createdAt: string;
  mainImage: {
    imageUrl: string;
    altText: string | null;
  } | null;
};

type PublicProductCatalogProps = {
  type: ProductType;
  title: string;
  description: string;
  filterLayout?: FilterLayout;
  actionLabel?: string;
  showNewBadge?: boolean;
  heroImage?: string;
  heroImagePosition?: string;
  restrictToClipOn?: boolean;
  showClipOnFilter?: boolean;
  visualVariant?: "default" | "optical";
};

type CatalogFilterControlsProps = {
  searchTerm: string;
  genderFilter: string;
  shapeFilter: string;
  colorFilter: string;
  sizeFilter: string;
  materialFilter: string;
  maxPrice: number;
  clipOnOnly: boolean;
  colorOptions: string[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onShapeChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  onMaterialChange: (value: string) => void;
  onMaxPriceChange: (value: number) => void;
  onClipOnChange: (value: boolean) => void;
  onReset: () => void;
  showClipOnFilter: boolean;
};

const NEW_PRODUCT_WINDOW_DAYS = 30;
const MAX_PRICE = 10000;

const genderOptions = [
  { value: "all", label: "Todos" },
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "unisex", label: "Unisex" },
];

const shapeOptions = [
  { value: "rectangular", label: "Rectangular" },
  { value: "cuadrado", label: "Cuadrado" },
  { value: "redondo", label: "Redondo" },
  { value: "aviador", label: "Aviador" },
];

const sizeOptions: Array<{ value: FrameSize; label: string }> = [
  { value: "extra_small", label: "Extra chico" },
  { value: "small", label: "Chico" },
  { value: "medium", label: "Mediano" },
  { value: "large", label: "Grande" },
  { value: "extra_large", label: "Extra grande" },
];

const materialOptions: Array<{ value: FrameMaterial; label: string }> = [
  {
    value: "acetate_stainless_steel",
    label: "Acetato + Acero Inoxidable",
  },
  { value: "stainless_steel", label: "Acero Inoxidable" },
  { value: "acetate", label: "Acetato" },
  {
    value: "acetate_slash_stainless_steel",
    label: "Acetato/Acero Inoxidable",
  },
  { value: "titanium", label: "Titanio" },
  { value: "nylon", label: "Nylon" },
  { value: "titanium_nylon", label: "Titanio + Nylon" },
  { value: "reform", label: "ReForm" },
];

function getCardColor(frameColor: string | null) {
  const color = (frameColor || "").toLowerCase();

  if (color.includes("cafe") || color.includes("café")) return "#f1e9e2";
  if (color.includes("dorado")) return "#f2ead7";
  if (color.includes("transparente")) return "#f5f5f3";

  return "#efefed";
}

function getSwatchColor(frameColor: string) {
  const color = frameColor.toLowerCase();

  if (color.includes("negro")) return "#171717";
  if (color.includes("cafe") || color.includes("café")) return "#7b4e35";
  if (color.includes("dorado")) return "#c6a14a";
  if (color.includes("transparente")) return "#f5f5f3";

  return "#d1d5db";
}

function formatFilterLabel(value: string) {
  if (!value) return "Sin especificar";
  if (value.toLowerCase() === "cafe") return "Café";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isProductNew(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();

  if (!Number.isFinite(createdTime)) {
    return false;
  }

  const ageInMilliseconds = Date.now() - createdTime;
  const windowInMilliseconds =
    NEW_PRODUCT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return ageInMilliseconds >= 0 && ageInMilliseconds <= windowInMilliseconds;
}

function FilterSection({
  title,
  children,
  optical = false,
}: {
  title: string;
  children: ReactNode;
  optical?: boolean;
}) {
  return (
    <div className={`border-b py-6 first:pt-0 ${optical ? "border-[#d9cfc8]" : "border-black/10"}`}>
      <h3 className={optical ? "text-xs font-semibold uppercase tracking-[0.16em] text-gray-600" : "text-sm font-semibold"}>{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FilterButton({
  active,
  label,
  onClick,
  optical = false,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  optical?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${optical ? "rounded-none border-[#d9cfc8]" : "rounded-full border"} px-3 py-2 text-xs font-medium transition ${
        active
          ? "border-[var(--brand-espresso)] bg-[var(--brand-espresso)] text-white"
          : optical
            ? "bg-white text-gray-700 hover:border-[var(--brand-espresso)] hover:bg-[#f4efe9]"
            : "border-black/15 bg-white text-gray-700 hover:border-[var(--brand-espresso)] hover:text-[var(--brand-espresso)]"
      }`}
    >
      {label}
    </button>
  );
}

function ShapeIcon({ shape }: { shape: string }) {
  const sharedProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
  };

  return (
    <svg
      viewBox="0 0 96 42"
      aria-hidden="true"
      className="h-9 w-full"
    >
      <path d="M4 14 14 17M92 14 82 17M43 19h10" {...sharedProps} />
      {shape === "redondo" ? (
        <>
          <ellipse cx="27" cy="23" rx="15" ry="14" {...sharedProps} />
          <ellipse cx="69" cy="23" rx="15" ry="14" {...sharedProps} />
        </>
      ) : shape === "aviador" ? (
        <>
          <path
            d="M12 14c1-5 8-7 16-6 9 1 15 5 14 12-1 9-7 17-15 17-7 0-13-8-15-23Z"
            {...sharedProps}
          />
          <path
            d="M84 14c-1-5-8-7-16-6-9 1-15 5-14 12 1 9 7 17 15 17 7 0 13-8 15-23Z"
            {...sharedProps}
          />
        </>
      ) : shape === "cuadrado" ? (
        <>
          <rect x="11" y="10" width="32" height="27" rx="5" {...sharedProps} />
          <rect x="53" y="10" width="32" height="27" rx="5" {...sharedProps} />
        </>
      ) : (
        <>
          <rect x="10" y="13" width="34" height="23" rx="6" {...sharedProps} />
          <rect x="52" y="13" width="34" height="23" rx="6" {...sharedProps} />
        </>
      )}
    </svg>
  );
}

function CatalogFilterControls({
  searchTerm,
  genderFilter,
  shapeFilter,
  colorFilter,
  sizeFilter,
  materialFilter,
  maxPrice,
  clipOnOnly,
  colorOptions,
  hasActiveFilters,
  onSearchChange,
  onGenderChange,
  onShapeChange,
  onColorChange,
  onSizeChange,
  onMaterialChange,
  onMaxPriceChange,
  onClipOnChange,
  onReset,
  showClipOnFilter,
  optical = false,
}: CatalogFilterControlsProps & { optical?: boolean }) {
  return (
    <>
      <FilterSection title="Buscar">
        <label>
          <span className="sr-only">Buscar productos</span>
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Modelo, color o forma"
            className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-espresso)]"
          />
        </label>
      </FilterSection>

      <FilterSection title="Género">
        <div className="flex flex-wrap gap-2">
          {genderOptions.map((option) => (
            <FilterButton
              key={option.value}
              active={genderFilter === option.value}
              label={option.label}
              onClick={() => onGenderChange(option.value)}
              optical={optical}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Forma">
        <button
          type="button"
          onClick={() => onShapeChange("all")}
          aria-pressed={shapeFilter === "all"}
          className={`mb-3 w-full rounded-xl border px-3 py-2 text-sm font-medium transition ${
            shapeFilter === "all"
              ? "border-[var(--brand-espresso)] bg-[var(--brand-espresso)] text-white"
              : "border-black/15 bg-white hover:border-[var(--brand-espresso)]"
          }`}
        >
          Todas las formas
        </button>
        <div className="grid grid-cols-2 gap-2">
          {shapeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onShapeChange(option.value)}
              type="button"
              aria-pressed={shapeFilter === option.value}
              className={`rounded-xl border px-2 py-3 text-center text-xs font-medium transition ${
                shapeFilter === option.value
                  ? "border-[var(--brand-espresso)] bg-[#f2ede8] text-[var(--brand-espresso)]"
                  : "border-black/10 bg-white text-gray-700 hover:border-[var(--brand-espresso)]"
              }`}
            >
              <ShapeIcon shape={option.value} />
              <span className="mt-1 block">{option.label}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Tamaño">
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={sizeFilter === "all"}
            label="Todos"
            onClick={() => onSizeChange("all")}
            optical={optical}
          />
          {sizeOptions.map((option) => (
            <FilterButton
              key={option.value}
              active={sizeFilter === option.value}
              label={option.label}
              onClick={() => onSizeChange(option.value)}
              optical={optical}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Material">
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={materialFilter === "all"}
            label="Todos"
            onClick={() => onMaterialChange("all")}
            optical={optical}
          />
          {materialOptions.map((option) => (
            <FilterButton
              key={option.value}
              active={materialFilter === option.value}
              label={option.label}
              onClick={() => onMaterialChange(option.value)}
              optical={optical}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Color">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onColorChange("all")}
            aria-pressed={colorFilter === "all"}
            className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition ${
              colorFilter === "all"
                ? "bg-[#f2ede8] font-semibold text-[var(--brand-espresso)]"
                : "hover:bg-gray-50"
            }`}
          >
            <span className="h-4 w-4 rounded-full border border-black/20 bg-gradient-to-br from-white via-[#c8aa8c] to-black" />
            Todos los colores
          </button>

          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onColorChange(color)}
              aria-pressed={colorFilter === color}
              className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition ${
                colorFilter === color
                  ? "bg-[#f2ede8] font-semibold text-[var(--brand-espresso)]"
                  : "hover:bg-gray-50"
              }`}
            >
              <span
                className="h-4 w-4 rounded-full border border-black/20"
                style={{ backgroundColor: getSwatchColor(color) }}
              />
              {formatFilterLabel(color)}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Precio">
        <div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span>$0</span>
            <span className="font-semibold text-[var(--brand-espresso)]">
              Hasta ${maxPrice.toLocaleString("es-MX")} MXN
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={MAX_PRICE}
            step="100"
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(Number(event.target.value))}
            aria-label="Precio máximo"
            className="mt-4 w-full accent-[var(--brand-espresso)]"
          />
          <div className="mt-2 flex justify-between text-[11px] text-gray-500">
            <span>$0</span>
            <span>$10,000 MXN</span>
          </div>
        </div>
      </FilterSection>

      {showClipOnFilter && (
        <FilterSection title="Compatibilidad">
          <button
            type="button"
            onClick={() => onClipOnChange(!clipOnOnly)}
            aria-pressed={clipOnOnly}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
              clipOnOnly
                ? "border-[var(--brand-espresso)] bg-[#f2ede8] text-[var(--brand-espresso)]"
                : "border-black/15 bg-white hover:border-[var(--brand-espresso)]"
            }`}
          >
            Compatible con clip-on
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                clipOnOnly
                  ? "border-[var(--brand-espresso)] bg-[var(--brand-espresso)] text-white"
                  : "border-black/20"
              }`}
            >
              {clipOnOnly ? "✓" : ""}
            </span>
          </button>
        </FilterSection>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 w-full rounded-full border border-black/20 px-4 py-2.5 text-sm font-medium transition hover:border-[var(--brand-espresso)] hover:bg-[var(--brand-espresso)] hover:text-white"
        >
          Limpiar filtros
        </button>
      )}
    </>
  );
}

export default function PublicProductCatalog({
  type,
  title,
  description,
  filterLayout = "top",
  actionLabel = "Agregar al carrito",
  showNewBadge = false,
  heroImage,
  heroImagePosition = "center",
  restrictToClipOn = false,
  showClipOnFilter = true,
  visualVariant = "default",
}: PublicProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [shapeFilter, setShapeFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [clipOnOnly, setClipOnOnly] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/catalog/products", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        const activeProducts = data.products.filter(
          (product: Product) =>
            product.type === type &&
            product.isActive &&
            (restrictToClipOn
              ? product.clipOnCompatible === true
              : type !== "eyeglasses" || product.clipOnCompatible !== true)
        );

        setProducts(activeProducts);
      } catch (error) {
        console.error(error);
        setError("No pudimos cargar los productos desde PostgreSQL.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [restrictToClipOn, type]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const colorOptions = Array.from(
    new Set(products.map((product) => product.frameColor).filter(Boolean))
  ).filter((color): color is string => Boolean(color)).sort((firstColor, secondColor) =>
    firstColor.localeCompare(secondColor, "es")
  );

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      normalizedSearchTerm === "" ||
      [
        product.name,
        product.description,
        product.category,
        product.gender,
        product.shape,
        product.frameColor,
        product.frameSize,
        product.frameMaterial,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm);

    const matchesGender =
      genderFilter === "all" || product.gender === genderFilter;
    const matchesShape =
      shapeFilter === "all" || product.shape === shapeFilter;
    const matchesColor =
      colorFilter === "all" || product.frameColor === colorFilter;
    const matchesSize =
      sizeFilter === "all" || product.frameSize === sizeFilter;
    const matchesMaterial =
      materialFilter === "all" || product.frameMaterial === materialFilter;
    const matchesPrice = product.price <= maxPrice;
    const matchesClipOn = !clipOnOnly || product.clipOnCompatible;

    return (
      matchesSearch &&
      matchesGender &&
      matchesShape &&
      matchesColor &&
      matchesSize &&
      matchesMaterial &&
      matchesPrice &&
      matchesClipOn
    );
  });

  const visibleProducts = [...filteredProducts].sort((first, second) => {
    if (sortOption === "price-asc") return first.price - second.price;
    if (sortOption === "price-desc") return second.price - first.price;
    if (sortOption === "name") return first.name.localeCompare(second.name, "es");

    return (
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime()
    );
  });

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    genderFilter !== "all" ||
    shapeFilter !== "all" ||
    colorFilter !== "all" ||
    sizeFilter !== "all" ||
    materialFilter !== "all" ||
    maxPrice !== MAX_PRICE ||
    clipOnOnly;

  function resetFilters() {
    setSearchTerm("");
    setGenderFilter("all");
    setShapeFilter("all");
    setColorFilter("all");
    setSizeFilter("all");
    setMaterialFilter("all");
    setMaxPrice(MAX_PRICE);
    setClipOnOnly(false);
  }

  function renderSidebarFilters() {
    return (
      <CatalogFilterControls
        searchTerm={searchTerm}
        genderFilter={genderFilter}
        shapeFilter={shapeFilter}
        colorFilter={colorFilter}
        sizeFilter={sizeFilter}
        materialFilter={materialFilter}
        maxPrice={maxPrice}
        clipOnOnly={clipOnOnly}
        colorOptions={colorOptions}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={setSearchTerm}
        onGenderChange={setGenderFilter}
        onShapeChange={setShapeFilter}
        onColorChange={setColorFilter}
        onSizeChange={setSizeFilter}
        onMaterialChange={setMaterialFilter}
        onMaxPriceChange={setMaxPrice}
        onClipOnChange={setClipOnOnly}
        onReset={resetFilters}
        showClipOnFilter={showClipOnFilter}
        optical={visualVariant === "optical"}
      />
    );
  }

  const topFilters = (
    <div className="rounded-3xl border border-black/10 bg-[#fafafa] p-4 md:p-5">
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
        <label>
          <span className="sr-only">Buscar productos</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por modelo, color o forma..."
            className="h-12 w-full rounded-full border border-black/15 bg-white px-5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
          />
        </label>

        <label>
          <span className="sr-only">Filtrar por género</span>
          <select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value)}
            className="h-12 w-full rounded-full border border-black/15 bg-white px-5 text-sm outline-none transition focus:border-black"
          >
            <option value="all">Todos los géneros</option>
            <option value="unisex">Unisex</option>
            <option value="hombre">Hombre</option>
            <option value="mujer">Mujer</option>
          </select>
        </label>

        <label>
          <span className="sr-only">Filtrar por forma</span>
          <select
            value={shapeFilter}
            onChange={(event) => setShapeFilter(event.target.value)}
            className="h-12 w-full rounded-full border border-black/15 bg-white px-5 text-sm outline-none transition focus:border-black"
          >
            <option value="all">Todas las formas</option>
            <option value="rectangular">Rectangular</option>
            <option value="cuadrado">Cuadrado</option>
            <option value="redondo">Redondo</option>
            <option value="aviador">Aviador</option>
          </select>
        </label>
      </div>
    </div>
  );

  const results = loading ? (
    <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[28px] border border-black/10 p-3"
        >
          <div className="aspect-[4/3] rounded-[22px] bg-gray-100" />
          <div className="space-y-3 px-2 py-5">
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="h-6 w-2/3 rounded bg-gray-100" />
            <div className="h-4 w-full rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  ) : error ? (
    <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
      {error}
    </div>
  ) : visibleProducts.length === 0 ? (
    <div className="mt-10 rounded-3xl border border-black/10 bg-[#fafafa] p-10 text-center">
      <h2 className="text-2xl font-semibold">No encontramos productos</h2>
      <p className="mt-3 text-gray-600">
        Intenta cambiar los filtros o buscar con otro texto.
      </p>
      <button
        type="button"
        onClick={resetFilters}
        className="mt-6 rounded-full border border-black/20 px-5 py-2.5 text-sm font-medium transition hover:border-[var(--brand-espresso)] hover:bg-[var(--brand-espresso)] hover:text-white"
      >
        Ver todos los modelos
      </button>
    </div>
  ) : (
    <div
      className={`mt-8 grid items-stretch gap-x-6 gap-y-10 sm:grid-cols-2 ${
        filterLayout === "sidebar" ? "xl:grid-cols-3" : "lg:grid-cols-3"
      }`}
    >
      {visibleProducts.map((product) => (
        <ProductCard
          key={product.slug}
          slug={product.slug}
          name={product.name}
          price={product.price}
          category={product.category}
          color={getCardColor(product.frameColor)}
          href={`/product/${product.slug}`}
          stock={product.stock}
          availableOnline={product.isAvailable}
          purchasableOnline={product.purchasableOnline}
          favoritable={product.favoritable}
          imageUrl={product.mainImage?.imageUrl}
          imageAltText={product.mainImage?.altText}
          actionLabel={actionLabel}
          isNew={showNewBadge && isProductNew(product.createdAt)}
          visualVariant={visualVariant}
        />
      ))}
    </div>
  );

  const resultsHeader = !loading && !error && (
    <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-600">
        {visibleProducts.length}{" "}
        {visibleProducts.length === 1 ? "modelo" : "modelos"}
        <span className="text-gray-400"> de {products.length}</span>
      </p>

      <label className="flex items-center gap-3 text-sm">
        <span className="font-medium">Ordenar por</span>
        <select
          value={sortOption}
          onChange={(event) => setSortOption(event.target.value as SortOption)}
          className="rounded-full border border-black/15 bg-white px-4 py-2 outline-none transition focus:border-[var(--brand-espresso)]"
        >
          <option value="newest">Más nuevos</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="name">Nombre</option>
        </select>
      </label>
    </div>
  );

  const isOptical = visualVariant === "optical";

  return (
    <main className={isOptical ? "min-h-screen bg-[#f7f3ee] text-[#171717]" : "min-h-screen bg-white text-black"}>
      <section className={isOptical ? "border-b border-[#d9cfc8] bg-[#f7f3ee]" : "relative isolate min-h-[330px] overflow-hidden border-b border-black/10 bg-[#f7f3ee] md:min-h-[390px]"}>
        {!isOptical && heroImage && (
          <Image
            src={heroImage}
            alt=""
            fill
            sizes="100vw"
            fetchPriority="high"
            loading="eager"
            className="object-cover"
            style={{ objectPosition: heroImagePosition }}
          />
        )}
        {!isOptical && <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,243,238,0.97)_0%,rgba(247,243,238,0.9)_38%,rgba(247,243,238,0.35)_65%,rgba(247,243,238,0.05)_100%)]" />}
        <div className={isOptical ? "mx-auto max-w-[1440px] px-5 pb-10 pt-16 sm:px-6 md:pb-14 md:pt-24" : "relative mx-auto flex min-h-[330px] max-w-[1440px] items-center px-6 py-14 md:min-h-[390px] md:px-10 md:py-20"}>
          <div className="max-w-xl text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
              {isOptical ? "ÓPTICOS" : "Colección OLM"}
            </p>
            <h1 className={isOptical ? "mt-4 text-4xl font-medium tracking-[-0.03em] md:text-6xl" : "mt-3 text-5xl font-bold tracking-[-0.04em] md:text-6xl lg:text-7xl"}>
              {isOptical ? "Lentes para todos los días" : title}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-gray-700 md:text-lg">
              {description}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-6 md:py-14">
        {filterLayout === "sidebar" ? (
          <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-12">
            <aside className={`hidden border-r pr-8 lg:block ${isOptical ? "border-[#d9cfc8]" : "border-black/10"}`}>
              <div>
                <div className="mb-7 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Filtrar por</h2>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-xs font-semibold underline underline-offset-4"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                {renderSidebarFilters()}
              </div>
            </aside>

            <div className="min-w-0">
              <details className="mb-8 rounded-2xl border border-black/10 bg-[#fafafa] p-4 lg:hidden">
                <summary className="cursor-pointer list-none text-sm font-semibold">
                  Filtros
                  {hasActiveFilters && (
                    <span className="ml-2 rounded-full bg-[var(--brand-espresso)] px-2 py-0.5 text-xs text-white">
                      Activos
                    </span>
                  )}
                </summary>
                <div className="mt-6 border-t border-black/10 pt-6">
                  {renderSidebarFilters()}
                </div>
              </details>

              {resultsHeader}
              {results}
            </div>
          </div>
        ) : (
          <>
            {topFilters}
            <div className="mt-8">{resultsHeader}</div>
            {results}
          </>
        )}
      </section>
    </main>
  );
}
