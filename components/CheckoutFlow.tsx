"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getCountries, getCountryCallingCode, isValidPhoneNumber, parsePhoneNumber, type Country } from "react-phone-number-input";

import GoogleAddressAutocomplete from "@/components/GoogleAddressAutocomplete";
import { useAuth } from "@/hooks/useAuth";
import type { AuthoritativeCart } from "@/lib/commerce/types";
import type { CheckoutPreview, FulfillmentOption, FulfillmentRequest, PickupBranch, Reservation } from "@/lib/fulfillment/types";

type Method = "shipping" | "pickup";
type Step = 1 | 2 | 3 | 4;
type Form = {
  firstName: string; lastName: string; email: string; phoneCountry: Country; phoneNational: string; phone: string;
  street: string; exteriorNumber: string; interiorNumber: string; neighborhood: string;
  postalCode: string; city: string; state: string; references: string; pickupBranchId: string;
};

const emptyForm: Form = { firstName: "", lastName: "", email: "", phoneCountry: "MX", phoneNational: "", phone: "", street: "", exteriorNumber: "", interiorNumber: "", neighborhood: "", postalCode: "", city: "", state: "", references: "", pickupBranchId: "" };

function money(value: string | number, currency = "MXN") { return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(Number(value || 0)); }
function deliveryEstimate(option: FulfillmentOption) { return option.minimumDeliveryDays === option.maximumDeliveryDays ? `${option.maximumDeliveryDays} días` : `${option.minimumDeliveryDays}-${option.maximumDeliveryDays} días`; }
function splitName(value: string) { const parts = value.trim().split(/\s+/).filter(Boolean); return { firstName: parts.shift() || "", lastName: parts.join(" ") }; }
function flag(country: string) { return country.toUpperCase().replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0))); }
function normalizePhone(country: Country, national: string) {
  const digits = national.replace(/\D/g, "");
  return digits ? `+${getCountryCallingCode(country)}${digits}` : "";
}
function validPhone(country: Country, national: string) {
  const digits = national.replace(/\D/g, "");
  if (country === "MX") return /^\d{10}$/.test(digits);
  return Boolean(digits && isValidPhoneNumber(`+${getCountryCallingCode(country)}${digits}`));
}
async function payload(response: Response, fallback: string) { const data = await response.json().catch(() => ({})) as { error?: string; code?: string }; if (!response.ok) { const error = new Error(data.error || fallback) as Error & { code?: string }; error.code = data.code; throw error; } return data as Record<string, unknown>; }

function customerError(reason: unknown, fallback: string) {
  const message = reason instanceof Error ? reason.message : "";
  const normalized = message.toLowerCase();
  if (normalized.includes("reserved inventory") || normalized.includes("reservation lines")) return "No pudimos confirmar la disponibilidad de tu armazón. Actualiza el checkout para intentarlo nuevamente.";
  if ((normalized.includes("reservation") && normalized.includes("expired")) || normalized.includes("reservation window has expired")) return "Tu reserva temporal venció. Verificaremos nuevamente la disponibilidad de tu armazón.";
  if (normalized.includes("shipping option is expired") || normalized.includes("quote is expired")) return "La opción de entrega ya no está disponible. Selecciona otra opción.";
  if (normalized.includes("checkout preview has expired")) return "El resumen de entrega venció. Selecciona nuevamente una opción.";
  if (normalized.includes("cart changed")) return "El carrito cambió. Actualiza el checkout para continuar.";
  if (normalized.includes("select a valid checkout option")) return "Selecciona una opción de entrega para continuar.";
  return message || fallback;
}

function Steps({ step }: { step: Step }) {
  return <div className="mb-8 grid grid-cols-4 gap-2 text-xs">
    {["Contacto", "Entrega", "Método", "Pago"].map((label, index) => <div key={label} className={`border-b-2 px-1 pb-3 ${index + 1 <= step ? "border-[#2d1f1a] text-[#2d1f1a]" : "border-[#d9cfc8] text-stone-400"}`}><span className="font-semibold">0{index + 1}</span><span className="ml-2 hidden sm:inline">{label}</span></div>)}
  </div>;
}

function OpticalSummary({ item }: { item: AuthoritativeCart["items"][number] }) {
  const config = item.configuration;
  const text = (value: unknown) => value && typeof value === "object" && typeof (value as Record<string, unknown>).name === "string" ? String((value as Record<string, unknown>).name) : "";
  if (!config.opticalDraftId) return null;
  return <div className="mt-2 space-y-0.5 text-xs text-[#765b50]"><p>{text(config.lensDesign)}</p><p>{text(config.treatment) || "Sin tratamiento"}</p>{text(config.variant) && <p>{text(config.variant)}</p>}<p>Receta: {config.prescriptionStatus === "provided" ? "guardada" : config.prescriptionStatus === "received_pending_validation" ? "recibida" : config.prescriptionStatus === "exam_requested" || config.prescriptionMethod === "exam" ? "examen solicitado" : "pendiente"}</p></div>;
}

type OrderSummaryProps = { cart: AuthoritativeCart | null; preview: CheckoutPreview | null; method: Method; discount: string; reservationError: boolean; reservationUnavailable: boolean; busy: boolean; onRefresh: () => void };

function OrderSummary(props: OrderSummaryProps) {
  const { preview, cart } = props;
  return <aside className="h-fit border border-[#d9cfc8] bg-[#faf8f5] p-6 lg:sticky lg:top-8">
    <h2 className="font-[Georgia,'Times_New_Roman',serif] text-2xl text-[#2d1f1a]">Resumen del pedido</h2>
    {props.reservationError && <div className="mt-4 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">{props.reservationUnavailable ? "Este armazón ya no está disponible por el momento." : "Tu reserva temporal venció. Verificaremos nuevamente la disponibilidad de tu armazón."}</p><button type="button" onClick={props.onRefresh} disabled={props.busy} className="mt-3 bg-[#2d1f1a] px-3 py-2 font-semibold text-white">VERIFICAR DISPONIBILIDAD</button></div>}
    {cart && <div className="mt-5 space-y-4">{cart.items.map((item) => <div key={item.itemId} className="flex gap-3 border-b border-[#d9cfc8] pb-4"><div className="relative h-16 w-16 shrink-0 overflow-hidden bg-white">{item.image && <Image src={item.image.url} alt={item.image.altText || item.name} fill sizes="64px" unoptimized className="object-cover" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-stone-500">Cantidad: {item.quantity}</p><OpticalSummary item={item} /></div><span className="text-sm font-medium">{money(item.lineTotal, item.currency)}</span></div>)}</div>}
    <dl className="mt-5 space-y-3 text-sm">
      <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(preview?.subtotal || props.cart?.subtotal || "0", preview?.currency || props.cart?.currency || "MXN")}</dd></div>
      {preview && Number(preview.discount) > 0 && <div className="flex justify-between text-emerald-800"><dt>Descuento {preview.discountCode}</dt><dd>-{money(preview.discount, preview.currency)}</dd></div>}
      <div className="flex justify-between"><dt>Envío{props.method === "pickup" ? " · recoger" : ""}</dt><dd>{preview ? money(preview.shipping, preview.currency) : "Se calcula después"}</dd></div>
      <div className="flex justify-between border-t border-[#d9cfc8] pt-4 text-lg font-semibold"><dt>Total</dt><dd>{preview ? money(preview.total, preview.currency) : money(props.cart?.subtotal || "0", props.cart?.currency || "MXN")}</dd></div>
    </dl>
  </aside>;
}

function PaymentPlaceholder({ input }: { input: string }) {
  const [method, setMethod] = useState<"card" | "paypal" | "oxxo" | "spei">("card");
  return <section className="mt-6 border border-[#d9cfc8] p-5"><h3 className="font-[Georgia,'Times_New_Roman',serif] text-2xl text-[#2d1f1a]">Método de pago</h3><div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setMethod("card")} className={`border px-3 py-3 text-left text-sm ${method === "card" ? "border-[#2d1f1a] bg-[#f7f3ee]" : "border-[#d9cfc8]"}`}>Tarjeta de crédito o débito</button><button type="button" onClick={() => setMethod("paypal")} className={`border px-3 py-3 text-left text-sm ${method === "paypal" ? "border-[#2d1f1a] bg-[#f7f3ee]" : "border-[#d9cfc8]"}`}>PayPal</button><button type="button" onClick={() => setMethod("oxxo")} className={`border px-3 py-3 text-left text-sm ${method === "oxxo" ? "border-[#2d1f1a] bg-[#f7f3ee]" : "border-[#d9cfc8]"}`}>OXXO</button><button type="button" onClick={() => setMethod("spei")} className={`border px-3 py-3 text-left text-sm ${method === "spei" ? "border-[#2d1f1a] bg-[#f7f3ee]" : "border-[#d9cfc8]"}`}>SPEI</button></div>{method === "card" && <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm sm:col-span-2">Nombre del tarjetahabiente<input className={input} autoComplete="off" /></label><label className="text-sm sm:col-span-2">Número de tarjeta<input className={input} inputMode="numeric" autoComplete="off" /></label><label className="text-sm">Fecha de vencimiento<input className={input} placeholder="MM/AA" inputMode="numeric" autoComplete="off" /></label><label className="text-sm">Código de seguridad CVV<input className={input} inputMode="numeric" autoComplete="off" /></label><label className="text-sm">Código postal<input className={input} inputMode="numeric" autoComplete="postal-code" /></label></div>}<button type="button" disabled className="mt-6 w-full bg-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-stone-600">PAGAR</button><p className="mt-3 text-center text-sm text-stone-600">Pago disponible próximamente.</p></section>;
}

export default function CheckoutFlow() {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(1); const [method, setMethod] = useState<Method>("shipping");
  const [form, setForm] = useState<Form>(emptyForm); const [branches, setBranches] = useState<PickupBranch[]>([]);
  const [cart, setCart] = useState<AuthoritativeCart | null>(null); const [request, setRequest] = useState<FulfillmentRequest | null>(null);
  const [selectedOption, setSelectedOption] = useState(""); const [preview, setPreview] = useState<CheckoutPreview | null>(null); const [reservation, setReservation] = useState<Reservation | null>(null);
  const [discount, setDiscount] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [reservationUnavailable, setReservationUnavailable] = useState(false);
  const countries = getCountries();

  useEffect(() => { if (!user) return; const names = splitName(user.fullName || ""); const phone = (user as typeof user & { phone?: string }).phone || ""; const parsed = phone ? parsePhoneNumber(phone) : undefined; const timer = window.setTimeout(() => setForm((current) => ({ ...current, ...names, email: user.email || current.email, phoneCountry: parsed?.country || current.phoneCountry, phoneNational: parsed?.nationalNumber || current.phoneNational, phone })), 0); return () => window.clearTimeout(timer); }, [user]);
  useEffect(() => { void fetch("/api/commerce/cart", { cache: "no-store" }).then((response) => payload(response, "No pudimos cargar el carrito.")).then((data) => { if (data.cart) setCart(data.cart as AuthoritativeCart); }).catch((reason) => setError(customerError(reason, "No pudimos cargar el carrito."))); }, []);
  useEffect(() => { if (method !== "pickup" || branches.length) return; void fetch("/api/fulfillment/pickup-branches", { cache: "no-store" }).then((response) => payload(response, "No pudimos cargar las sucursales.")).then((data) => setBranches((data.branches || []) as PickupBranch[])).catch((reason) => setError(customerError(reason, "No pudimos cargar las sucursales."))); }, [method, branches.length]);

  function update(name: keyof Form, value: string) { setForm((current) => ({ ...current, [name]: value })); }
  function applyAddress(parts: { addressLine1: string; street?: string; exteriorNumber?: string; neighborhood?: string; city: string; state: string; postalCode: string }) { setForm((current) => ({ ...current, street: parts.street || parts.addressLine1, exteriorNumber: parts.exteriorNumber || current.exteriorNumber, neighborhood: parts.neighborhood || current.neighborhood, city: parts.city, state: parts.state, postalCode: parts.postalCode })); }
  async function createRequest(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); const normalizedPhone = normalizePhone(form.phoneCountry, form.phoneNational); const body = method === "pickup" ? { method, contact: { fullName: `${form.firstName} ${form.lastName}`.trim(), email: form.email, phone: normalizedPhone }, pickupBranchId: Number(form.pickupBranchId), couponCode: discount.trim().toUpperCase() || null } : { method, contact: { fullName: `${form.firstName} ${form.lastName}`.trim(), email: form.email, phone: normalizedPhone }, couponCode: discount.trim().toUpperCase() || null, address: { street: form.street, exteriorNumber: form.exteriorNumber, interiorNumber: form.interiorNumber || null, neighborhood: form.neighborhood, postalCode: form.postalCode, city: form.city, state: form.state, country: "México", references: form.references || null } };
    try { const data = await payload(await fetch("/api/fulfillment/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), "No pudimos preparar la entrega."); const next = data as unknown as FulfillmentRequest; setRequest(next); setStep(3); if (next.selectedOptionId) setSelectedOption(next.selectedOptionId); } catch (reason) { setError(customerError(reason, "No pudimos preparar la entrega.")); } finally { setBusy(false); } }
  async function chooseOption(optionId: string) { setBusy(true); setError(""); try { await payload(await fetch(`/api/fulfillment/requests/${encodeURIComponent(request?.requestId || "")}/select`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optionId }) }), "No pudimos seleccionar este método."); setSelectedOption(optionId); const data = await payload(await fetch(`/api/fulfillment/requests/${encodeURIComponent(request?.requestId || "")}/preview`, { method: "POST", cache: "no-store" }), "No pudimos actualizar el resumen."); setPreview(data as unknown as CheckoutPreview); setStep(4); } catch (reason) { setError(customerError(reason, "No pudimos seleccionar este método.")); } finally { setBusy(false); } }
  async function reserveAndContinue() { if (!request) return; setBusy(true); setError(""); try { const data = await payload(await fetch(`/api/fulfillment/requests/${encodeURIComponent(request.requestId)}/reservation`, { method: "POST" }), "No pudimos reservar el inventario."); setReservation(data as unknown as Reservation); } catch (reason) { setError(customerError(reason, "No pudimos reservar el inventario.")); } finally { setBusy(false); } }

  async function refreshOpticalReservation() {
    const drafts = cart?.items.map((item) => item.configuration?.opticalDraftId).filter((value): value is string => typeof value === "string") || [];
    if (!drafts.length) return;
    setBusy(true); setError(""); setReservationUnavailable(false);
    try {
      for (const draftId of drafts) {
        const response = await fetch(`/api/optical/drafts/${encodeURIComponent(draftId)}/cart?refreshReservation=1`, { method: "POST" });
        await payload(response, "No pudimos verificar la disponibilidad del armazón.");
      }
      const refreshed = await payload(await fetch("/api/commerce/cart", { cache: "no-store" }), "No pudimos actualizar el carrito.");
      setCart(refreshed.cart as AuthoritativeCart);
      if (request) {
        const nextPreview = await payload(await fetch(`/api/fulfillment/requests/${encodeURIComponent(request.requestId)}/preview`, { method: "POST", cache: "no-store" }), "No pudimos actualizar la entrega.");
        setPreview(nextPreview as unknown as CheckoutPreview);
      }
      setError("");
    } catch (reason) {
      const message = customerError(reason, "No pudimos verificar la disponibilidad del armazón.");
      setReservationUnavailable(message.includes("no está disponible"));
      setError(message);
    } finally { setBusy(false); }
  }

  const input = "mt-1 w-full border border-[#d9cfc8] bg-white px-3 py-3 text-sm outline-none focus:border-[#2d1f1a]";
  const contactValid = Boolean(form.firstName && form.lastName && form.email && validPhone(form.phoneCountry, form.phoneNational));
  const deliveryValid = method === "pickup" ? Boolean(form.pickupBranchId) : Boolean(form.street && form.exteriorNumber && form.neighborhood && form.postalCode && form.city && form.state);
  if (authLoading) return <p className="border border-[#d9cfc8] p-6 text-sm text-stone-600">Cargando checkout…</p>;
  const reservationError = error.toLowerCase().includes("reserva temporal") || error.toLowerCase().includes("reserva óptica") || error.toLowerCase().includes("configured glasses reservation");
  return <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"><div><Steps step={step} />{step === 1 && <form onSubmit={(event) => { event.preventDefault(); if (contactValid) setStep(2); }} className="space-y-5"><h2 className="font-[Georgia,'Times_New_Roman',serif] text-3xl text-[#2d1f1a]">Información de contacto</h2><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Nombre<input required className={input} value={form.firstName} onChange={(event) => update("firstName", event.target.value)} /></label><label className="text-sm">Apellidos<input required className={input} value={form.lastName} onChange={(event) => update("lastName", event.target.value)} /></label><label className="text-sm">Correo electrónico<input required type="email" className={input} value={form.email} onChange={(event) => update("email", event.target.value)} /></label><div><label className="text-sm">Teléfono</label><div className="mt-1 flex gap-2"><select aria-label="País y código de llamada" className={`${input} mt-0 w-[46%]`} value={form.phoneCountry} onChange={(event) => update("phoneCountry", event.target.value)}>{countries.map((country) => <option key={country} value={country}>{flag(country)} +{getCountryCallingCode(country)}</option>)}</select><input required className={`${input} mt-0 flex-1`} inputMode="numeric" autoComplete="tel-national" value={form.phoneNational} onChange={(event) => { const national = event.target.value.replace(/\D/g, "").slice(0, form.phoneCountry === "MX" ? 10 : 15); setForm((current) => ({ ...current, phoneNational: national, phone: normalizePhone(current.phoneCountry, national) })); }} placeholder={form.phoneCountry === "MX" ? "10 dígitos" : "Número nacional"} /></div>{form.phoneNational && !validPhone(form.phoneCountry, form.phoneNational) && <p className="mt-1 text-sm text-red-600">{form.phoneCountry === "MX" ? "El número de México debe tener exactamente 10 dígitos." : "Escribe un número válido."}</p>}</div></div><button className="bg-[#2d1f1a] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white disabled:bg-stone-300" disabled={!contactValid}>Continuar</button></form>}
    {step === 2 && <form onSubmit={createRequest} className="space-y-6"><div><h2 className="font-[Georgia,'Times_New_Roman',serif] text-3xl text-[#2d1f1a]">Forma de entrega</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setMethod("shipping")} className={`border p-5 text-left ${method === "shipping" ? "border-[#2d1f1a] bg-[#f7f3ee]" : "border-[#d9cfc8]"}`}><span className="font-semibold">Enviar a domicilio</span><span className="mt-1 block text-sm text-stone-600">Recibe tu pedido en México.</span></button><button type="button" onClick={() => setMethod("pickup")} className={`border p-5 text-left ${method === "pickup" ? "border-[#2d1f1a] bg-[#f7f3ee]" : "border-[#d9cfc8]"}`}><span className="font-semibold">Recoger en sucursal</span><span className="mt-1 block text-sm text-stone-600">Elige la sucursal OLM más conveniente.</span></button></div></div>{method === "pickup" ? <label className="text-sm">Sucursal<select required className={input} value={form.pickupBranchId} onChange={(event) => update("pickupBranchId", event.target.value)}><option value="">Selecciona una sucursal</option>{branches.map((branch) => <option key={branch.branchId} value={branch.branchId}>{branch.name}{branch.city ? ` · ${branch.city}` : ""}</option>)}</select></label> : <div className="space-y-4"><div><label className="text-sm">Buscar dirección</label><GoogleAddressAutocomplete onSelect={applyAddress} /></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm sm:col-span-2">Calle<input required className={input} value={form.street} onChange={(event) => update("street", event.target.value)} /></label><label className="text-sm">Número exterior<input required className={input} value={form.exteriorNumber} onChange={(event) => update("exteriorNumber", event.target.value)} /></label><label className="text-sm">Interior<input className={input} value={form.interiorNumber} onChange={(event) => update("interiorNumber", event.target.value)} /></label><label className="text-sm">Colonia<input required className={input} value={form.neighborhood} onChange={(event) => update("neighborhood", event.target.value)} /></label><label className="text-sm">Código postal<input required className={input} value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} /></label><label className="text-sm">Ciudad<input required className={input} value={form.city} onChange={(event) => update("city", event.target.value)} /></label><label className="text-sm">Estado<input required className={input} value={form.state} onChange={(event) => update("state", event.target.value)} /></label><label className="text-sm sm:col-span-2">Referencias<input className={input} value={form.references} onChange={(event) => update("references", event.target.value)} /></label></div></div>}<div><label className="text-sm">Agregar cupón o código de descuento<input className={input} value={discount} onChange={(event) => setDiscount(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())} maxLength={40} placeholder="Código" /></label>{discount && discount !== "NEW" && <p className="mt-1 text-sm text-red-600">El cupón no es válido.</p>}{discount === "NEW" && <p className="mt-1 text-sm text-emerald-700">Cupón aplicado</p>}</div><div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="border border-[#2d1f1a] px-6 py-3 text-sm font-semibold">Atrás</button><button type="submit" disabled={!deliveryValid || busy} className="bg-[#2d1f1a] px-6 py-3 text-sm font-semibold text-white disabled:bg-stone-300">{busy ? "Preparando…" : "Continuar"}</button></div></form>}
    {step === 3 && request && <div><h2 className="font-[Georgia,'Times_New_Roman',serif] text-3xl text-[#2d1f1a]">Método de entrega</h2><p className="mt-2 text-sm text-stone-600">Elige una opción disponible para tu pedido.</p><div className="mt-6 space-y-3">{request.options.map((option) => <button type="button" key={option.optionId} disabled={busy} onClick={() => void chooseOption(option.optionId)} className={`w-full border p-5 text-left ${selectedOption === option.optionId ? "border-[#2d1f1a] bg-[#f7f3ee]" : "border-[#d9cfc8]"}`}><div className="flex items-center justify-between gap-4"><div><p className="font-semibold">{option.serviceLevel || option.carrierName}</p><p className="mt-1 text-sm text-stone-600">{option.branchName} · {deliveryEstimate(option)}</p></div><span className="font-semibold">{money(option.amount, option.currency)}</span></div></button>)}</div>{request.options.length === 0 && <p className="mt-6 text-sm text-stone-600">Estamos buscando opciones disponibles…</p>}{error && <p className="mt-5 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button type="button" onClick={() => setStep(2)} className="mt-6 border border-[#2d1f1a] px-6 py-3 text-sm font-semibold">Atrás</button></div>}
    {step === 4 && <div><h2 className="font-[Georgia,'Times_New_Roman',serif] text-3xl text-[#2d1f1a]">Pago</h2><div className="mt-5 border border-[#d9cfc8] p-5 text-sm"><p className="font-semibold">{form.firstName} {form.lastName}</p><p className="mt-1">{form.email} · {form.phone}</p><p className="mt-3 text-stone-600">{method === "pickup" ? `Recoger en ${branches.find((branch) => branch.branchId === form.pickupBranchId)?.name || "sucursal seleccionada"}` : `${form.street} ${form.exteriorNumber}, ${form.city}, ${form.state}`}</p></div><label className="mt-5 block text-sm">Agregar cupón o código de descuento<input disabled value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="Disponible próximamente" className={`${input} bg-stone-100`} /></label>{error && <p className="mt-5 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{preview && <div className="mt-6 border border-[#d9cfc8] p-5"><p className="text-sm text-stone-600">Entrega seleccionada: {preview.fulfillment.serviceLevel}</p>{reservation ? <><p className="mt-3 text-sm text-emerald-800">Inventario reservado temporalmente.</p><PaymentPlaceholder input={input} /></> : <button type="button" onClick={() => void reserveAndContinue()} disabled={busy} className="mt-5 bg-[#2d1f1a] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white disabled:bg-stone-300">{busy ? "Reservando…" : "Continuar al pago"}</button>}</div>}</div>}
    {error && step !== 3 && step !== 4 && <p className="mt-5 bg-red-50 p-3 text-sm text-red-700">{error}</p>}</div><OrderSummary cart={cart} preview={preview} method={method} discount={discount} reservationError={reservationError} reservationUnavailable={reservationUnavailable} busy={busy} onRefresh={() => void refreshOpticalReservation()} /></div>;
}
