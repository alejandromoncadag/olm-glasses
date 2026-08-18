"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

import CartItems from "@/components/CartItems";
import { CART_UPDATED_EVENT } from "@/lib/cart";
import type {
  AuthoritativeCart,
  AuthoritativeCartIssue,
} from "@/lib/commerce/types";

function money(value: string, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

function opticalText(value: unknown, key: "name" | "code" = "name") {
  if (!value || typeof value !== "object") return null;
  const text = (value as Record<string, unknown>)[key];
  return typeof text === "string" && text.trim() ? text : null;
}

const issueLabels: Record<AuthoritativeCartIssue, string> = {
  inactive: "Producto inactivo",
  unpublished: "Ya no está publicado",
  purchase_disabled: "Compra en línea deshabilitada",
  unavailable: "Agotado",
  quantity_exceeds_total_availability: "La cantidad supera la disponibilidad total",
  price_changed: "El precio cambió",
  requires_review: "Requiere revisión",
};

const BLOCKING_ISSUES = new Set<AuthoritativeCartIssue>([
  "inactive",
  "unpublished",
  "purchase_disabled",
  "unavailable",
  "quantity_exceeds_total_availability",
  "price_changed",
]);

function hasBlockingIssue(item: AuthoritativeCart["items"][number]) {
  const reservation = item.configuration?.reservation;
  const hasActiveOpticalReservation = Boolean(
    item.configuration?.opticalDraftId &&
    reservation && typeof reservation === "object" &&
    ((reservation as Record<string, unknown>).status === "active" || (reservation as Record<string, unknown>).status === "activa") &&
    typeof (reservation as Record<string, unknown>).expiresAt === "string" &&
    new Date(String((reservation as Record<string, unknown>).expiresAt)).getTime() > Date.now()
  );
  return item.issues.some((issue) => {
    if (hasActiveOpticalReservation && (issue === "unavailable" || issue === "quantity_exceeds_total_availability")) return false;
    return BLOCKING_ISSUES.has(issue);
  });
}

function announceCount(cart: AuthoritativeCart) {
  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: { authoritative: true, count: cart.itemCount },
    })
  );
}

export default function CommerceCartItems({ returnTo }: { returnTo: string }) {
  const [mode, setMode] = useState<"loading" | "legacy" | "shadow" | "optica">("loading");
  const [cart, setCart] = useState<AuthoritativeCart | null>(null);
  const [error, setError] = useState("");
  const [busyItem, setBusyItem] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/commerce/cart", { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as {
      mode?: "legacy" | "shadow" | "optica";
      cart?: AuthoritativeCart;
      error?: string;
    };
    if (!response.ok) throw new Error(payload.error || "No pudimos cargar el carrito.");
    if (payload.mode !== "optica") {
      setMode(payload.mode || "legacy");
      return;
    }
    if (!payload.cart) throw new Error("La respuesta del carrito no es válida.");
    setMode("optica");
    setCart(payload.cart);
    announceCount(payload.cart);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      void load().catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "No pudimos cargar el carrito.");
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [load]);

  async function mutate(path: string, method: "PATCH" | "POST" | "DELETE", body?: unknown) {
    const response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      cart?: AuthoritativeCart;
      error?: string;
    };
    if (!response.ok || !payload.cart) throw new Error(payload.error || "No se pudo actualizar el carrito.");
    setCart(payload.cart);
    announceCount(payload.cart);
  }

  if (mode === "legacy" || mode === "shadow") {
    return <CartItems returnTo={returnTo} />;
  }
  if (mode === "loading" && !error) {
    return <div className="mt-10 rounded-2xl border p-8 text-center text-gray-600">Cargando carrito…</div>;
  }
  if (error) {
    return (
      <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-red-800">No pudimos cargar tu carrito</h2>
        <p className="mt-2 text-red-700">{error}</p>
        <button type="button" onClick={() => { setError(""); void load().catch((reason) => setError(String(reason))); }} className="mt-5 rounded-full border border-red-300 bg-white px-5 py-2 text-sm">Intentar de nuevo</button>
      </div>
    );
  }
  if (!cart || cart.items.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border p-10 text-center">
        <div className="text-4xl" aria-hidden>🛒</div>
        <h2 className="mt-5 text-2xl font-semibold">Tu carrito está vacío</h2>
        <p className="mt-3 text-gray-600">Los productos que agregues se guardarán durante 30 días si visitas como invitado.</p>
        <a href="/sunglasses" className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-white">Ver productos</a>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <a href={returnTo} className="mb-7 inline-flex text-sm font-medium text-gray-600 hover:text-black">← Continuar comprando</a>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <article key={item.itemId} className="rounded-2xl border bg-white p-5">
              <div className="grid gap-5 md:grid-cols-[140px_1fr_auto]">
                <a href={`/product/${encodeURIComponent(item.slug)}`} className="relative flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                  {item.image ? <Image src={item.image.url} alt={item.image.altText || item.name} fill sizes="140px" unoptimized className="h-full w-full object-cover" /> : <span className="px-4 text-center text-xs text-gray-500">Imagen del producto</span>}
                </a>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">{item.category.replaceAll("_", " ")}</p>
                  <h2 className="mt-1 text-xl font-semibold">{item.name}</h2>
                  <p className="mt-1 text-xs text-gray-500">SKU {item.sku}</p>
                  {Boolean(item.configuration?.opticalDraftId) && (
                    <div className="mt-3 space-y-0.5 text-sm text-[#2d1f1a]">
                      {opticalText(item.configuration.lensDesign) && <p>{opticalText(item.configuration.lensDesign)}</p>}
                      <p>{opticalText(item.configuration.treatment) || "Sin tratamiento"}</p>
                      {opticalText(item.configuration.variant) && <p>{opticalText(item.configuration.variant)}</p>}
                      <p>Receta: {item.configuration.prescriptionStatus === "provided" ? "guardada" : item.configuration.prescriptionStatus === "received_pending_validation" ? "recibida" : item.configuration.prescriptionStatus === "exam_requested" || item.configuration.prescriptionMethod === "exam" ? "examen solicitado" : "pendiente"}</p>
                      <p className="text-xs text-[#765b50]">Armazón reservado temporalmente</p>
                    </div>
                  )}
                  {!item.configuration?.opticalDraftId && item.issues.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.issues.map((issue) => <span key={issue} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{issueLabels[issue]}</span>)}
                    </div>
                  )}
                  {!item.configuration?.opticalDraftId && <p className="mt-3 text-sm text-gray-600">Disponibilidad total informativa: {item.totalOnlineAvailability}</p>}
                  {!item.configuration?.opticalDraftId && (item.maximumQuantityPerLine === null ? (
                    <p className="mt-1 text-xs text-gray-500">Sin límite configurado; sujeto a existencias disponibles.</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">Máximo especial configurado: {item.maximumQuantityPerLine}</p>
                  ))}
                  {item.priceChanged && (
                    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
                      <p>Precio anterior observado: <strong>{money(item.previouslyObservedPrice, item.currency)}</strong></p>
                      <p>Precio actual: <strong>{money(item.currentPrice, item.currency)}</strong></p>
                      <button type="button" disabled={busyItem === item.itemId} onClick={async () => { setBusyItem(item.itemId); setError(""); try { await mutate(`/api/commerce/cart/items/${item.itemId}/acknowledge-price`, "POST"); } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); } finally { setBusyItem(null); } }} className="mt-3 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Aceptar precio actual</button>
                    </div>
                  )}
                </div>
                <div className="md:text-right">
                  <p className="font-semibold">{money(item.currentPrice, item.currency)}</p>
                  <p className="mt-1 text-sm text-gray-500">Total: {money(item.lineTotal, item.currency)}</p>
                  <div className="mt-4 flex items-center gap-3 md:justify-end">
                    <button type="button" disabled={busyItem === item.itemId} onClick={async () => { setBusyItem(item.itemId); try { if (item.quantity === 1) await mutate(`/api/commerce/cart/items/${item.itemId}`, "DELETE"); else await mutate(`/api/commerce/cart/items/${item.itemId}`, "PATCH", { quantity: item.quantity - 1 }); } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); } finally { setBusyItem(null); } }} className="flex h-9 w-9 items-center justify-center rounded-full border">−</button>
                    <span className="min-w-8 text-center font-medium">{item.quantity}</span>
                    <button type="button" disabled={busyItem === item.itemId} onClick={async () => { setBusyItem(item.itemId); try { await mutate(`/api/commerce/cart/items/${item.itemId}`, "PATCH", { quantity: item.quantity + 1 }); } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); } finally { setBusyItem(null); } }} className="flex h-9 w-9 items-center justify-center rounded-full border">+</button>
                  </div>
                  <button type="button" disabled={busyItem === item.itemId} onClick={async () => { setBusyItem(item.itemId); try { await mutate(`/api/commerce/cart/items/${item.itemId}`, "DELETE"); } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); } finally { setBusyItem(null); } }} className="mt-4 text-sm text-gray-500 underline hover:text-red-600">Quitar</button>
                </div>
              </div>
            </article>
          ))}
          <button type="button" onClick={async () => { if (!confirm("¿Seguro que quieres vaciar el carrito?")) return; setBusyItem("clear"); try { await mutate("/api/commerce/cart", "DELETE"); } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); } finally { setBusyItem(null); } }} className="text-sm text-gray-500 underline hover:text-red-600">Vaciar carrito</button>
        </div>
        <aside className="h-fit rounded-2xl border border-[#d9cfc8] bg-[#faf8f5] p-6 lg:sticky lg:top-24">
          <h2 className="text-2xl font-semibold">Resumen del pedido</h2>
          <p className="mt-2 text-sm text-gray-500">{cart.itemCount} {cart.itemCount === 1 ? "producto" : "productos"}</p>
          {(() => {
            const subtotal = Number(cart.subtotal || 0);
            const remaining = Math.max(0, 1100 - subtotal);
            return <>
              <dl className="mt-6 space-y-4 border-t border-[#d9cfc8] pt-5 text-sm">
                <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-medium">{money(cart.subtotal, cart.currency)}</dd></div>
                <div className="flex justify-between"><dt>Envío</dt><dd className="font-medium">{remaining === 0 ? "Gratis" : money("99")}</dd></div>
              </dl>
              {remaining > 0 ? <p className="mt-4 text-sm text-[#765b50]">Agrega {money(String(remaining), cart.currency)} más para obtener envío estándar gratis. Mientras tanto, el envío cuesta {money("99", cart.currency)}.</p> : <p className="mt-4 text-sm text-[#765b50]">Envío estándar gratis en compras desde $1,100 MXN.</p>}
              {cart.items.some(hasBlockingIssue) && <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Revisa los avisos de tus productos antes de continuar.</div>}
              <div className="mt-6 border-t border-[#d9cfc8] pt-5"><div className="flex justify-between text-lg font-semibold"><span>Total estimado</span><span>{money(cart.subtotal, cart.currency)}</span></div><p className="mt-1 text-xs text-gray-500">El total final se confirma al elegir la entrega.</p></div>
              <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#765b50]">Pagos aceptados</p><div className="mt-3 flex flex-wrap items-center gap-2">{["visa.png", "mastercard.png", "AE.png", "oxxo.png", "spei.png", "paypal.png"].map((logo) => <div key={logo} className="flex h-7 w-12 items-center justify-center rounded border border-[#d9cfc8] bg-white p-1"><Image src={`/payments/${logo}`} alt={logo === "AE.png" ? "American Express" : logo.replace(".png", "")} width={44} height={24} className="h-auto max-h-5 w-auto object-contain" /></div>)}</div><p className="mt-3 text-xs text-gray-500">Tu información se procesa de forma segura.</p></div>
              <button type="button" disabled={cart.items.some(hasBlockingIssue)} onClick={() => { window.location.href = "/checkout"; }} className="mt-7 w-full bg-[#2d1f1a] px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#1f1511] disabled:cursor-not-allowed disabled:bg-[#b8ada6]">Continuar</button>
            </>;
          })()}
        </aside>
      </div>
    </div>
  );
}
