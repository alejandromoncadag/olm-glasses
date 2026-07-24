"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import {
  cfdiUses,
  getPaymentMethodLabel,
  taxRegimes,
} from "@/lib/invoiceRequests";

type OrderSummary = {
  id: string;
  orderNumber: string;
  orderDate: string;
  total: number;
  totalCents: number;
  currency: string;
  paymentMethod: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
  };
};

type TaxProfile = {
  id: string;
  rfc: string;
  taxName: string;
  fiscalPostalCode: string;
  taxRegime: string;
  cfdiUse: string;
  invoiceEmail: string;
  isDefault: boolean;
};

type FiscalForm = {
  rfc: string;
  taxName: string;
  fiscalPostalCode: string;
  taxRegime: string;
  cfdiUse: string;
  invoiceEmail: string;
};

const emptyFiscalForm: FiscalForm = {
  rfc: "",
  taxName: "",
  fiscalPostalCode: "",
  taxRegime: "",
  cfdiUse: "",
  invoiceEmail: "",
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function InvoiceRequestFlow() {
  const [step, setStep] = useState<"lookup" | "fiscal" | "success">("lookup");
  const [lookup, setLookup] = useState({ orderNumber: "", purchaseEmail: "" });
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [accountOrders, setAccountOrders] = useState<OrderSummary[]>([]);
  const [taxProfiles, setTaxProfiles] = useState<TaxProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [fiscalForm, setFiscalForm] =
    useState<FiscalForm>(emptyFiscalForm);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    requestNumber: string;
    message: string;
  } | null>(null);
  const [saveTaxProfile, setSaveTaxProfile] = useState(true);
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => {
    async function loadCustomerOrders() {
      try {
        const response = await fetch("/api/invoice-requests/validate");

        if (response.status === 401) return;

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No pudimos cargar tus pedidos.");
        }

        setAuthenticated(Boolean(data.authenticated));
        setAccountOrders(data.orders || []);
        setTaxProfiles(data.taxProfiles || []);
        setLookup((current) => ({
          ...current,
          purchaseEmail: data.customer?.email || current.purchaseEmail,
        }));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar tus pedidos."
        );
      } finally {
        setCheckingAccount(false);
      }
    }

    void loadCustomerOrders();
  }, []);

  function applyTaxProfile(profile: TaxProfile) {
    setSelectedProfileId(profile.id);
    setFiscalForm({
      rfc: profile.rfc,
      taxName: profile.taxName,
      fiscalPostalCode: profile.fiscalPostalCode,
      taxRegime: profile.taxRegime,
      cfdiUse: profile.cfdiUse,
      invoiceEmail: profile.invoiceEmail,
    });
    setIsDefault(profile.isDefault);
  }

  function continueWithOrder(
    selectedOrder: OrderSummary,
    profiles = taxProfiles
  ) {
    setOrder(selectedOrder);
    setLookup({
      orderNumber: selectedOrder.orderNumber,
      purchaseEmail: selectedOrder.customer.email,
    });
    setFiscalForm({
      ...emptyFiscalForm,
      taxName: selectedOrder.customer.fullName,
      invoiceEmail: selectedOrder.customer.email,
    });
    setError("");
    setStep("fiscal");

    const defaultProfile = profiles.find((profile) => profile.isDefault);
    if (defaultProfile) applyTaxProfile(defaultProfile);
  }

  async function validateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/invoice-requests/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lookup),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No pudimos validar la compra.");
      }

      const profiles = (data.taxProfiles || []) as TaxProfile[];
      setAuthenticated(Boolean(data.authenticated));
      setTaxProfiles(profiles);
      continueWithOrder(data.order, profiles);
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "No pudimos validar la compra."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitInvoiceRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/invoice-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          purchaseEmail: order.customer.email,
          customerTaxProfileId: selectedProfileId || null,
          saveTaxProfile: authenticated && saveTaxProfile,
          isDefault: authenticated && isDefault,
          ...fiscalForm,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No pudimos enviar la solicitud.");
      }

      setSuccess({
        requestNumber: data.invoiceRequest.requestNumber,
        message: data.message,
      });
      setStep("success");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No pudimos enviar la solicitud."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateFiscalField(field: keyof FiscalForm, value: string) {
    setFiscalForm((current) => ({ ...current, [field]: value }));
    if (selectedProfileId) setSelectedProfileId("");
  }

  if (step === "success" && success) {
    return (
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#d9cfc8] bg-white p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f2e8] text-2xl text-[#315b38]">
          ✓
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#6b4a3f]">
          Solicitud recibida
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Estamos revisando tus datos fiscales
        </h1>
        <p className="mt-4 text-gray-600">{success.message}</p>
        <div className="mt-7 rounded-2xl bg-[#f7f3ee] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Folio de solicitud
          </p>
          <p className="mt-2 text-xl font-semibold">{success.requestNumber}</p>
        </div>
        <p className="mt-6 text-sm leading-6 text-gray-500">
          Este proceso todavía es manual. Te enviaremos los archivos XML y PDF
          al email fiscal cuando el equipo los haya emitido.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full border border-[#4a2d23] px-6 py-3 text-sm text-[#4a2d23] transition hover:bg-[#4a2d23] hover:text-white"
        >
          Volver al inicio
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.16em]">
        <span
          className={`rounded-full px-4 py-2 ${
            step === "lookup" ? "bg-[#4a2d23] text-white" : "bg-white"
          }`}
        >
          1 · Encuentra tu compra
        </span>
        <span className="h-px w-10 bg-black/15" />
        <span
          className={`rounded-full px-4 py-2 ${
            step === "fiscal" ? "bg-[#4a2d23] text-white" : "bg-white"
          }`}
        >
          2 · Datos fiscales
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="mx-auto mb-6 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {step === "lookup" ? (
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-[#4a2d23] p-8 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
              Facturación electrónica
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Solicita tu factura de Óptica OLM
            </h1>
            <p className="mt-5 leading-7 text-white/75">
              Primero confirmaremos tu compra. Después podrás capturar los datos
              fiscales exactamente como aparecen en tu constancia fiscal.
            </p>
            <div className="mt-8 space-y-4 text-sm text-white/80">
              <p>01 · Valida el pedido y el email de compra.</p>
              <p>02 · Captura o confirma tus datos fiscales.</p>
              <p>03 · Nuestro equipo revisa y emite la factura manualmente.</p>
            </div>
            <p className="mt-9 border-t border-white/20 pt-6 text-xs leading-5 text-white/55">
              La dirección de envío no se usa como domicilio fiscal. Siempre
              tendrás que ingresar o confirmar el código postal fiscal.
            </p>
          </section>

          <section className="rounded-[2rem] border border-[#d9cfc8] bg-white p-8 sm:p-10">
            <h2 className="text-2xl font-semibold">Encuentra tu compra</h2>
            <p className="mt-2 text-sm text-gray-600">
              Usa los mismos datos que aparecen en tu confirmación de compra.
            </p>

            {checkingAccount ? (
              <p className="mt-8 text-sm text-gray-500">
                Buscando pedidos de tu cuenta…
              </p>
            ) : authenticated && accountOrders.length > 0 ? (
              <div className="mt-7">
                <p className="text-sm font-semibold">
                  Pedidos elegibles de tu cuenta
                </p>
                <div className="mt-3 space-y-3">
                  {accountOrders.map((accountOrder) => (
                    <article
                      key={accountOrder.orderNumber}
                      className="rounded-2xl border border-black/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            {accountOrder.orderNumber}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(accountOrder.orderDate)} ·{" "}
                            {formatMoney(accountOrder.total)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => continueWithOrder(accountOrder)}
                          className="rounded-full border border-[#4a2d23] px-4 py-2 text-sm text-[#4a2d23] transition hover:bg-[#4a2d23] hover:text-white"
                        >
                          Facturar este pedido
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="my-7 flex items-center gap-3">
                  <span className="h-px flex-1 bg-black/10" />
                  <span className="text-xs uppercase tracking-[0.16em] text-gray-400">
                    u otro pedido
                  </span>
                  <span className="h-px flex-1 bg-black/10" />
                </div>
              </div>
            ) : authenticated ? (
              <p className="mt-7 rounded-2xl bg-[#f7f3ee] p-4 text-sm text-gray-600">
                No encontramos pedidos elegibles en tu cuenta. También puedes
                buscar una compra con sus datos.
              </p>
            ) : (
              <p className="mt-7 rounded-2xl bg-[#f7f3ee] p-4 text-sm text-gray-600">
                ¿Tienes cuenta?{" "}
                <Link href="/login" className="font-semibold underline">
                  Inicia sesión
                </Link>{" "}
                para ver tus pedidos elegibles.
              </p>
            )}

            <form onSubmit={validateOrder} className="mt-7 space-y-5">
              <InvoiceField
                label="Número de pedido / recibo"
                value={lookup.orderNumber}
                onChange={(value) =>
                  setLookup((current) => ({
                    ...current,
                    orderNumber: value.toUpperCase(),
                  }))
                }
                placeholder="OLM-1234567890"
              />
              <InvoiceField
                label="Email de compra"
                type="email"
                value={lookup.purchaseEmail}
                onChange={(value) =>
                  setLookup((current) => ({
                    ...current,
                    purchaseEmail: value,
                  }))
                }
                placeholder="tu@email.com"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-[#4a2d23] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#321e18] disabled:opacity-60"
              >
                {submitting ? "Validando compra…" : "Continuar"}
              </button>
            </form>
          </section>
        </div>
      ) : (
        order && (
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <aside className="h-fit rounded-[2rem] bg-[#4a2d23] p-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                Compra encontrada
              </p>
              <h1 className="mt-4 text-3xl font-semibold">
                {order.orderNumber}
              </h1>
              <dl className="mt-7 space-y-5 text-sm">
                <OrderDetail label="Fecha" value={formatDate(order.orderDate)} />
                <OrderDetail label="Cliente" value={order.customer.fullName} />
                <OrderDetail label="Email" value={order.customer.email} />
                <OrderDetail
                  label="Forma de pago"
                  value={getPaymentMethodLabel(order.paymentMethod)}
                />
                <OrderDetail
                  label="Total"
                  value={formatMoney(order.total)}
                  strong
                />
              </dl>
              <button
                type="button"
                onClick={() => {
                  setStep("lookup");
                  setOrder(null);
                  setError("");
                }}
                className="mt-8 text-sm text-white/75 underline underline-offset-4 hover:text-white"
              >
                Buscar otro pedido
              </button>
            </aside>

            <section className="rounded-[2rem] border border-[#d9cfc8] bg-white p-8 sm:p-10">
              <h2 className="text-3xl font-semibold">Datos fiscales</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Captura la información fiscal por separado. No usaremos
                automáticamente la dirección de envío.
              </p>

              {taxProfiles.length > 0 && (
                <div className="mt-7 rounded-2xl bg-[#f7f3ee] p-5">
                  <label className="text-sm font-semibold">
                    Reutilizar un perfil fiscal guardado
                    <select
                      value={selectedProfileId}
                      onChange={(event) => {
                        const profile = taxProfiles.find(
                          (item) => item.id === event.target.value
                        );
                        if (profile) applyTaxProfile(profile);
                        else setSelectedProfileId("");
                      }}
                      className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal outline-none focus:border-[#4a2d23]"
                    >
                      <option value="">Capturar datos nuevos</option>
                      {taxProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.rfc} · {profile.taxName}
                          {profile.isDefault ? " · Predeterminado" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <form onSubmit={submitInvoiceRequest} className="mt-7">
                <div className="grid gap-5 sm:grid-cols-2">
                  <InvoiceField
                    label="RFC"
                    value={fiscalForm.rfc}
                    onChange={(value) =>
                      updateFiscalField("rfc", value.toUpperCase())
                    }
                    placeholder="XAXX010101000"
                    maxLength={13}
                  />
                  <InvoiceField
                    label="Nombre / razón social fiscal"
                    value={fiscalForm.taxName}
                    onChange={(value) => updateFiscalField("taxName", value)}
                  />
                  <InvoiceField
                    label="Código postal fiscal"
                    value={fiscalForm.fiscalPostalCode}
                    onChange={(value) =>
                      updateFiscalField(
                        "fiscalPostalCode",
                        value.replace(/\D/g, "").slice(0, 5)
                      )
                    }
                    inputMode="numeric"
                    maxLength={5}
                  />
                  <InvoiceSelect
                    label="Régimen fiscal"
                    value={fiscalForm.taxRegime}
                    onChange={(value) =>
                      updateFiscalField("taxRegime", value)
                    }
                    options={taxRegimes}
                  />
                  <InvoiceSelect
                    label="Uso CFDI"
                    value={fiscalForm.cfdiUse}
                    onChange={(value) => updateFiscalField("cfdiUse", value)}
                    options={cfdiUses}
                  />
                  <InvoiceField
                    label="Email para factura"
                    type="email"
                    value={fiscalForm.invoiceEmail}
                    onChange={(value) =>
                      updateFiscalField("invoiceEmail", value)
                    }
                  />
                </div>

                {authenticated && (
                  <div className="mt-6 rounded-2xl border border-black/10 p-5 text-sm">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={saveTaxProfile}
                        onChange={(event) =>
                          setSaveTaxProfile(event.target.checked)
                        }
                        className="mt-1"
                      />
                      <span>
                        <strong className="block">Guardar perfil fiscal</strong>
                        Podrás reutilizar estos datos en futuras solicitudes.
                      </span>
                    </label>
                    {saveTaxProfile && (
                      <label className="mt-4 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isDefault}
                          onChange={(event) => setIsDefault(event.target.checked)}
                        />
                        Usar como perfil fiscal predeterminado
                      </label>
                    )}
                  </div>
                )}

                <p className="mt-6 rounded-2xl bg-[#f7f3ee] p-4 text-xs leading-5 text-gray-600">
                  Verifica que RFC, razón social, régimen y código postal
                  coincidan con tu constancia de situación fiscal. La emisión
                  todavía será revisada manualmente por Óptica OLM.
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full rounded-full bg-[#4a2d23] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#321e18] disabled:opacity-60"
                >
                  {submitting
                    ? "Enviando solicitud…"
                    : "Enviar solicitud de factura"}
                </button>
              </form>
            </section>
          </div>
        )
      )}
    </div>
  );
}

function InvoiceField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none transition focus:border-[#4a2d23]"
      />
    </label>
  );
}

function InvoiceSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none transition focus:border-[#4a2d23]"
      >
        <option value="">Seleccionar</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function OrderDetail({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <dt className="text-white/55">{label}</dt>
      <dd className={`mt-1 ${strong ? "text-xl font-semibold" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
