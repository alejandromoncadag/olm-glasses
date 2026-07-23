"use client";

import { FormEvent, useEffect, useState } from "react";

type PaymentMethod = "stripe" | "store_payment";
type DeliveryMethod = "shipping" | "pickup";

type CheckoutCustomer = {
  fullName: string;
  email: string;
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
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  customerNotes: "",
  deliveryMethod: "shipping",
  paymentMethod: "stripe",
};

const deliveryOptions: {
  value: DeliveryMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "shipping",
    label: "Envío a domicilio",
    description: "Enviaremos tu pedido a la dirección que escribas.",
  },
  {
    value: "pickup",
    label: "Recoger en tienda",
    description: "Te avisaremos cuando tu pedido esté listo para recoger.",
  },
];

const paymentOptions: {
  value: PaymentMethod;
  label: string;
  description: string;
}[] = [
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

function validateCustomer(customer: CheckoutCustomer) {
  const errors: FormErrors = {};

  if (!customer.fullName.trim()) {
    errors.fullName = "El nombre completo es obligatorio.";
  }

  if (!customer.email.trim()) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    errors.email = "Escribe un correo electrónico válido.";
  }

  if (!customer.phone.trim()) {
    errors.phone = "El teléfono es obligatorio.";
  }

  if (!customer.deliveryMethod) {
    errors.deliveryMethod = "Selecciona una forma de entrega.";
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

  if (customer.customerNotes.length > 500) {
    errors.customerNotes = "La nota no puede tener más de 500 caracteres.";
  }

  if (!customer.paymentMethod) {
    errors.paymentMethod = "Selecciona una forma de pago.";
  }

  return errors;
}

export default function CheckoutForm() {
  const [customer, setCustomer] = useState<CheckoutCustomer>(emptyCustomer);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedCustomer = localStorage.getItem("olm-checkout-customer");

    if (!savedCustomer) {
      return;
    }

    try {
      const parsedCustomer = JSON.parse(
        savedCustomer
      ) as Partial<CheckoutCustomer>;

      const timeoutId = window.setTimeout(() => {
        setCustomer({
          ...emptyCustomer,
          ...parsedCustomer,
          customerNotes: parsedCustomer.customerNotes || "",
          deliveryMethod: isDeliveryMethod(parsedCustomer.deliveryMethod)
            ? parsedCustomer.deliveryMethod
            : "shipping",
          paymentMethod: isPaymentMethod(parsedCustomer.paymentMethod)
            ? parsedCustomer.paymentMethod
            : "stripe",
        });
      }, 0);

      return () => window.clearTimeout(timeoutId);
    } catch (error) {
      console.error("Could not read checkout customer:", error);
      localStorage.removeItem("olm-checkout-customer");
    }
  }, []);

  function saveCustomerToStorage(updatedCustomer: CheckoutCustomer) {
    localStorage.setItem(
      "olm-checkout-customer",
      JSON.stringify(updatedCustomer)
    );

    window.dispatchEvent(new Event("olm-checkout-customer-updated"));
  }

  function updateCustomer(field: keyof CheckoutCustomer, value: string) {
    const updatedCustomer = {
      ...customer,
      [field]: value,
      ...(field === "deliveryMethod" && value === "shipping"
        ? { paymentMethod: "stripe" as PaymentMethod }
        : {}),
    } as CheckoutCustomer;

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

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-2xl font-semibold">Datos del pedido</h2>

          <p className="mt-2 text-sm text-gray-600">
            Usaremos estos datos para preparar y dar seguimiento a tu pedido.
          </p>
        </div>

        {saved && (
          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            Datos guardados
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-5">
        <label className="block">
          <span className="text-sm font-medium">Nombre completo</span>
          <input
            value={customer.fullName}
            onChange={(event) => updateCustomer("fullName", event.target.value)}
            required
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="Alejandro Moncada"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
          )}
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Correo electrónico</span>
            <input
              type="email"
              value={customer.email}
              onChange={(event) => updateCustomer("email", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="correo@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Teléfono</span>
            <input
              type="tel"
              value={customer.phone}
              onChange={(event) => updateCustomer("phone", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="55 1234 5678"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </label>
        </div>

        <div className="rounded-2xl bg-gray-50 p-5">
          <h3 className="text-xl font-semibold">Forma de entrega</h3>

          <p className="mt-2 text-sm text-gray-600">
            Elige si quieres recibir tu pedido en casa o recogerlo en tienda.
          </p>

          <div className="mt-5 grid gap-3">
            {deliveryOptions.map((option) => (
              <label
                key={option.value}
                className={`block cursor-pointer rounded-2xl border bg-white p-4 ${
                  customer.deliveryMethod === option.value ? "border-black" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={customer.deliveryMethod === option.value}
                    onChange={() =>
                      updateCustomer("deliveryMethod", option.value)
                    }
                    className="mt-1"
                  />

                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {option.description}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {errors.deliveryMethod && (
            <p className="mt-3 text-sm text-red-600">
              {errors.deliveryMethod}
            </p>
          )}
        </div>

        {customer.deliveryMethod === "shipping" ? (
          <>
            <label className="block">
              <span className="text-sm font-medium">Dirección</span>
              <input
                value={customer.address}
                onChange={(event) =>
                  updateCustomer("address", event.target.value)
                }
                required
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                placeholder="Calle, número, colonia"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </label>

            <div className="grid gap-5 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium">Ciudad</span>
                <input
                  value={customer.city}
                  onChange={(event) =>
                    updateCustomer("city", event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                  placeholder="Ciudad"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-medium">Estado</span>
                <input
                  value={customer.state}
                  onChange={(event) =>
                    updateCustomer("state", event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                  placeholder="Estado"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-medium">Código postal</span>
                <input
                  value={customer.zipCode}
                  onChange={(event) =>
                    updateCustomer("zipCode", event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                  placeholder="00000"
                />
                {errors.zipCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                )}
              </label>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="font-semibold text-blue-950">Recoger en tienda</h3>

            <p className="mt-2 text-sm text-blue-900">
              No necesitas escribir dirección. Te contactaremos cuando el pedido
              esté listo para recoger en la óptica.
            </p>
          </div>
        )}

        <label className="block rounded-2xl bg-gray-50 p-5">
          <span className="text-xl font-semibold">Notas para tu pedido</span>

          <p className="mt-2 text-sm text-gray-600">
            Puedes agregar instrucciones sobre tu graduación, envío o cualquier
            detalle importante.
          </p>

          <textarea
            value={customer.customerNotes}
            onChange={(event) =>
              updateCustomer("customerNotes", event.target.value)
            }
            rows={4}
            maxLength={500}
            className="mt-4 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-black"
            placeholder="Ejemplo: Voy a enviar mi receta por WhatsApp. Por favor llámenme antes de enviar."
          />

          <div className="mt-2 flex justify-between gap-3 text-xs text-gray-500">
            <span>Opcional</span>
            <span>{customer.customerNotes.length}/500</span>
          </div>

          {errors.customerNotes && (
            <p className="mt-2 text-sm text-red-600">{errors.customerNotes}</p>
          )}
        </label>
      </div>

      <div className="mt-8 rounded-2xl bg-gray-50 p-5">
        <h3 className="text-xl font-semibold">Forma de pago</h3>

        <p className="mt-2 text-sm text-gray-600">
          Stripe protege tus datos de pago. Óptica OLM nunca recibe ni guarda el
          número completo de tu tarjeta.
        </p>

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
              className={`block cursor-pointer rounded-2xl border bg-white p-4 ${
                customer.paymentMethod === option.value ? "border-black" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={customer.paymentMethod === option.value}
                  onChange={() => updateCustomer("paymentMethod", option.value)}
                  className="mt-1"
                />

                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {option.description}
                  </p>
                </div>
              </div>
            </label>
            ))}
        </div>

        {customer.paymentMethod === "stripe" && (
          <div className="mt-4 rounded-2xl border border-[#d9cfc8] bg-white p-4 text-sm text-gray-600">
            Visa, Mastercard, American Express, OXXO y SPEI. Apple Pay o Google
            Pay pueden aparecer cuando estén disponibles en tu dispositivo y en
            tu cuenta de Stripe.
          </div>
        )}

        {errors.paymentMethod && (
          <p className="mt-3 text-sm text-red-600">{errors.paymentMethod}</p>
        )}
      </div>

      <button
        type="submit"
        className="mt-6 rounded-full bg-[var(--brand-espresso)] px-6 py-3 text-white transition hover:bg-[#2a1710]"
      >
        Guardar datos del pedido
      </button>

      <p className="mt-3 text-xs text-gray-500">
        Después de guardar, revisa el resumen y continúa al pago seguro.
      </p>
    </form>
  );
}



