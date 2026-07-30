"use client";

import { useEffect, useRef, useState } from "react";

import { readCart, writeCart, type CartItem } from "@/lib/cart";

type PurchaseStep = "lenses" | "treatment" | "review";

type LensOption = {
  id: string;
  eyebrow: string;
  label: string;
  description: string;
  highlights: string[];
  extraPrice: number;
  requiresPrescription: boolean;
  visual: "single" | "clear" | "sun";
};

type TreatmentOption = {
  id: string;
  label: string;
  description: string;
  highlights: string[];
  extraPrice: number;
  badge?: string;
  visual: "essential" | "digital" | "photochromic";
};

type ProductPurchasePanelProps = {
  product: {
    slug: string;
    name: string;
    price: number;
    stock: number;
  };
};

const steps: Array<{ id: PurchaseStep; label: string }> = [
  { id: "lenses", label: "Lentes" },
  { id: "treatment", label: "Tratamiento" },
  { id: "review", label: "Revisar" },
];

const lensOptions: LensOption[] = [
  {
    id: "single-vision",
    eyebrow: "Con graduación",
    label: "Graduación sencilla",
    description: "Corrige un solo campo de visión: lejos o cerca.",
    highlights: ["Mica oftálmica", "Receta por confirmar después"],
    extraPrice: 0,
    requiresPrescription: true,
    visual: "single",
  },
  {
    id: "no-prescription",
    eyebrow: "Sin graduación",
    label: "Mica transparente",
    description: "Para usar el armazón sin corrección visual.",
    highlights: ["Protección UV", "No requiere receta"],
    extraPrice: 0,
    requiresPrescription: false,
    visual: "clear",
  },
  {
    id: "sunglasses",
    eyebrow: "Protección solar",
    label: "Lentes de sol",
    description: "Convierte este modelo en unos lentes para exteriores.",
    highlights: ["Filtro UV", "Tinte solar clásico"],
    extraPrice: 300,
    requiresPrescription: false,
    visual: "sun",
  },
];

const treatmentOptions: TreatmentOption[] = [
  {
    id: "essential",
    label: "Tratamiento esencial",
    description: "Una opción clara y resistente para todos los días.",
    highlights: ["Protección UV", "Capa antirreflejante"],
    extraPrice: 0,
    visual: "essential",
  },
  {
    id: "digital",
    label: "Protección digital",
    description: "Mayor comodidad para pantallas y luz artificial.",
    highlights: ["Filtro de luz azul", "Capa antirreflejante"],
    extraPrice: 350,
    badge: "Recomendado",
    visual: "digital",
  },
  {
    id: "photochromic",
    label: "Fotocromático",
    description: "Se oscurece con la luz exterior y aclara en interiores.",
    highlights: ["Adaptación a la luz", "Protección UV"],
    extraPrice: 750,
    visual: "photochromic",
  },
];

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

export default function ProductPurchasePanel({
  product,
}: ProductPurchasePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState<PurchaseStep>("lenses");
  const [selectedLens, setSelectedLens] = useState<LensOption | null>(null);
  const [selectedTreatment, setSelectedTreatment] =
    useState<TreatmentOption | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const lensPrice = selectedLens?.extraPrice ?? 0;
  const treatmentPrice = selectedTreatment?.extraPrice ?? 0;
  const finalPrice = product.price + lensPrice + treatmentPrice;
  const completedSelections =
    Number(Boolean(selectedLens)) + Number(Boolean(selectedTreatment));
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  useEffect(() => {
    if (!summaryOpen) return;

    const previousOverflow = document.body.style.overflow;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSummaryOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [summaryOpen]);

  function focusPanelTop() {
    window.requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function goToStep(step: PurchaseStep) {
    setCurrentStep(step);
    setSummaryOpen(false);
    focusPanelTop();
  }

  function selectLens(option: LensOption) {
    setSelectedLens(option);
    setSelectedTreatment(null);
    setCurrentStep("treatment");
    focusPanelTop();
  }

  function selectTreatment(option: TreatmentOption) {
    setSelectedTreatment(option);
    setCurrentStep("review");
    focusPanelTop();
  }

  function canOpenStep(step: PurchaseStep) {
    if (step === "lenses") return true;
    if (step === "treatment") return Boolean(selectedLens);
    return Boolean(selectedLens && selectedTreatment);
  }

  function handleAddToCart() {
    if (isOutOfStock || !selectedLens || !selectedTreatment) return;

    const currentCart = readCart();
    const cartSlug = `${product.slug}-${selectedLens.id}-${selectedTreatment.id}`;
    const totalQuantityForProduct = currentCart
      .filter(
        (item) =>
          item.slug === product.slug ||
          item.slug.startsWith(`${product.slug}-`)
      )
      .reduce((sum, item) => sum + item.quantity, 0);

    if (totalQuantityForProduct >= product.stock) {
      window.alert("No hay más piezas disponibles de este producto.");
      return;
    }

    const existingItem = currentCart.find((item) => item.slug === cartSlug);
    const prescriptionMethod = selectedLens.requiresPrescription
      ? "Receta por confirmar después de la compra"
      : "No requiere receta";
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
          lensOption: `${selectedLens.label} · ${selectedTreatment.label}`,
          prescriptionMethod,
        },
      ];
    }

    writeCart(updatedCart);
    window.location.href = "/cart";
  }

  return (
    <div
      ref={panelRef}
      className="relative mt-10 scroll-mt-28 overflow-visible border-t border-black/15 bg-white"
    >
      <div className="sticky top-[92px] z-20 border-b border-black/10 bg-white/95 pb-5 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              if (currentStepIndex > 0) {
                goToStep(steps[currentStepIndex - 1].id);
              }
            }}
            disabled={currentStepIndex === 0}
            className="inline-flex h-10 items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-gray-500 transition hover:text-black disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeftIcon />
            Atrás
          </button>

          <button
            type="button"
            onClick={() => setSummaryOpen((open) => !open)}
            className="relative -mr-3 inline-flex h-11 translate-x-3 items-center gap-2 border border-r-0 border-[#2d1f1a] bg-[#2d1f1a] pl-4 pr-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_24px_rgba(45,31,26,0.16)] transition duration-300 hover:-translate-x-0.5 hover:bg-[#4b3027]"
            aria-expanded={summaryOpen}
            aria-controls="purchase-selection-summary"
          >
            <SelectionIcon />
            Tus selecciones
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] text-[#2d1f1a]">
              {completedSelections}
            </span>
          </button>
        </div>

        <div className="mt-5 h-px overflow-hidden bg-black/10">
          <div
            className="h-full bg-[#2d1f1a] transition-[width] duration-700 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {steps.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (canOpenStep(step.id)) goToStep(step.id);
                }}
                disabled={!canOpenStep(step.id)}
                className={`text-left text-[10px] font-medium uppercase tracking-[0.18em] transition ${
                  isCurrent
                    ? "text-[#2d1f1a]"
                    : isCompleted
                      ? "text-gray-600 hover:text-black"
                      : "cursor-default text-gray-300"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className="mr-1.5 tabular-nums">0{index + 1}</span>
                {step.label}
              </button>
            );
          })}
        </div>

      </div>

      <SelectionSummary
        open={summaryOpen}
        product={product}
        selectedLens={selectedLens}
        selectedTreatment={selectedTreatment}
        finalPrice={finalPrice}
        onEdit={goToStep}
        onClose={() => setSummaryOpen(false)}
      />

      <div className="min-h-[560px] py-9 sm:py-11">
        {currentStep === "lenses" && (
          <StepIntro
            eyebrow="Paso 1 de 3"
            title="¿Qué tipo de lentes necesitas?"
            description="Elige la opción que mejor se adapte a tu visión. Podrás confirmar tu receta después de agregar el armazón al carrito."
          />
        )}

        {currentStep === "lenses" && (
          <div className="mt-7 grid gap-3">
            {lensOptions.map((option) => (
              <OptionCard
                key={option.id}
                selected={selectedLens?.id === option.id}
                disabled={isOutOfStock}
                onClick={() => selectLens(option)}
                visual={<LensVisual type={option.visual} />}
                eyebrow={option.eyebrow}
                title={option.label}
                description={option.description}
                highlights={option.highlights}
                price={option.extraPrice}
              />
            ))}
          </div>
        )}

        {currentStep === "treatment" && (
          <>
            <StepIntro
              eyebrow="Paso 2 de 3"
              title="Elige el tratamiento"
              description="Personaliza tus micas según tu rutina. El precio mostrado se suma al armazón."
            />

            <div className="mt-7 grid gap-3">
              {treatmentOptions.map((option) => (
                <OptionCard
                  key={option.id}
                  selected={selectedTreatment?.id === option.id}
                  disabled={isOutOfStock}
                  onClick={() => selectTreatment(option)}
                  visual={<TreatmentVisual type={option.visual} />}
                  title={option.label}
                  description={option.description}
                  highlights={option.highlights}
                  price={option.extraPrice}
                  badge={option.badge}
                />
              ))}
            </div>
          </>
        )}

        {currentStep === "review" && selectedLens && selectedTreatment && (
          <ReviewStep
            product={product}
            selectedLens={selectedLens}
            selectedTreatment={selectedTreatment}
            finalPrice={finalPrice}
            isOutOfStock={isOutOfStock}
            onEdit={goToStep}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>
    </div>
  );
}

function StepIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#765b50]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-[2rem] font-normal leading-[1.08] tracking-[-0.025em] text-[#211916] sm:text-[2.65rem]">
        {title}
      </h2>
      <p className="mt-4 max-w-xl text-[13px] leading-6 text-[#6d6561]">
        {description}
      </p>
    </div>
  );
}

function OptionCard({
  selected,
  disabled,
  onClick,
  visual,
  eyebrow,
  title,
  description,
  highlights,
  price,
  badge,
}: {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  visual: React.ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  highlights: string[];
  price: number;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`group relative grid min-h-36 w-full grid-cols-[76px_minmax(0,1fr)] gap-4 overflow-hidden border px-4 py-5 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2d1f1a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:grid-cols-[94px_minmax(0,1fr)_auto] sm:items-center sm:px-6 sm:py-6 ${
        selected
          ? "border-[#2d1f1a] bg-[#faf8f5] shadow-[inset_4px_0_0_#2d1f1a]"
          : "border-black/15 bg-white hover:border-[#2d1f1a]/70 hover:bg-[#fcfbf9]"
      }`}
    >
      {badge && (
        <span className="absolute right-0 top-0 bg-[#2d1f1a] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.16em] text-white">
          {badge}
        </span>
      )}

      <span className="grid h-[72px] w-[72px] place-items-center bg-[#f5f2ee] sm:h-[84px] sm:w-[84px]">
        {visual}
      </span>

      <span className="min-w-0">
        {eyebrow && (
          <span className="block text-[9px] font-medium uppercase tracking-[0.2em] text-[#765b50]">
            {eyebrow}
          </span>
        )}
        <span className="mt-1.5 block pr-10 font-[Georgia,'Times_New_Roman',serif] text-[1.28rem] font-normal leading-tight text-[#211916]">
          {title}
        </span>
        <span className="mt-2 block text-[13px] leading-5 text-[#6d6561]">
          {description}
        </span>
        <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] uppercase tracking-[0.07em] text-[#776f6b]">
          {highlights.map((highlight) => (
            <span key={highlight} className="inline-flex items-center gap-1">
              <CheckIcon />
              {highlight}
            </span>
          ))}
        </span>
      </span>

      <span className="col-start-2 flex items-center justify-between gap-4 text-[12px] font-medium sm:col-start-auto sm:justify-end sm:self-end">
        <span className="whitespace-nowrap">
          {price > 0 ? `+${formatMoney(price)}` : "Incluido"}
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-full border border-black/20 transition duration-300 group-hover:border-[#2d1f1a] group-hover:bg-[#2d1f1a] group-hover:text-white">
          <ArrowRightIcon />
        </span>
      </span>
    </button>
  );
}

function ReviewStep({
  product,
  selectedLens,
  selectedTreatment,
  finalPrice,
  isOutOfStock,
  onEdit,
  onAddToCart,
}: {
  product: ProductPurchasePanelProps["product"];
  selectedLens: LensOption;
  selectedTreatment: TreatmentOption;
  finalPrice: number;
  isOutOfStock: boolean;
  onEdit: (step: PurchaseStep) => void;
  onAddToCart: () => void;
}) {
  return (
    <div>
      <StepIntro
        eyebrow="Paso 3 de 3"
        title="Revisa tu selección"
        description="Confirma los lentes y el tratamiento antes de añadir el producto al carrito."
      />

      <div className="mt-8 divide-y divide-black/10 border-y border-black/15">
        <ReviewRow
          label="Armazón"
          value={product.name}
          price={product.price}
        />
        <ReviewRow
          label="Lentes"
          value={selectedLens.label}
          secondary={
            selectedLens.requiresPrescription
              ? "Receta por confirmar después"
              : "No requiere receta"
          }
          price={selectedLens.extraPrice}
          onEdit={() => onEdit("lenses")}
        />
        <ReviewRow
          label="Tratamiento"
          value={selectedTreatment.label}
          secondary={selectedTreatment.highlights.join(" · ")}
          price={selectedTreatment.extraPrice}
          onEdit={() => onEdit("treatment")}
        />
      </div>

      <div className="mt-8 border border-black/10 bg-[#f7f3ee] p-5 sm:p-7">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#765b50]">
              Total de tu selección
            </p>
            <p className="mt-2 font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.03em] sm:text-4xl">
              {formatMoney(finalPrice)}
            </p>
          </div>
          <p className="pb-1 text-right text-xs leading-5 text-gray-500">
            Impuestos incluidos
          </p>
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          disabled={isOutOfStock}
          className="mt-7 flex h-14 w-full items-center justify-center gap-3 bg-[#2d1f1a] px-8 text-xs font-medium uppercase tracking-[0.15em] text-white transition duration-300 hover:bg-[#4b3027] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d1f1a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f3ee] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isOutOfStock ? "Producto agotado" : "Añadir al carrito"}
          {!isOutOfStock && <ArrowRightIcon />}
        </button>

        {!isOutOfStock && (
          <p className="mt-3 text-center text-xs leading-5 text-gray-500">
            Después revisarás tu carrito antes de continuar al checkout.
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  secondary,
  price,
  onEdit,
}: {
  label: string;
  value: string;
  secondary?: string;
  price: number;
  onEdit?: () => void;
}) {
  return (
    <div className="grid gap-3 py-5 sm:grid-cols-[110px_1fr_auto] sm:items-start sm:px-2 sm:py-6">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#765b50]">
        {label}
      </span>
      <span>
        <span className="block font-[Georgia,'Times_New_Roman',serif] text-lg font-normal">
          {value}
        </span>
        {secondary && (
          <span className="mt-1 block text-xs leading-5 text-gray-500">
            {secondary}
          </span>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] underline decoration-black/30 underline-offset-4"
          >
            Editar
          </button>
        )}
      </span>
      <span className="text-sm font-medium">
        {price > 0 ? `+${formatMoney(price)}` : "Incluido"}
      </span>
    </div>
  );
}

function SelectionSummary({
  open,
  product,
  selectedLens,
  selectedTreatment,
  finalPrice,
  onEdit,
  onClose,
}: {
  open: boolean;
  product: ProductPurchasePanelProps["product"];
  selectedLens: LensOption | null;
  selectedTreatment: TreatmentOption | null;
  finalPrice: number;
  onEdit: (step: PurchaseStep) => void;
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-[80] transition-[visibility] ${
        open
          ? "visible pointer-events-auto"
          : "invisible pointer-events-none delay-500"
      }`}
      aria-hidden={!open}
      inert={!open}
    >
      <button
        type="button"
        aria-label="Cerrar tus selecciones"
        onClick={onClose}
        className={`absolute inset-0 bg-black/25 backdrop-blur-[1px] transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        id="purchase-selection-summary"
        role="dialog"
        aria-modal="true"
        aria-label="Tus selecciones"
        className={`absolute right-0 top-0 flex h-dvh w-full max-w-[430px] flex-col bg-[#f8f5f0] shadow-[-28px_0_70px_rgba(23,16,13,0.2)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-6 sm:px-8">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-[#765b50]">
              Configuración OLM
            </p>
            <h3 className="mt-2 font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.025em]">
              Tus selecciones
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-11 w-11 place-items-center rounded-full border border-black/15 transition hover:border-[#2d1f1a] hover:bg-[#2d1f1a] hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 px-6 py-8 sm:px-8">
          <div className="border-y border-black/15">
            <SummaryLine label="Armazón" value={product.name} />
            <SummaryLine
              label="Lentes"
              value={selectedLens?.label || "Por elegir"}
              onClick={() => onEdit("lenses")}
            />
            <SummaryLine
              label="Tratamiento"
              value={selectedTreatment?.label || "Por elegir"}
              onClick={
                selectedLens ? () => onEdit("treatment") : undefined
              }
            />
          </div>
        </div>

        <div className="border-t border-black/10 bg-white px-6 py-6 sm:px-8">
          <div className="flex items-end justify-between gap-5">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#765b50]">
              Total actual
            </span>
            <span className="font-[Georgia,'Times_New_Roman',serif] text-2xl">
              {formatMoney(finalPrice)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 h-12 w-full bg-[#2d1f1a] text-[10px] font-medium uppercase tracking-[0.18em] text-white transition hover:bg-[#4b3027]"
          >
            Continuar configurando
          </button>
        </div>
      </aside>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-black/10 py-5 last:border-b-0">
      <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#765b50]">
        {label}
      </span>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="max-w-[230px] text-right font-[Georgia,'Times_New_Roman',serif] text-lg underline decoration-black/25 underline-offset-4"
        >
          {value}
        </button>
      ) : (
        <span className="max-w-[230px] text-right font-[Georgia,'Times_New_Roman',serif] text-lg">
          {value}
        </span>
      )}
    </div>
  );
}

function LensVisual({ type }: { type: LensOption["visual"] }) {
  const fill =
    type === "sun"
      ? "url(#sun-lens)"
      : type === "single"
        ? "url(#single-lens)"
        : "rgba(255,255,255,.76)";

  return (
    <svg viewBox="0 0 92 62" width="70" height="50" aria-hidden>
      <defs>
        <linearGradient id="sun-lens" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5d493c" />
          <stop offset="1" stopColor="#2d211d" />
        </linearGradient>
        <linearGradient id="single-lens" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8f1f2" />
          <stop offset=".48" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d8e3e7" />
        </linearGradient>
      </defs>
      <path
        d="M11 17c9-8 24-7 32 1l-2 24c-8 8-22 8-29 0L11 17Z"
        fill={fill}
        stroke="#938a83"
        strokeWidth="1.2"
      />
      <path
        d="M49 18c8-8 23-9 32-1l-1 25c-7 8-21 8-29 0l-2-24Z"
        fill={fill}
        stroke="#938a83"
        strokeWidth="1.2"
      />
      <path d="M42 22c3-2 5-2 8 0" fill="none" stroke="#938a83" />
      {type !== "sun" && (
        <path
          d="M17 21c5-4 12-5 19-1M55 21c5-4 12-5 19-1"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".9"
        />
      )}
    </svg>
  );
}

function TreatmentVisual({
  type,
}: {
  type: TreatmentOption["visual"];
}) {
  return (
    <svg viewBox="0 0 82 64" width="66" height="52" aria-hidden>
      <defs>
        <linearGradient id="digital-treatment" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dff8ff" />
          <stop offset=".5" stopColor="#eff8fa" />
          <stop offset="1" stopColor="#afdcec" />
        </linearGradient>
        <linearGradient id="photo-treatment" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0ebe6" />
          <stop offset=".55" stopColor="#a29187" />
          <stop offset="1" stopColor="#49382f" />
        </linearGradient>
      </defs>
      <path
        d="M13 10c16-6 36-5 53 3 5 12 3 28-5 40-13 4-30 3-43-2-8-11-10-28-5-41Z"
        fill={
          type === "digital"
            ? "url(#digital-treatment)"
            : type === "photochromic"
              ? "url(#photo-treatment)"
              : "#f8f8f6"
        }
        stroke="#a59d97"
        strokeWidth="1.2"
      />
      <path
        d="M20 16c9-4 19-4 29-1"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".85"
      />
      {type === "digital" && (
        <path
          d="M23 45 46 18M35 50l23-27"
          fill="none"
          stroke="#67c2df"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".75"
        />
      )}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m3.5 8.3 2.7 2.7 6.3-6.3" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m12.5 4.5-5.5 5.5 5.5 5.5M7.5 10h8" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m7.5 4.5 5.5 5.5-5.5 5.5M12.5 10h-8" />
    </svg>
  );
}

function SelectionIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="3.5" cy="4.5" r="1" />
      <circle cx="3.5" cy="10" r="1" />
      <circle cx="3.5" cy="15.5" r="1" />
      <path d="M7 4.5h9M7 10h9M7 15.5h9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}
