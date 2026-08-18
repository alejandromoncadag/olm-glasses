"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  OpticalOption,
  OpticalOptionsResponse,
  OpticalPreviewResponse,
  OpticalVariant,
} from "@/lib/optical/types";

type Props = {
  product: {
    productId: string;
    slug: string;
    name: string;
    price: number;
    stock: number;
    branches: Array<{
      branchId: string;
      branchCode: string;
      branchName: string;
      availableQuantity: number;
    }>;
  };
};

type Step = "design" | "treatment" | "review";

function numberFromMoney(value: string) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function money(value: string | number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(typeof value === "number" ? value : numberFromMoney(value));
}

function adjustment(value: string, currency: string) {
  const parsed = numberFromMoney(value);
  return parsed === 0 ? "Incluido" : `+${money(parsed, currency)}`;
}

export default function AuthoritativeOpticalPreviewPanel({ product }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("design");
  const [options, setOptions] = useState<OpticalOptionsResponse | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<OpticalOption | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<OpticalOption | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<OpticalVariant | null>(null);
  const [preview, setPreview] = useState<OpticalPreviewResponse | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState("");
  const availableBranches = useMemo(
    () => product.branches.filter((branch) => branch.availableQuantity > 0),
    [product.branches]
  );
  const [selectedBranchId, setSelectedBranchId] = useState(
    availableBranches.length === 1 ? availableBranches[0].branchId : ""
  );
  const [prescriptionMethod, setPrescriptionMethod] = useState<"later" | "exam">("later");
  const [creatingDraft, setCreatingDraft] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadOptions() {
      setLoadingOptions(true);
      setError("");
      try {
        const response = await fetch(
          `/api/optical/options?frameProductId=${encodeURIComponent(product.productId)}`,
          { cache: "no-store", signal: controller.signal }
        );
        const payload = (await response.json()) as OpticalOptionsResponse & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || "No se pudieron cargar las opciones.");
        }
        setOptions(payload);
      } catch (loadError) {
        if ((loadError as Error).name !== "AbortError") {
          setError((loadError as Error).message);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => controller.abort();
  }, [product.productId]);

  const previewInput = useMemo(() => {
    if (!selectedDesign || !selectedDesign.productId || !selectedTreatment) return null;
    if (selectedTreatment.requiresVariant && !selectedVariant) return null;
    return {
      frameProductId: Number(product.productId),
      lensDesignProductId: Number(selectedDesign.productId),
      treatmentProductId: selectedTreatment.productId
        ? Number(selectedTreatment.productId)
        : null,
      treatmentVariantId: selectedVariant ? Number(selectedVariant.variantId) : null,
    };
  }, [product.productId, selectedDesign, selectedTreatment, selectedVariant]);

  useEffect(() => {
    if (!previewInput) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingPreview(true);
      setError("");
      try {
        const response = await fetch("/api/optical/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(previewInput),
          signal: controller.signal,
        });
        const payload = (await response.json()) as OpticalPreviewResponse & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || "No se pudo confirmar el precio.");
        }
        setPreview(payload);
      } catch (previewError) {
        if ((previewError as Error).name !== "AbortError") {
          setError((previewError as Error).message);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingPreview(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [previewInput]);

  function chooseDesign(option: OpticalOption) {
    setPreview(null);
    setSelectedDesign(option);
    setSelectedTreatment(null);
    setSelectedVariant(null);
    setStep("treatment");
  }

  function chooseTreatment(option: OpticalOption) {
    setPreview(null);
    setSelectedTreatment(option);
    setSelectedVariant(null);
    if (!option.requiresVariant) setStep("review");
  }

  function chooseVariant(variant: OpticalVariant) {
    setPreview(null);
    setSelectedVariant(variant);
    setStep("review");
  }

  const currency = options?.currency || "MXN";
  const steps: Array<{ id: Step; label: string; enabled: boolean }> = [
    { id: "design", label: "Diseño", enabled: true },
    { id: "treatment", label: "Tratamiento", enabled: Boolean(selectedDesign) },
    {
      id: "review",
      label: "Revisar",
      enabled: Boolean(
        selectedDesign &&
          selectedTreatment &&
          (!selectedTreatment.requiresVariant || selectedVariant)
      ),
    },
  ];

  async function createDraft() {
    if (!preview || !previewInput || !selectedBranchId) return;
    setCreatingDraft(true);
    setError("");
    try {
      const response = await fetch("/api/optical/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...previewInput,
          previewFingerprint: preview.previewFingerprint,
          prescriptionMethod,
          branchId: Number(selectedBranchId),
          intendedUse: null,
        }),
      });
      const payload = (await response.json()) as {
        draftPublicId?: string;
        error?: string;
        details?: { currentPreview?: OpticalPreviewResponse };
      };
      if (!response.ok || !payload.draftPublicId) {
        if (payload.details?.currentPreview) setPreview(payload.details.currentPreview);
        throw new Error(payload.error || "No se pudo reservar temporalmente el armazón.");
      }
      const attach = await fetch(`/api/optical/drafts/${encodeURIComponent(payload.draftPublicId)}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `optical-cart-${payload.draftPublicId}`,
        },
        body: JSON.stringify({
          previewFingerprint: preview.previewFingerprint,
          configuredTotal: preview.configuredTotal,
        }),
      });
      const attachPayload = (await attach.json().catch(() => ({}))) as { error?: string; details?: { message?: string } };
      if (!attach.ok) throw new Error(attachPayload.details?.message || attachPayload.error || "No pudimos agregar la configuración al carrito.");
      router.push("/cart");
    } catch (draftError) {
      setError((draftError as Error).message);
    } finally {
      setCreatingDraft(false);
    }
  }

  return (
    <section className="mt-10 border-t border-black/15 bg-white pb-16">
      <div className="sticky top-[92px] z-20 border-b border-black/10 bg-white/95 py-5 backdrop-blur-md">
        <div className="grid grid-cols-3 gap-3">
          {steps.map((item, index) => (
            <button
              key={item.id}
              type="button"
              disabled={!item.enabled}
              onClick={() => setStep(item.id)}
              className={`border-b-2 pb-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                step === item.id
                  ? "border-[#2d1f1a] text-[#2d1f1a]"
                  : "border-black/10 text-gray-400 hover:text-black disabled:cursor-default disabled:opacity-35"
              }`}
            >
              0{index + 1} {item.label}
            </button>
          ))}
        </div>
      </div>

      {loadingOptions && (
        <p className="py-10 text-sm text-gray-600">Cargando opciones autorizadas…</p>
      )}
      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loadingOptions && options && step === "design" && (
        <OptionSection
          eyebrow="Paso 1 de 3"
          title="Elige el diseño de tus micas"
          description="Los precios vienen directamente del catálogo de OPTICAOLM."
          options={options.lensDesigns}
          selectedId={selectedDesign?.productId || null}
          currency={currency}
          onChoose={chooseDesign}
        />
      )}

      {!loadingOptions && options && step === "treatment" && (
        <div>
          <OptionSection
            eyebrow="Paso 2 de 3"
            title="Elige un tratamiento"
            description="Puedes elegir un tratamiento o continuar sin tratamiento adicional."
            options={options.treatments}
            selectedId={selectedTreatment?.productId || "none"}
            currency={currency}
            onChoose={chooseTreatment}
          />
          {selectedTreatment?.requiresVariant && (
            <div className="mt-9 border-t border-black/10 pt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#765b50]">
                Variante requerida
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedTreatment.variants.map((variant) => (
                  <button
                    key={variant.variantId}
                    type="button"
                    onClick={() => chooseVariant(variant)}
                    aria-pressed={selectedVariant?.variantId === variant.variantId}
                    className={`min-h-20 border px-4 py-3 text-left transition ${
                      selectedVariant?.variantId === variant.variantId
                        ? "border-[#2d1f1a] bg-[#f7f3ee] shadow-[inset_3px_0_0_#2d1f1a]"
                        : "border-black/15 hover:border-[#2d1f1a]"
                    }`}
                  >
                    <span className="block font-[Georgia,'Times_New_Roman',serif] text-lg">
                      {variant.name}
                    </span>
                    {variant.displayAdjustment && (
                      <span className="mt-1 block text-xs text-gray-500">
                        {adjustment(variant.displayAdjustment, currency)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loadingOptions && options && step === "review" && selectedDesign && selectedTreatment && (
        <div className="pt-9">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#765b50]">
            Paso 3 de 3
          </p>
          <h2 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-4xl tracking-[-0.03em]">
            Revisa tu configuración
          </h2>

          <div className="mt-8 divide-y divide-black/10 border-y border-black/15">
            <ReviewLine label="Armazón" value={preview?.frame.name || product.name} amount={preview?.frame.price} currency={currency} />
            <ReviewLine label="Diseño" value={preview?.lensDesign.name || selectedDesign.name} amount={preview?.lensDesign.adjustment} currency={currency} onEdit={() => setStep("design")} />
            <ReviewLine label="Tratamiento" value={preview?.treatment?.name || selectedTreatment.name} amount={preview?.treatment?.adjustment || "0.00"} currency={currency} onEdit={() => setStep("treatment")} />
            {selectedVariant && <ReviewLine label="Variante" value={preview?.variant?.name || selectedVariant.name} currency={currency} />}
          </div>

          <div className="mt-8 border border-black/10 bg-[#f7f3ee] p-6 sm:p-8">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#765b50]">
                  Total confirmado
                </p>
                <p className="mt-2 font-[Georgia,'Times_New_Roman',serif] text-4xl">
                  {preview ? money(preview.configuredTotal, preview.currency) : "—"}
                </p>
              </div>
              <p className="text-right text-xs text-gray-500">
                {loadingPreview ? "Confirmando precio…" : "Vista previa; no es una reservación"}
              </p>
            </div>

            <div className="mt-7 grid gap-6 border-t border-black/10 pt-6 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Sucursal de existencias
                {availableBranches.length > 1 ? (
                  <select
                    value={selectedBranchId}
                    onChange={(event) => setSelectedBranchId(event.target.value)}
                    className="mt-2 h-12 w-full border border-black/20 bg-white px-3"
                  >
                    <option value="">Elige una sucursal</option>
                    {availableBranches.map((branch) => (
                      <option key={branch.branchId} value={branch.branchId}>
                        {branch.branchName} · {branch.availableQuantity} disponible(s)
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="mt-2 block border border-black/15 bg-white p-3 font-normal">
                    {availableBranches[0]?.branchName || "Sin existencias disponibles"}
                  </span>
                )}
              </label>

              <fieldset>
                <legend className="text-sm font-medium">¿Cómo enviarás tu receta?</legend>
                <div className="mt-2 grid gap-2">
                  <label className="flex cursor-pointer gap-3 border border-black/15 bg-white p-3 text-sm">
                    <input type="radio" name="prescription" checked={prescriptionMethod === "later"} onChange={() => setPrescriptionMethod("later")} />
                    La enviaré después
                  </label>
                  <label className="flex cursor-pointer gap-3 border border-black/15 bg-white p-3 text-sm">
                    <input type="radio" name="prescription" checked={prescriptionMethod === "exam"} onChange={() => setPrescriptionMethod("exam")} />
                    Necesito examen de la vista
                  </label>
                </div>
              </fieldset>
            </div>

            <button
              type="button"
              disabled={!preview || loadingPreview || creatingDraft || !selectedBranchId}
              onClick={createDraft}
              className="mt-7 h-14 w-full bg-[#2d1f1a] px-6 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#4b3027] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {availableBranches.length === 0
                ? "Armazón agotado"
                : creatingDraft
                  ? "Creando pedido…"
                  : "Continuar con este pedido"}
            </button>

            <p className="mt-3 text-xs leading-5 text-gray-500">
              Reservaremos temporalmente solo el armazón durante 20 minutos. No se agregará al carrito normal y todavía no se generará ningún pago ni venta.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function OptionSection({
  eyebrow,
  title,
  description,
  options,
  selectedId,
  currency,
  onChoose,
}: {
  eyebrow: string;
  title: string;
  description: string;
  options: OpticalOption[];
  selectedId: string | null;
  currency: string;
  onChoose: (option: OpticalOption) => void;
}) {
  return (
    <div className="pt-9">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#765b50]">{eyebrow}</p>
      <h2 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-4xl tracking-[-0.03em]">{title}</h2>
      <p className="mt-4 text-sm leading-6 text-gray-600">{description}</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const optionId = option.productId || "none";
          return (
            <button
              key={optionId}
              type="button"
              onClick={() => onChoose(option)}
              aria-pressed={selectedId === optionId}
              className={`min-h-36 border p-5 text-left transition ${
                selectedId === optionId
                  ? "border-[#2d1f1a] bg-[#f7f3ee] shadow-[inset_4px_0_0_#2d1f1a]"
                  : "border-black/15 hover:border-[#2d1f1a]"
              }`}
            >
              <span className="block font-[Georgia,'Times_New_Roman',serif] text-2xl">{option.name}</span>
              <span className="mt-2 block min-h-10 text-sm leading-5 text-gray-600">{option.description}</span>
              <span className="mt-4 block text-sm font-semibold">{adjustment(option.displayAdjustment, currency)}</span>
              {option.requiresVariant && <span className="mt-2 block text-xs text-[#765b50]">Requiere elegir una variante</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewLine({
  label,
  value,
  amount,
  currency,
  onEdit,
}: {
  label: string;
  value: string;
  amount?: string;
  currency: string;
  onEdit?: () => void;
}) {
  return (
    <div className="grid gap-2 py-5 sm:grid-cols-[110px_1fr_auto] sm:items-start">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#765b50]">{label}</span>
      <span>
        <span className="block font-[Georgia,'Times_New_Roman',serif] text-lg">{value}</span>
        {onEdit && <button type="button" onClick={onEdit} className="mt-1 text-[10px] uppercase tracking-[0.12em] underline underline-offset-4">Editar</button>}
      </span>
      {amount !== undefined && <span className="text-sm font-semibold">{label === "Armazón" ? money(amount, currency) : adjustment(amount, currency)}</span>}
    </div>
  );
}
