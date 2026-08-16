"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import PatientIdentityPanel from "@/components/PatientIdentityPanel";
import GoogleAddressAutocomplete from "@/components/GoogleAddressAutocomplete";
import { locations } from "@/data/locations";

type Address = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type AccountOverview = {
  profile: {
    id: string;
    authUserId: string;
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
    emailVerified: string | null;
  };
  counts: {
    orders: number;
    favorites: number;
    bookings: number;
  };
  orders: Array<{
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    deliveryMethod: string;
    total: number;
    currency: string;
    trackingNumber: string | null;
    createdAt: string;
    items: Array<{ name: string; slug: string; quantity: number }>;
  }>;
  bookings: Array<{
    bookingNumber: string;
    locationSlug: string;
    locationName: string;
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
  }>;
  addresses: Address[];
};

type AddressForm = {
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type AccountTab = "inicio" | "pedidos" | "recetas" | "direcciones";

const emptyAddress: AddressForm = {
  label: "Casa",
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "México",
  isDefault: false,
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    processing: "En preparación",
    completed: "Completado",
    cancelled: "Cancelado",
    unpaid: "Sin pagar",
    paid: "Pagado",
    failed: "Pago fallido",
    refunded: "Reembolsado",
    confirmed: "Confirmada",
  };

  return labels[status] || status;
}

async function readError(response: Response) {
  try {
    const data = await response.json();
    return typeof data.error === "string"
      ? data.error
      : "No pudimos completar la acción.";
  } catch {
    return "No pudimos completar la acción.";
  }
}

export default function AccountDashboard() {
  const {
    user,
    loading: authLoading,
    logout,
    customerAuthConfigured,
  } = useAuth();
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [error, setError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddress);
  const [savingAddress, setSavingAddress] = useState(false);
  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTab>("inicio");

  const loadAccount = useCallback(async () => {
    if (user?.role !== "customer") return;

    setLoadingAccount(true);
    setError("");

    const response = await fetch("/api/account", {
      credentials: "include",
    });

    if (!response.ok) {
      setError(await readError(response));
      setLoadingAccount(false);
      return;
    }

    const data = (await response.json()) as AccountOverview;
    setOverview(data);
    setPhone(data.profile.phone || "");
    setAddressForm((current) => ({
      ...current,
      recipientName: current.recipientName || data.profile.fullName,
      phone: current.phone || data.profile.phone,
    }));
    setLoadingAccount(false);
  }, [user?.role]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!authLoading && !user) {
        window.location.assign("/login?redirect_url=/account");
        return;
      }

      if (user?.role === "customer") {
        void loadAccount();
      } else {
        setLoadingAccount(false);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [authLoading, loadAccount, user]);

  async function handleLogout() {
    await logout();
    window.location.assign("/");
  }

  async function savePhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPhone(true);
    setError("");

    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      setError(await readError(response));
    } else {
      await loadAccount();
    }

    setSavingPhone(false);
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAddress(true);
    setError("");

    const response = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressForm),
    });

    if (!response.ok) {
      setError(await readError(response));
      setSavingAddress(false);
      return;
    }

    setAddressForm({
      ...emptyAddress,
      recipientName: overview?.profile.fullName || "",
      phone: overview?.profile.phone || "",
    });
    setShowAddressForm(false);
    setSavingAddress(false);
    await loadAccount();
  }

  async function setDefaultAddress(addressId: string) {
    setError("");

    const response = await fetch(`/api/account/addresses/${addressId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });

    if (!response.ok) {
      setError(await readError(response));
      return;
    }

    await loadAccount();
  }

  async function deleteAddress(addressId: string) {
    if (!window.confirm("¿Eliminar esta dirección?")) return;

    setError("");
    const response = await fetch(`/api/account/addresses/${addressId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError(await readError(response));
      return;
    }

    await loadAccount();
  }

  if (authLoading || loadingAccount || (!user && customerAuthConfigured)) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-gray-600">Cargando tu cuenta…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center">
        <h1 className="text-3xl font-semibold">Inicia sesión</h1>
        <p className="mt-3 text-gray-600">
          Entra para consultar tus pedidos, direcciones y favoritos.
        </p>
        <Link
          href="/login?redirect_url=/account"
          className="mt-6 inline-flex rounded-full bg-[#4a2d23] px-6 py-3 text-white"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6b4a3f]">
              Cuenta administrativa
            </p>
            <h1 className="mt-3 text-4xl font-semibold">
              Hola, {user.fullName.split(" ")[0]}
            </h1>
            <p className="mt-2 text-gray-600">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="h-fit rounded-full border border-[#4a2d23] px-5 py-2 text-[#4a2d23]"
          >
            Cerrar sesión
          </button>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ["/admin/orders", "Pedidos", "Pagos, envíos y seguimiento"],
            ["/admin/customers", "Clientes", "Historial y contacto"],
            ["/admin/products", "Productos", "Catálogo e inventario"],
          ].map(([href, title, description]) => (
            <Link
              key={href}
              href={href}
              className="rounded-3xl border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold">No pudimos cargar tu cuenta</h1>
        <p className="mt-3 text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => void loadAccount()}
          className="mt-6 rounded-full bg-[#4a2d23] px-6 py-3 text-white"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
        <div className="flex items-center gap-5">
          {overview.profile.avatarUrl ? (
            <Image
              src={overview.profile.avatarUrl}
              alt=""
              width={64}
              height={64}
              unoptimized
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4a2d23] text-xl font-semibold text-white">
              {overview.profile.fullName.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-3xl font-semibold">
              Hola, {overview.profile.fullName}
            </h1>
            <p className="mt-1 text-gray-600">{overview.profile.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-full border border-black/15 px-5 py-2.5 text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <nav className="mt-8 flex gap-6 overflow-x-auto border-b border-black/15 text-sm" aria-label="Navegación de cuenta">
        {[
          ["inicio", "Inicio"],
          ["pedidos", "Pedidos"],
          ["recetas", "Recetas"],
          ["direcciones", "Direcciones"],
        ].map(([tab, label]) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab as AccountTab)} className={`whitespace-nowrap border-b-2 px-1 pb-3 transition ${activeTab === tab ? "border-[#4a2d23] text-[#4a2d23]" : "border-transparent text-gray-600 hover:border-[#4a2d23] hover:text-[#4a2d23]"}`}>
            {label}
          </button>
        ))}
        <Link href="/likes" className="whitespace-nowrap border-b-2 border-transparent px-1 pb-3 text-gray-600 transition hover:border-[#4a2d23] hover:text-[#4a2d23]">Favoritos</Link>
      </nav>

      {error && (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {(activeTab === "inicio" || activeTab === "pedidos") && <div id={activeTab} className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <section id="pedidos" className="border-t border-black/15 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Pedidos recientes</h2>
              <p className="mt-1 text-sm text-gray-600">
                Estado, pago y productos de tus compras.
              </p>
            </div>
            <Link href="/eyeglasses" className="text-sm underline">
              Comprar lentes
            </Link>
          </div>

          {overview.orders.length === 0 ? (
            <EmptyState
              title="Aún no tienes pedidos"
              description="Cuando compres con tu correo verificado, el pedido aparecerá aquí."
              href="/eyeglasses"
              action="Explorar lentes"
            />
          ) : (
            <div className="mt-6 divide-y">
              {overview.orders.map((order) => (
                <article key={order.orderNumber} className="py-5 first:pt-0">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">#{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatMoney(order.total)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {statusLabel(order.paymentStatus)} ·{" "}
                        {statusLabel(order.status)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    {order.items
                      .map((item) => `${item.quantity}× ${item.name}`)
                      .join(" · ")}
                  </p>
                  {order.trackingNumber && (
                    <p className="mt-2 text-xs text-gray-500">
                      Guía: {order.trackingNumber}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {activeTab === "inicio" && <section className="border-t border-black/15 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Datos personales</h2>
          <p className="mt-2 text-sm text-gray-600">{overview.profile.email}</p>
          <form onSubmit={savePhone} className="mt-6">
            <label className="text-sm font-medium">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="55 1234 5678"
              className="mt-2 w-full border border-black/20 bg-white px-4 py-3 outline-none placeholder:text-gray-400 focus:border-[#4a2d23]"
            />
            <button
              type="submit"
              disabled={savingPhone}
              className="mt-4 border border-[#4a2d23] px-5 py-3 text-sm font-medium text-[#4a2d23] transition hover:bg-[#4a2d23] hover:text-white disabled:opacity-60"
            >
              {savingPhone ? "Guardando…" : "Guardar teléfono"}
            </button>
          </form>
        </section>}
      </div>}

      {activeTab === "recetas" && <section id="recetas" className="mt-8 border-t border-black/15 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Recetas</h2>
        <p className="mt-2 text-sm text-gray-600">Consulta una receta aprobada o agrega una nueva cuando la tengas disponible.</p>
        <PatientIdentityPanel emailVerified={Boolean(overview.profile.emailVerified)} hasPhone={Boolean(overview.profile.phone)} />
      </section>}

      {activeTab === "direcciones" && <section id="direcciones" className="mt-8 border-t border-black/15 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Direcciones</h2>
            <p className="mt-1 text-sm text-gray-600">
              Guarda varias direcciones y elige una predeterminada.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddressForm((shown) => !shown)}
            className="rounded-full border border-[#4a2d23] px-5 py-2.5 text-sm text-[#4a2d23] transition hover:bg-[#4a2d23] hover:text-white"
          >
            {showAddressForm ? "Cancelar" : "Agregar dirección"}
          </button>
        </div>

        {showAddressForm && (
          <AddressEditor
            value={addressForm}
            onChange={setAddressForm}
            onSubmit={saveAddress}
            saving={savingAddress}
          />
        )}

        {overview.addresses.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-[#f7f3ee] p-5 text-sm text-gray-600">
            Todavía no tienes direcciones guardadas.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {overview.addresses.map((address) => (
              <article
                key={address.id}
                className={`rounded-2xl border p-5 ${
                  address.isDefault ? "border-[#4a2d23] bg-[#fdfaf7]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{address.label}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {address.recipientName}
                    </p>
                  </div>
                  {address.isDefault && (
                    <span className="rounded-full bg-[#4a2d23] px-3 py-1 text-xs text-white">
                      Predeterminada
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-700">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                  <br />
                  {address.phone}
                </p>
                <div className="mt-4 flex gap-4 text-sm">
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => void setDefaultAddress(address.id)}
                      className="underline"
                    >
                      Usar como principal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void deleteAddress(address.id)}
                    className="text-red-700 underline"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>}

      {activeTab === "inicio" && <section className="mt-8 border-t border-black/15 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Tiendas cercanas</h2>
        <p className="mt-2 text-sm text-gray-600">Visita una sucursal OLM. Mostramos las ubicaciones disponibles; no calculamos distancias sin una ubicación confiable.</p>
        <div className="mt-5 divide-y divide-black/10">
          {locations.map((location) => (
            <article key={location.slug} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <h3 className="font-semibold">{location.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{location.address}, {location.city}, {location.state} · C.P. {location.zipCode}</p>
              </div>
              <Link href={`/locations/${location.slug}`} className="text-sm font-medium text-[#4a2d23] underline underline-offset-4">Ver tienda</Link>
            </article>
          ))}
        </div>
      </section>}
    </div>
  );
}

function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="mt-6 rounded-2xl bg-[#f7f3ee] p-6 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
        {description}
      </p>
      <Link href={href} className="mt-4 inline-block text-sm underline">
        {action}
      </Link>
    </div>
  );
}

function AddressEditor({
  value,
  onChange,
  onSubmit,
  saving,
}: {
  value: AddressForm;
  onChange: (value: AddressForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  function update(field: keyof AddressForm, nextValue: string | boolean) {
    onChange({ ...value, [field]: nextValue });
  }

  function applyGoogleAddress(parts: { addressLine1: string; city: string; state: string; postalCode: string }) {
    onChange({ ...value, ...parts });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-2xl border border-[#d9cfc8] bg-[#fdfaf7] p-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-sm font-medium">Buscar dirección</p>
          <GoogleAddressAutocomplete onSelect={applyGoogleAddress} />
          <p className="mt-2 text-xs text-gray-500">Puedes escribirla manualmente si no aparece una sugerencia.</p>
        </div>
        <AddressField
          label="Etiqueta"
          value={value.label}
          onChange={(next) => update("label", next)}
          placeholder="Casa, oficina…"
        />
        <AddressField
          label="Nombre de quien recibe"
          value={value.recipientName}
          onChange={(next) => update("recipientName", next)}
        />
        <AddressField
          label="Teléfono"
          value={value.phone}
          onChange={(next) => update("phone", next)}
          type="tel"
        />
        <AddressField
          label="Calle, número y colonia"
          value={value.addressLine1}
          onChange={(next) => update("addressLine1", next)}
        />
        <AddressField
          label="Interior o referencia"
          value={value.addressLine2}
          onChange={(next) => update("addressLine2", next)}
          required={false}
        />
        <AddressField
          label="Ciudad"
          value={value.city}
          onChange={(next) => update("city", next)}
        />
        <AddressField
          label="Estado"
          value={value.state}
          onChange={(next) => update("state", next)}
        />
        <AddressField
          label="Código postal"
          value={value.postalCode}
          onChange={(next) => update("postalCode", next)}
        />
      </div>
      <label className="mt-4 flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={value.isDefault}
          onChange={(event) => update("isDefault", event.target.checked)}
        />
        Usar como dirección predeterminada
      </label>
      <button
        type="submit"
        disabled={saving}
        className="mt-5 rounded-full bg-[#4a2d23] px-6 py-3 text-sm text-white disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar dirección"}
      </button>
    </form>
  );
}

function AddressField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#4a2d23]"
      />
    </label>
  );
}
