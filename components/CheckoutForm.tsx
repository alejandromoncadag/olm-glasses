"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumber,
  type Country,
} from "react-phone-number-input";
import { useAuth } from "@/hooks/useAuth";

type PaymentMethod = "stripe" | "store_payment";
type DeliveryMethod = "shipping" | "pickup";

type CheckoutCustomer = {
  firstName: string;
  middleName: string;
  paternalLastName: string;
  maternalLastName: string;
  fullName: string;
  email: string;
  phoneCountry: string;
  phoneNational: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  customerNotes: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
};

type FormErrors = Partial<Record<keyof CheckoutCustomer, string>>;

const emptyCustomer: CheckoutCustomer = {
  firstName: "",
  middleName: "",
  paternalLastName: "",
  maternalLastName: "",
  fullName: "",
  email: "",
  phoneCountry: "MX",
  phoneNational: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  customerNotes: "",
  deliveryMethod: "shipping",
  paymentMethod: "stripe",
};

const deliveryOptions: Array<{ value: DeliveryMethod; label: string }> = [
  { value: "shipping", label: "Envío a domicilio" },
  { value: "pickup", label: "Recoger en tienda" },
];

const paymentOptions: Array<{
  value: PaymentMethod;
  label: string;
  description: string;
}> = [
  {
    value: "stripe",
    label: "Pago en línea seguro",
    description:
      "Elige tarjeta, OXXO o transferencia SPEI en el portal seguro de Stripe.",
  },
  {
    value: "store_payment",
    label: "Pago en tienda",
    description: "Disponible únicamente cuando recoges tu pedido en la óptica.",
  },
];

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "stripe" || value === "store_payment";
}

function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return value === "shipping" || value === "pickup";
}

function getFlagEmoji(country: string) {
  return country
    .toUpperCase()
    .replace(/./g, (character) =>
      String.fromCodePoint(127397 + character.charCodeAt(0))
    );
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  if (parts.length === 2) {
    return { firstName: parts[0], paternalLastName: parts[1] };
  }
  if (parts.length === 3) {
    return {
      firstName: parts[0],
      paternalLastName: parts[1],
      maternalLastName: parts[2],
    };
  }

  return {
    firstName: parts[0],
    middleName: parts.slice(1, -2).join(" "),
    paternalLastName: parts[parts.length - 2],
    maternalLastName: parts[parts.length - 1],
  };
}

function buildFullName(customer: Partial<CheckoutCustomer>) {
  return [
    customer.firstName,
    customer.middleName,
    customer.paternalLastName,
    customer.maternalLastName,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");
}

function buildInternationalPhone(country: string, nationalNumber: string) {
  const safeCountry = (country || "MX") as Country;
  const digits = nationalNumber.replace(/\D/g, "");
  if (!digits) return "";

  try {
    return `+${getCountryCallingCode(safeCountry)}${digits}`;
  } catch {
    return digits;
  }
}

function normalizeCustomer(value: Partial<CheckoutCustomer>) {
  const inferredNames =
    value.firstName || value.paternalLastName
      ? {}
      : splitFullName(String(value.fullName || ""));
  let phoneCountry = String(value.phoneCountry || "MX");
  let phoneNational = String(value.phoneNational || "");

  if (!phoneNational && value.phone) {
    try {
      const parsedPhone = parsePhoneNumber(String(value.phone));
      phoneCountry = parsedPhone?.country || phoneCountry;
      phoneNational = parsedPhone?.nationalNumber || String(value.phone);
    } catch {
      phoneNational = String(value.phone);
    }
  }

  const normalized: CheckoutCustomer = {
    ...emptyCustomer,
    ...value,
    ...inferredNames,
    phoneCountry,
    phoneNational,
    customerNotes: "",
    deliveryMethod: isDeliveryMethod(value.deliveryMethod)
      ? value.deliveryMethod
      : "shipping",
    paymentMethod: isPaymentMethod(value.paymentMethod)
      ? value.paymentMethod
      : "stripe",
  };

  normalized.fullName = buildFullName(normalized);
  normalized.phone = buildInternationalPhone(
    normalized.phoneCountry,
    normalized.phoneNational
  );

  return normalized;
}

function validateCustomer(customer: CheckoutCustomer) {
  const errors: FormErrors = {};

  if (!customer.firstName.trim()) {
    errors.firstName = "El primer nombre es obligatorio.";
  }

  if (!customer.paternalLastName.trim()) {
    errors.paternalLastName = "El primer apellido es obligatorio.";
  }

  if (!customer.email.trim()) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    errors.email = "Escribe un correo electrónico válido.";
  }

  if (!customer.phoneNational.replace(/\D/g, "")) {
    errors.phoneNational = "El teléfono es obligatorio.";
  }

  if (customer.deliveryMethod === "shipping") {
    if (!customer.address.trim()) {
      errors.address = "La dirección es obligatoria para envío a domicilio.";
    }
    if (!customer.city.trim()) {
      errors.city = "La ciudad es obligatoria para envío a domicilio.";
    }
    if (!customer.state.trim()) {
      errors.state = "El estado es obligatorio para envío a domicilio.";
    }
    if (!customer.zipCode.trim()) {
      errors.zipCode = "El código postal es obligatorio para envío a domicilio.";
    }
  }

  return errors;
}

export default function CheckoutForm() {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<CheckoutCustomer>(emptyCustomer);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);
  const customerUserId = user?.role === "customer" ? user.id : null;
  const countryNames = useMemo(
    () => new Intl.DisplayNames(["es"], { type: "region" }),
    []
  );
  const countries = useMemo(
    () =>
      getCountries()
        .map((country) => ({
          code: country,
          name: countryNames.of(country) || country,
          callingCode: getCountryCallingCode(country),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [countryNames]
  );

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      let nextCustomer = { ...emptyCustomer };
      const savedCustomer = localStorage.getItem("olm-checkout-customer");

      if (savedCustomer) {
        try {
          nextCustomer = normalizeCustomer(JSON.parse(savedCustomer));
        } catch (error) {
          console.error("Could not read checkout customer:", error);
          localStorage.removeItem("olm-checkout-customer");
        }
      }

      if (customerUserId) {
        const response = await fetch("/api/account");

        if (response.ok) {
          const account = await response.json();
          const defaultAddress = Array.isArray(account.addresses)
            ? account.addresses.find(
                (address: { isDefault?: boolean }) => address.isDefault
              ) || account.addresses[0]
            : null;

          nextCustomer = normalizeCustomer({
            ...nextCustomer,
            fullName:
              nextCustomer.fullName || String(account.profile?.fullName || ""),
            email: String(account.profile?.email || nextCustomer.email),
            phone:
              nextCustomer.phone ||
              String(defaultAddress?.phone || account.profile?.phone || ""),
            address:
              nextCustomer.address || String(defaultAddress?.addressLine1 || ""),
            city: nextCustomer.city || String(defaultAddress?.city || ""),
            state: nextCustomer.state || String(defaultAddress?.state || ""),
            zipCode:
              nextCustomer.zipCode || String(defaultAddress?.postalCode || ""),
          });
        }
      }

      if (!cancelled) {
        setCustomer(nextCustomer);
        saveCustomerToStorage(nextCustomer);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [customerUserId]);

  function saveCustomerToStorage(updatedCustomer: CheckoutCustomer) {
    localStorage.setItem(
      "olm-checkout-customer",
      JSON.stringify(updatedCustomer)
    );
    window.dispatchEvent(new Event("olm-checkout-customer-updated"));
  }

  function updateCustomer(field: keyof CheckoutCustomer, value: string) {
    const updatedCustomer = normalizeCustomer({
      ...customer,
      [field]: value,
      ...(field === "deliveryMethod" && value === "shipping"
        ? { paymentMethod: "stripe" as PaymentMethod }
        : {}),
    });

    setCustomer(updatedCustomer);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      ...(field === "deliveryMethod" && value === "pickup"
        ? {
            address: undefined,
            city: undefined,
            state: undefined,
            zipCode: undefined,
          }
        : {}),
    }));
    setSaved(false);
    saveCustomerToStorage(updatedCustomer);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateCustomer(customer);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSaved(false);
      return;
    }

    saveCustomerToStorage(customer);
    setSaved(true);
  }

  const inputClass =
    "mt-2 w-full border border-black/20 bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-espresso)]";

  return (
    <form onSubmit={handleSubmit} className="border border-black/15 p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-2xl">Datos del pedido</h2>
          <p className="mt-2 text-sm text-gray-600">
            Usaremos estos datos para preparar y dar seguimiento a tu pedido.
          </p>
        </div>
        {saved && (
          <span className="bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            Datos guardados
          </span>
        )}
      </div>

      <div className="mt-7 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Primer nombre"
            value={customer.firstName}
            onChange={(value) => updateCustomer("firstName", value)}
            error={errors.firstName}
            autoComplete="given-name"
            required
          />
          <TextField
            label="Segundo nombre"
            value={customer.middleName}
            onChange={(value) => updateCustomer("middleName", value)}
            autoComplete="additional-name"
          />
          <TextField
            label="Primer apellido"
            value={customer.paternalLastName}
            onChange={(value) => updateCustomer("paternalLastName", value)}
            error={errors.paternalLastName}
            autoComplete="family-name"
            required
          />
          <TextField
            label="Segundo apellido"
            value={customer.maternalLastName}
            onChange={(value) => updateCustomer("maternalLastName", value)}
            autoComplete="family-name"
          />
        </div>

        <label className="block">
          <span className="text-sm font-medium">Correo electrónico</span>
          <input
            type="email"
            value={customer.email}
            onChange={(event) => updateCustomer("email", event.target.value)}
            readOnly={Boolean(customerUserId)}
            required
            autoComplete="email"
            className={`${inputClass} read-only:bg-gray-50 read-only:text-gray-600`}
            placeholder="correo@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </label>

        <div>
          <span className="text-sm font-medium">Teléfono</span>
          <div className="mt-2 grid grid-cols-[minmax(155px,0.7fr)_minmax(0,1.3fr)]">
            <select
              value={customer.phoneCountry}
              onChange={(event) =>
                updateCustomer("phoneCountry", event.target.value)
              }
              aria-label="País y código telefónico"
              className="min-w-0 border border-r-0 border-black/20 bg-[#f7f3ee] px-3 py-3 outline-none focus:border-[var(--brand-espresso)]"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {getFlagEmoji(country.code)} {country.name} +{country.callingCode}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={customer.phoneNational}
              onChange={(event) =>
                updateCustomer("phoneNational", event.target.value)
              }
              required
              autoComplete="tel-national"
              className="min-w-0 border border-black/20 px-4 py-3 outline-none focus:border-[var(--brand-espresso)]"
              placeholder="55 1234 5678"
            />
          </div>
          {errors.phoneNational && (
            <p className="mt-1 text-sm text-red-600">{errors.phoneNational}</p>
          )}
        </div>

        <div className="border border-black/10 bg-[#faf8f5] p-5">
          <h3 className="text-xl">Forma de entrega</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {deliveryOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer border bg-white p-4 transition ${
                  customer.deliveryMethod === option.value
                    ? "border-[var(--brand-espresso)]"
                    : "border-black/15 hover:border-black/40"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={customer.deliveryMethod === option.value}
                    onChange={() =>
                      updateCustomer("deliveryMethod", option.value)
                    }
                  />
                  <span className="font-medium">{option.label}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {customer.deliveryMethod === "shipping" && (
          <div className="grid gap-5 border-t border-black/10 pt-6">
            <label className="block">
              <span className="text-sm font-medium">Buscar o escribir dirección</span>
              <input
                value={customer.address}
                onChange={(event) =>
                  updateCustomer("address", event.target.value)
                }
                required
                autoComplete="street-address"
                className={inputClass}
                placeholder="Calle, número y colonia"
              />
              <p className="mt-2 text-xs leading-5 text-gray-500">
                El autollenado guardado de tu navegador está habilitado. La búsqueda
                inteligente completa con mapas se activará al conectar un proveedor de direcciones.
              </p>
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </label>

            <div className="grid gap-5 md:grid-cols-3">
              <TextField
                label="Ciudad"
                value={customer.city}
                onChange={(value) => updateCustomer("city", value)}
                error={errors.city}
                autoComplete="address-level2"
                required
              />
              <TextField
                label="Estado"
                value={customer.state}
                onChange={(value) => updateCustomer("state", value)}
                error={errors.state}
                autoComplete="address-level1"
                required
              />
              <TextField
                label="Código postal"
                value={customer.zipCode}
                onChange={(value) => updateCustomer("zipCode", value)}
                error={errors.zipCode}
                autoComplete="postal-code"
                required
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 border border-black/10 bg-[#faf8f5] p-5">
        <h3 className="text-xl">Forma de pago</h3>
        <div className="mt-5 grid gap-3">
          {paymentOptions
            .filter(
              (option) =>
                option.value === "stripe" ||
                customer.deliveryMethod === "pickup"
            )
            .map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer border bg-white p-4 ${
                  customer.paymentMethod === option.value
                    ? "border-[var(--brand-espresso)]"
                    : "border-black/15"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={customer.paymentMethod === option.value}
                    onChange={() =>
                      updateCustomer("paymentMethod", option.value)
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{option.label}</span>
                    <span className="mt-1 block text-sm text-gray-600">
                      {option.description}
                    </span>
                  </span>
                </span>
              </label>
            ))}
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 bg-[var(--brand-espresso)] px-6 py-3 text-white transition hover:bg-[#2a1710]"
      >
        Guardar datos del pedido
      </button>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  autoComplete,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="mt-2 w-full border border-black/20 px-4 py-3 outline-none transition focus:border-[var(--brand-espresso)]"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}
